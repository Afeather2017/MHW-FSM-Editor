// Node test runner: byte-level round-trip verification against real samples.
// Run via `npm test` (esbuild bundle -> node).
import * as fs from 'fs';
import { parseXfs, writeXfs, XfsDoc, XfsInstance, isInstance } from '../src/xfs';
import { parseMtXml, writeMtXml } from '../src/fsmxml';
import { FsmModel } from '../src/model';
import { condLines, measureCard, textW } from '../src/card';

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = ''): void {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.error(`FAIL  ${name} ${detail}`); }
}

function walkInstances(root: XfsInstance, fn: (inst: XfsInstance) => void): void {
  const visit = (v: unknown): void => {
    if (v && typeof v === 'object') {
      if ('__vals__' in (v as Record<string, unknown>)) {
        const inst = v as XfsInstance;
        fn(inst);
        for (const val of Object.values(inst.__vals__)) {
          if (Array.isArray(val)) val.forEach(visit);
          else visit(val);
        }
      }
    }
  };
  visit(root);
}

// real sample files; on machines without the game install the repo-local
// copies under fsm/ are used (same wp03_action.fsm as the deployed one)
function firstExisting(...paths: string[]): string | null {
  for (const p of paths) if (fs.existsSync(p)) return p;
  return null;
}
const DEPLOYED = firstExisting(
  'E:/SteamLibrary/steamapps/common/Monster Hunter World/nativePC/hm/wp/wp03/wp03_action.fsm',
  'fsm/wp03_action.fsm',
)!;
const VANILLA = firstExisting(
  'E:/MHW-arts/wp03_action.vanilla-seek2thrust.fsm',
  'fsm/wp03_action - 副本.fsm',
)!;

console.log('== XFS binary round-trip ==');
for (const path of [DEPLOYED, VANILLA]) {
  const label = path.split('/').pop();
  const orig = fs.readFileSync(path);
  let doc: XfsDoc;
  try {
    doc = parseXfs(orig);
    check(`${label}: parse`, true);
  } catch (e) {
    check(`${label}: parse`, false, String(e));
    continue;
  }
  const out = writeXfs(doc);
  check(`${label}: write byte-identical`, Buffer.compare(Buffer.from(out), orig) === 0,
    `len ${out.length} vs ${orig.length}`);
}

// structural checks on the deployed file
{
  const doc = parseXfs(fs.readFileSync(DEPLOYED));
  const rootCluster = doc.root.__vals__['mpRootCluster'] as XfsInstance;
  const nodes = rootCluster.__vals__['mpNodeList'];
  check('deployed: root name', doc.rootName === 'cFSMPl_W03', doc.rootName);
  check('deployed: 90 nodes', Array.isArray(nodes) && nodes.length === 90, String(Array.isArray(nodes) ? nodes.length : typeof nodes));
  const ct = doc.root.__vals__['mpConditionTree'] as XfsInstance;
  const trees = ct.__vals__['mpTreeList'];
  check('deployed: 307 condition trees', Array.isArray(trees) && trees.length === 307);
  // class names resolved
  const nodeDef = doc.defs[(nodes as XfsInstance[])[0].__class__];
  check('deployed: node class named', nodeDef.name === 'cAIFSMNode', nodeDef.name);
  // class count in header == instances written
  let count = 0;
  walkInstances(doc.root, () => count++);
  check('deployed: 2980 instances', count === 2980, String(count));
}

