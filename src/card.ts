// Node card measurement: sizes and row layout shared by the SVG renderer and
// the auto layout (both need identical geometry, and layout.ts must stay
// DOM-free so it can run headless in tests).
import { FsmModel } from './model';
import { XfsInstance } from './xfs';

export interface CardMetrics {
  w: number;
  h: number;
  colorIdx: number;
  name: string;
  isInit: boolean;
  infoLines: string[];
  rows: { idx: number; text: string; cond: string; condLines: string[]; dst: number }[];
  inRows: { src: number; lidx: number; text: string; cond: string; condLines: string[] }[];
  inColW: number;
  outColW: number;
}

/** card grid: header band height, row line height, rows start this far below
 *  the header. Renderer, edge anchors and reorder hit-tests all share these. */
export const HEADER_H = 24;
export const ROW_H = 16;
export const ROW_TOP = 2;

export function textW(s: string): number {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 0x2e80 ? 11 : 6.5;
  return w;
}

export function clip(s: string, maxW: number): string {
  let w = 0;
  const chars = Array.from(s);
  for (let i = 0; i < chars.length; i++) {
    w += chars[i].charCodeAt(0) > 0x2e80 ? 11 : 6.5;
    if (w > maxW) return chars.slice(0, i).join('') + '…';
  }
  return s;
}

/** card header colors, shared by renderer and layout */
export const COLOR_PALETTE = ['#8a8f98', '#4f8ef7', '#e05555', '#e8c33a', '#54c46a', '#a86ee0', '#38c7d8', '#e08a3a'];

/** full condition tag for a link: "c116 R & 練気ゲージ判定(気刃斬りIII".
 *  Untruncated — rows wrap onto extra lines instead of clipping. */
export function condTagOf(model: FsmModel, lk: XfsInstance): string {
  const condId = model.getNum(lk, 'mConditionId');
  const hasCond = model.getNum(lk, 'mExistCondition') === 1;
  if (!hasCond) return '';
  const tree = model.conditions()[condId];
  if (!tree) return `c${condId}`;
  const sum = model.conditionSummary(tree).replace(/^#\d+:\s*/, '');
  return sum === '(空条件)' ? `c${condId}` : `c${condId} ${sum}`;
}

/** split a condition tag into stacked display lines: "c116 R" on the first
 *  line, then one line per further operand prefixed with its joining
 *  operator — the condition tree's top level is exactly the &/| chain */
export function condLines(tag: string): string[] {
  const head = tag.match(/^c\d+\s*/)?.[0] ?? '';
  const rest = tag.slice(head.length);
  const id = head.trim();
  if (!rest) return id ? [id] : [];
  const parts = rest.split(/ ([&|]) /); // "A & B | C" → ["A","&","B","|","C"]
  const lines = [id ? `${id} ${parts[0]}` : parts[0]];
  for (let i = 1; i + 1 < parts.length; i += 2) lines.push(`${parts[i]} ${parts[i + 1]}`);
  return lines;
}

/** cumulative first-line index of each row, from its line count — multi-line
 *  condition rows push the rows below them down */
export function lineOffsets(spans: number[]): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const s of spans) { out.push(acc); acc += Math.max(1, s); }
  return out;
}

/** width a row needs: the link name shares line 0 with the first condition
 *  line; continuation lines stand alone (plus indent) */
function rowNeed(text: string, lines: string[]): number {
  let need = textW(text) + textW(lines[0] ?? '') + 30;
  for (let i = 1; i < lines.length; i++) need = Math.max(need, textW(lines[i]) + 24);
  return need;
}

export function measureCard(model: FsmModel, nd: XfsInstance, id: number, initId: number): CardMetrics {
  const name = model.str(nd, 'mName') || `(id ${id})`;
  const act = model.nodeActionNo(nd);
  const motion = model.nodeMotionNo(nd);
  const links = model.linksOf(nd);
  const isInit = id === initId;
  const outRows = links.map((lk, i) => {
    const dst = model.getNum(lk, 'mDestinationNodeId');
    const cond = condTagOf(model, lk);
    return { idx: i, text: model.str(lk, 'mName') || `→ ${dst}`, cond, condLines: condLines(cond), dst };
  });

  // in-edges: one row per incoming link (source name + condition), all shown
  const inRows: CardMetrics['inRows'] = [];
  for (const srcNode of model.nodes()) {
    const srcId = model.getNum(srcNode, 'mId');
    model.linksOf(srcNode).forEach((lk, lidx) => {
      if (model.getNum(lk, 'mDestinationNodeId') !== id) return;
      const cond = condTagOf(model, lk);
      inRows.push({ src: srcId, lidx, text: model.str(srcNode, 'mName') || `← ${srcId}`, cond, condLines: condLines(cond) });
    });
  }

  const infoLines: string[] = [];
  if (isInit) infoLines.push('▶初始');
  if (act !== null) infoLines.push(`act ${act}`);
  if (motion) infoLines.push(`mot ${motion.motion}${motion.phase ? `/p${motion.phase}` : ''}`);
  infoLines.push(`#${id}`);

  const OUT_MIN = 96;
  const OUT_MAX = 330;
  const IN_MIN = 60;
  const IN_MAX = 240;
  const CARD_MAX = 640;
  const INFO_W = Math.max(56, ...infoLines.map((l) => textW(l) + 14));
  const outW = outRows.length || links.length
    ? Math.max(OUT_MIN, Math.min(OUT_MAX, Math.max(...outRows.map((r) => rowNeed(r.text, r.condLines)))))
    : 0;
  const inW = inRows.length
    ? Math.max(IN_MIN, Math.min(IN_MAX, Math.max(...inRows.map((r) => rowNeed(r.text, r.condLines)))))
    : 0;
  const nameW = textW(name) + 22;
  // columns: [8 + inColW + 8 | INFO_W | gap | outColW + 6] — pad so info text
  // never runs into the out column
  const W = Math.min(CARD_MAX, Math.max(216, nameW, inW + INFO_W + outW + 38));
  const outLines = outRows.reduce((a, r) => a + Math.max(1, r.condLines.length), 0);
  const inLines = inRows.reduce((a, r) => a + Math.max(1, r.condLines.length), 0);
  const H = HEADER_H + Math.max(outLines, inLines, 3) * ROW_H + 12;
  return {
    w: W,
    h: H,
    colorIdx: model.getNum(nd, 'mColorType') % COLOR_PALETTE.length,
    name, isInit, infoLines,
    rows: outRows,
    inRows,
    inColW: inW,
    outColW: outW,
  };
}