console.log('== MtSerializer XML ==');
{
  // no shipped XML sample needed: derive one from the binary sample, then
  // verify parse(write(parse)) is structurally identical
  const doc = parseXfs(fs.readFileSync(DEPLOYED));
  const text = writeMtXml(doc);
  const parsed = parseMtXml(text);
  check('xml: root name', parsed.rootName === 'cFSMPl_W03', parsed.rootName);
  const rootCluster = parsed.root.__vals__['mpRootCluster'] as XfsInstance;
  const nodes = rootCluster.__vals__['mpNodeList'] as XfsInstance[];
  check('xml: 90 nodes', Array.isArray(nodes) && nodes.length === 90, String(nodes?.length));
  const out = writeMtXml(parsed);
  fs.mkdirSync('.tmp', { recursive: true });
  fs.writeFileSync('.tmp/wp03_action.roundtrip.xml', out, 'utf-8');
  const re = parseMtXml(out);
  check('xml: parse(write(parse)) == parse', JSON.stringify(re.root) === JSON.stringify(parsed.root));
  // semantic comparison against the binary parse of the same FSM version is
  // not possible (files differ); we check field presence instead
  const node0 = nodes[0];
  check('xml: node0 has mName + ActionNo chain',
    typeof node0.__vals__['mName'] === 'string' && !!node0.__vals__['mpProcessList']);
}

console.log('== XML -> binary conversion ==');
{
  const doc = parseXfs(fs.readFileSync(DEPLOYED));
  const text = writeMtXml(doc);
  const doc2 = parseMtXml(text);
  const out = writeXfs(doc2);
  const re = parseXfs(out);
  check('xml->bin: reparses cleanly', true);
  check('xml->bin: root name preserved', re.rootName === doc.rootName);
  check('xml->bin: instance count plausible', out.length > 1000, String(out.length));
  fs.mkdirSync('.tmp', { recursive: true });
  fs.writeFileSync('.tmp/wp03_action.xml2bin.fsm', out);
}

console.log('== editing operations ==');
{
  const m = FsmModel.fromBinary(fs.readFileSync(DEPLOYED), 'wp03_action.fsm');
  check('edit: pristine validates clean', m.validate().length === 0, m.validate().join('; '));

  // single-child condition trees are stored unboxed (not as an array);
  // summaries must read them through memberList() or call them "empty"
  check('summary: single-variable condition renders',
    m.conditionSummary(m.conditions()[0]) === '#0: △', m.conditionSummary(m.conditions()[0]));
  const findRoot = (op: number) => m.conditions().find((c) => {
    const r = c.__vals__['mpRootNode'];
    return isInstance(r) && m.getNum(r, 'mOperator') === op;
  });
  const orCond = findRoot(17);
  const andCond = findRoot(16);
  check('summary: OR group uses |', !!orCond && m.conditionSummary(orCond).includes(' | '), orCond && m.conditionSummary(orCond));
  check('summary: AND group uses &', !!andCond && m.conditionSummary(andCond).includes(' & '), andCond && m.conditionSummary(andCond));
  // "(空条件)" may only appear for a genuinely empty tree: a childless
  // operator-0 (直通) root node — an always-true passthrough condition
  const genuinelyEmpty = m.conditions().filter((c) => {
    const r = c.__vals__['mpRootNode'];
    return isInstance(r) && m.defName(r.__class__).endsWith('OperationNode')
      && m.getNum(r, 'mOperator') === 0 && m.memberList(r, 'mpChildList').length === 0;
  }).length;
  const labeledEmpty = m.conditions().filter((c) => m.conditionSummary(c).includes('(空条件)')).length;
  check('summary: "empty" only for passthrough conditions', labeledEmpty === genuinelyEmpty,
    `${labeledEmpty} labeled vs ${genuinelyEmpty} truly empty`);

  m.snapshot();
  const cond = m.addCondition();
  const node = m.newNode('测试节点');
  m.setNodeActionNo(node, 123);
  m.addLink(node, 0, cond.index);
  const nodes2 = m.nodes();
  check('edit: node added', nodes2.length === 91);
  check('edit: actionNo set', m.nodeActionNo(node) === 123, String(m.nodeActionNo(node)));
  check('edit: link added', m.linksOf(node).length === 1);
  check('edit: condition added', m.conditions().length === 308);

  const bytes = m.toBinary();
  const m2 = FsmModel.fromBinary(bytes, 'roundtrip.fsm');
  check('edit: edited binary reparses', true);
  check('edit: edited node survives round-trip',
    m2.nodes().some((nd) => m2.str(nd, 'mName') === '测试节点' && m2.nodeActionNo(nd) === 123));
  const node2 = m2.nodes().find((nd) => m2.str(nd, 'mName') === '测试节点')!;
  check('edit: link survives round-trip', m2.linksOf(node2).length === 1);

  m2.snapshot();
  const before = m2.conditions().length;
  m2.deleteCondition(cond.index);
  check('edit: condition deleted', m2.conditions().length === before - 1);
  check('edit: dangling link made unconditional',
    m2.linksOf(node2).every((lk) => m2.getNum(lk, 'mExistCondition') === 0));
  check('edit: validates clean after deletion', m2.validate().length === 0, m2.validate().join('; '));

  m2.undo();
  check('edit: undo restores condition count', m2.conditions().length === before);

  // action/motion node creation (XFsm-compatible processes)
  const m3 = FsmModel.fromBinary(fs.readFileSync(DEPLOYED), 'w3.fsm');
  m3.snapshot();
  const an = m3.newNode('新Action节点', 'action');
  const mn = m3.newNode('新Motion节点', 'motion');
  check('edit: action node ActionNo', m3.nodeActionNo(an) === 0);
  check('edit: motion node MotionNo', m3.nodeMotionNo(mn)?.motion === 0 && m3.nodeMotionNo(mn)?.phase === -1);
  const anProc = m3.processesOf(an)[0];
  const mnProc = m3.processesOf(mn)[0];
  check('edit: action container name', m3.str(anProc, 'mContainerName') === 'Action_W03', m3.str(anProc, 'mContainerName'));
  check('edit: motion container name', m3.str(mnProc, 'mContainerName') === 'LinkMotion_W03', m3.str(mnProc, 'mContainerName'));
  const rt = FsmModel.fromBinary(m3.toBinary(), 'rt3.fsm');
  const rtAn = rt.nodes().find((nd) => rt.str(nd, 'mName') === '新Action节点')!;
  const rtMn = rt.nodes().find((nd) => rt.str(nd, 'mName') === '新Motion节点')!;
  check('edit: action/motion survive round-trip',
    rt.nodeActionNo(rtAn) === 0 && rt.nodeMotionNo(rtMn)?.motion === 0);
  check('edit: validates clean after node creation', rt.validate().length === 0, rt.validate().join('; '));

  // node color: the editor paints the .fsm's own mColorType field, so colors
  // persist to disk with the regular FSM save (no separate color store)
  const m5 = FsmModel.fromBinary(fs.readFileSync(DEPLOYED), 'w5.fsm');
  const id5 = m5.getNum(m5.nodes()[4], 'mId');
  m5.snapshot();
  m5.setField(m5.nodes()[4], 'mColorType', 6);
  const rt5 = FsmModel.fromBinary(m5.toBinary(), 'rt5.fsm');
  const rt5nd = rt5.nodes().find((nd) => rt5.getNum(nd, 'mId') === id5)!;
  check('color: painted mColorType survives round-trip', rt5.getNum(rt5nd, 'mColorType') === 6,
    String(rt5.getNum(rt5nd, 'mColorType')));
}

console.log('== link reorder (priority order) ==');
{
  const m = FsmModel.fromBinary(fs.readFileSync(DEPLOYED), 'w3.fsm');
  const nd = m.nodes().find((n) => m.linksOf(n).length >= 2)!;
  const nid = m.getNum(nd, 'mId');
  const links = m.linksOf(nd);
  const l0 = links[0], l1 = links[1];
  const total = links.length;
  const nameOf = (x: { __vals__: Record<string, unknown> }): string =>
    typeof x.__vals__['mName'] === 'string' ? (x.__vals__['mName'] as string) : '';
  m.snapshot();
  m.moveLink(nd, 1, 0);
  check('reorder: move up swaps neighbours', m.linksOf(nd)[0] === l1 && m.linksOf(nd)[1] === l0);
  // the swapped priority order survives a binary round-trip
  const rt = FsmModel.fromBinary(m.toBinary(), 'rt.fsm');
  const rtNd = rt.nodes().find((n) => rt.getNum(n, 'mId') === nid)!;
  check('reorder: survives round-trip',
    nameOf(rt.linksOf(rtNd)[0]) === nameOf(l1) && nameOf(rt.linksOf(rtNd)[1]) === nameOf(l0));
  m.moveLink(nd, 0, 1);
  check('reorder: move down restores', m.linksOf(nd)[0] === l0 && m.linksOf(nd)[1] === l1);
  check('reorder: length unchanged', m.linksOf(nd).length === total);
  m.moveLink(nd, -1, 0);
  m.moveLink(nd, 0, 99);
  check('reorder: out-of-range is a no-op', m.linksOf(nd)[0] === l0 && m.linksOf(nd).length === total);
  m.undo(); // re-parses the tree, so verify by name not by instance identity
  const nd2 = m.nodes().find((n) => m.getNum(n, 'mId') === nid)!;
  check('reorder: undo restores order',
    nameOf(m.linksOf(nd2)[0]) === nameOf(l0) && nameOf(m.linksOf(nd2)[1]) === nameOf(l1));
}

console.log('== card geometry: full multi-line condition display ==');
{
  const m = FsmModel.fromBinary(fs.readFileSync(DEPLOYED), 'wp03_action.fsm');
  const nd = m.nodes().find((n) => m.linksOf(n).some((lk) => m.getNum(lk, 'mConditionId') === 116))!;
  const card = measureCard(m, nd, m.getNum(nd, 'mId'), m.initialStateId());

  // c116: "R & 練気ゲージ判定(気刃斬りIII" — the tag keeps the full summary
  const row116 = card.rows.find((r) => r.cond.startsWith('c116'))!;
  check('card: c116 summary not truncated',
    row116.cond === 'c116 R & 練気ゲージ判定(気刃斬りIII', row116.cond);
  check('card: c116 wraps at & into 2 lines',
    row116.condLines.length === 2 && row116.condLines[0] === 'c116 R'
    && row116.condLines[1] === '& 練気ゲージ判定(気刃斬りIII',
    row116.condLines.join(' / '));
  check('card: link name kept whole', row116.text.includes('t0001') && !row116.text.includes('…'), row116.text);

  // single-operand conditions stay on one line
  check('card: single-operand row stays 1 line', card.rows.some((r) => r.cond !== '' && r.condLines.length === 1));

  // out column is wide enough for every row (name + line 0, or any continuation)
  const need = Math.max(...card.rows.map((r) => Math.max(
    textW(r.text) + textW(r.condLines[0] ?? '') + 30,
    ...r.condLines.slice(1).map((l) => textW(l) + 24))));
  check('card: outColW fits full rows', card.outColW >= need, `${card.outColW} < ${need}`);

  // card height covers the stacked condition lines (out and in columns alike)
  const outLines = card.rows.reduce((a, r) => a + Math.max(1, r.condLines.length), 0);
  const inLines = card.inRows.reduce((a, r) => a + Math.max(1, r.condLines.length), 0);
  check('card: height covers stacked lines',
    card.h === 24 + Math.max(outLines, inLines, 3) * 16 + 12, String(card.h));

  // OR conditions split at | the same way
  const orTag = 'c9 A | B';
  check('card: OR splits at |', JSON.stringify(condLines(orTag)) === JSON.stringify(['c9 A', '| B']), condLines(orTag).join(' / '));
  check('card: bare id line', JSON.stringify(condLines('c12')) === JSON.stringify(['c12']));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
