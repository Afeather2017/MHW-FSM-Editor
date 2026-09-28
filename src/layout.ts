// Auto layout for FSM graphs, DOM-free so tests can run it headless.
//
// BFS layering stretches cycles into long lines (a loop member gets pulled to
// whichever end BFS reaches it first). This module instead condenses the
// graph with strongly-connected components and layers the condensation:
//
//   band (directed reachability from a seed, band 0 = initial state)
//     └─ Tarjan SCC (iterative)
//        └─ condensation DAG → longest-path layers anchored at the seed's SCC
//           (the entry state stays leftmost; "return to idle" edges are the
//           only backward arcs in the whole drawing)
//           ├─ single state → card in its layer
//           └─ cycle (any size) → ring cluster: members arranged on a circle
//              in cycle order, so the loop reads as a loop; very large rings
//              are squashed into an ellipse (capped height) to keep the
//              canvas balanced
//
// Ordering = barycenter sweeps over layer units (cards or rings), placement =
// greedy column packing by real card sizes (nothing overlaps).
import { FsmModel } from './model';
import { CardMetrics } from './card';

export interface Point { x: number; y: number; }

export interface LayoutResult {
  positions: Map<number, Point>;
  /** node id → global layer ordinal; strictly increases left→right within a band */
  layerOf: Map<number, number>;
  /** node id → band index */
  bandOf: Map<number, number>;
  /** node id → SCC ordinal (unique across bands) */
  sccOf: Map<number, number>;
}

const RING_GAP = 44;          // minimum breathing room between ring cards
const MIN_RING_R = 110;       // circle radius floor
const MAX_RING_HALF_H = 1300; // squash rings taller than this into an ellipse
const TARGET_H = 480;         // column packing height budget
const ROW_GAP = 14;
const COL_GAP = 26;
const LAYER_GAP = 60;
const BAND_GAP = 90;

/** one placement unit in a layer: a single card, or a ring holding several */
interface Unit {
  members: number[];
  ring: boolean;
}

export function computeFsmLayout(model: FsmModel, metrics: Map<number, CardMetrics>): LayoutResult {
  const nodes = model.nodes();
  const ids = nodes.map((nd) => model.getNum(nd, 'mId'));
  const idSet = new Set(ids);
  const outLinks = new Map<number, number[]>();
  const inLinks = new Map<number, number[]>();
  for (const id of ids) { outLinks.set(id, []); inLinks.set(id, []); }
  for (const nd of nodes) {
    const id = model.getNum(nd, 'mId');
    for (const lk of model.linksOf(nd)) {
      const dst = model.getNum(lk, 'mDestinationNodeId');
      if (idSet.has(dst) && dst !== id) { outLinks.get(id)!.push(dst); inLinks.get(dst)!.push(id); }
    }
  }

  // Bands: what the player can reach from the initial state, then every
  // remaining unvisited node (request-entered subgraphs: rolls, jumps, ...)
  // seeds its own band. Bands stack vertically; layering happens per band.
  const bandOf = new Map<number, number>();
  const bands: number[][] = [];
  const initId = model.initialStateId();
  const seeds = idSet.has(initId) ? [initId, ...ids] : ids;
  for (const seed of seeds) {
    if (bandOf.has(seed)) continue;
    const bi = bands.length;
    const members: number[] = [];
    bandOf.set(seed, bi);
    const queue = [seed];
    while (queue.length) {
      const cur = queue.shift()!;
      members.push(cur);
      for (const nxt of outLinks.get(cur)!) {
        if (!bandOf.has(nxt)) { bandOf.set(nxt, bi); queue.push(nxt); }
      }
    }
    bands.push(members);
  }

  const positions = new Map<number, Point>();
  const layerOf = new Map<number, number>();
  const sccOf = new Map<number, number>();
  let layerBase = 0;
  let sccBase = 0;
  let bandY = 40;

  for (const members of bands) {
    const memberSet = new Set(members);
    const sccs = tarjan(members, outLinks, memberSet);
    const sccIndexOf = new Map<number, number>();
    sccs.forEach((comp, i) => comp.forEach((v) => sccIndexOf.set(v, i)));
    sccs.forEach((comp, i) => comp.forEach((v) => sccOf.set(v, sccBase + i)));

    // condensation DAG (deduped), then Kahn topological order.
    // Cross-band edges (a request-entered state transitioning back into the
    // main flow) are ignored here — the other band layers independently.
    const cadj: Set<number>[] = sccs.map(() => new Set<number>());
    const cpred: Set<number>[] = sccs.map(() => new Set<number>());
    for (const v of members) {
      for (const w of outLinks.get(v)!) {
        if (!memberSet.has(w)) continue;
        const a = sccIndexOf.get(v)!, b = sccIndexOf.get(w)!;
        if (a !== b) { cadj[a].add(b); cpred[b].add(a); }
      }
    }
    const indeg = cpred.map((p) => p.size);
    const topo: number[] = [];
    const ready = sccs.map((_, i) => i).filter((i) => indeg[i] === 0);
    while (ready.length) {
      const c = ready.shift()!;
      topo.push(c);
      for (const d of cadj[c]) if (--indeg[d] === 0) ready.push(d);
    }

    // Longest-path layers anchored at the seed's SCC (layer 0). Every other
    // SCC sits one past its deepest predecessor, so all condensation edges
    // point strictly right and only cycle members inside a ring turn
    // backwards.
    const seedScc = sccIndexOf.get(members[0])!;
    const cLayer = sccs.map(() => -1);
    cLayer[seedScc] = 0;
    for (const c of topo) {
      if (c === seedScc) continue;
      let best = -1;
      for (const p of cpred[c]) {
        if (cLayer[p] < 0) continue;
        best = Math.max(best, cLayer[p] + 1);
      }
      cLayer[c] = best >= 0 ? best : 0;
    }

    // ---- build layer units out of the SCCs ----
    const layerUnits = new Map<number, Unit[]>();
    const addUnit = (layer: number, u: Unit): void => {
      let arr = layerUnits.get(layer);
      if (!arr) layerUnits.set(layer, arr = []);
      arr.push(u);
    };
    const sccOrder = sccs.map((_, i) => i).sort((a, b) =>
      cLayer[a] - cLayer[b] || Math.min(...sccs[a]) - Math.min(...sccs[b]));
    for (const ci of sccOrder) {
      const comp = sccs[ci];
      if (comp.length === 1) {
        addUnit(cLayer[ci], { members: [comp[0]], ring: false });
      } else {
        addUnit(cLayer[ci], { members: cycleOrder(comp, outLinks, inLinks), ring: true });
      }
    }

    const layers = [...layerUnits.entries()].sort((a, b) => a[0] - b[0]).map(([, u]) => u);

    // ---- barycenter sweeps (cards and rings alike are one unit) ----
    const where = new Map<number, { li: number; ui: number }>();
    const reindex = (li: number): void =>
      layers[li].forEach((u, ui) => u.members.forEach((id) => where.set(id, { li, ui })));
    layers.forEach((_, li) => reindex(li));
    const sweepKey = (u: Unit, li: number, dir: -1 | 1): number => {
      const ks: number[] = [];
      for (const id of u.members) {
        for (const p of (dir === -1 ? inLinks.get(id)! : outLinks.get(id)!)) {
          const w = where.get(p);
          if (w && w.li === li + dir) ks.push(w.ui + 1);
        }
      }
      return avg(ks);
    };
    for (let sweep = 0; sweep < 4; sweep++) {
      for (let li = 1; li < layers.length; li++) {
        layers[li] = layers[li].map((u) => ({ u, k: sweepKey(u, li, -1) }))
          .sort((a, b) => a.k - b.k).map((e) => e.u);
        reindex(li);
      }
      for (let li = layers.length - 2; li >= 0; li--) {
        layers[li] = layers[li].map((u) => ({ u, k: sweepKey(u, li, 1) }))
          .sort((a, b) => a.k - b.k).map((e) => e.u);
        reindex(li);
      }
    }

    // ---- placement: greedy column packing, rings occupy their whole bbox ----
    interface Geo { w: number; h: number; place(ox: number, oy: number): void; }
    const geoCache = new Map<Unit, Geo>();
    const geoOf = (u: Unit): Geo => {
      let g = geoCache.get(u);
      if (!g) {
        g = u.ring ? ringGeometry(u.members, metrics, positions) : cardGeometry(u.members[0], metrics, positions);
        geoCache.set(u, g);
      }
      return g;
    };

    let layerX = 40;
    let bandH = 0;
    for (const units of layers) {
      if (!units.length) continue;
      const columns: number[][] = [[]];
      let colH = 0;
      for (let i = 0; i < units.length; i++) {
        const gh = geoOf(units[i]).h;
        if (colH > 0 && colH + gh > TARGET_H) { columns.push([]); colH = 0; }
        columns[columns.length - 1].push(i);
        colH += gh + ROW_GAP;
      }
      let colX = layerX;
      let layerH = 0;
      for (const col of columns) {
        let y = bandY;
        let colMaxW = 0;
        for (const i of col) {
          const g = geoOf(units[i]);
          g.place(colX, y);
          y += g.h + ROW_GAP;
          colMaxW = Math.max(colMaxW, g.w);
        }
        layerH = Math.max(layerH, y - bandY);
        colX += colMaxW + COL_GAP;
      }
      layerX = colX + LAYER_GAP;
      bandH = Math.max(bandH, layerH);
    }
    bandY += bandH + BAND_GAP;

    layers.forEach((units, li) => units.forEach((u) => u.members.forEach((id) => layerOf.set(id, layerBase + li))));
    layerBase += layers.length;
    sccBase += sccs.length;
  }

  return { positions, layerOf, bandOf, sccOf };
}

/** Tarjan SCC, iterative (FSM chains can be long; no recursion). Edges are
 *  restricted to memberSet: bands are forward-reachability sets, but a band
 *  member can link back into an earlier band — those edges must not leak
 *  foreign nodes into this band's components. */
function tarjan(ids: number[], outLinks: Map<number, number[]>, memberSet: Set<number>): number[][] {
  const succ = new Map<number, number[]>();
  for (const v of ids) succ.set(v, outLinks.get(v)!.filter((w) => memberSet.has(w)));
  const idx = new Map<number, number>();
  const low = new Map<number, number>();
  const onStack = new Set<number>();
  const stack: number[] = [];
  const sccs: number[][] = [];
  let counter = 0;
  for (const root of ids) {
    if (idx.has(root)) continue;
    idx.set(root, counter); low.set(root, counter); counter++;
    stack.push(root); onStack.add(root);
    const call: { v: number; ci: number }[] = [{ v: root, ci: 0 }];
    while (call.length) {
      const fr = call[call.length - 1];
      const succs = succ.get(fr.v)!;
      if (fr.ci < succs.length) {
        const w = succs[fr.ci++];
        if (!idx.has(w)) {
          idx.set(w, counter); low.set(w, counter); counter++;
          stack.push(w); onStack.add(w);
          call.push({ v: w, ci: 0 });
        } else if (onStack.has(w)) {
          low.set(fr.v, Math.min(low.get(fr.v)!, idx.get(w)!));
        }
      } else {
        call.pop();
        if (call.length) {
          const parent = call[call.length - 1];
          low.set(parent.v, Math.min(low.get(parent.v)!, low.get(fr.v)!));
        }
        if (low.get(fr.v) === idx.get(fr.v)) {
          const comp: number[] = [];
          let w: number;
          do { w = stack.pop()!; onStack.delete(w); comp.push(w); } while (w !== fr.v);
          sccs.push(comp);
        }
      }
    }
  }
  return sccs;
}

/** Order ring members by following out-links (the game's condition priority)
 *  so cycle successors sit adjacent on the circle. Starts at the member the
 *  rest of the graph flows into (most external in-links). */
function cycleOrder(comp: number[], outLinks: Map<number, number[]>, inLinks: Map<number, number[]>): number[] {
  const set = new Set(comp);
  let start = comp[0];
  let bestExt = -1;
  for (const v of comp) {
    let ext = 0;
    for (const p of inLinks.get(v)!) if (!set.has(p)) ext++;
    if (ext > bestExt || (ext === bestExt && v < start)) { start = v; bestExt = ext; }
  }
  const order: number[] = [];
  const remaining = new Set(comp);
  let cur = start;
  while (remaining.size) {
    if (!remaining.has(cur)) cur = Math.min(...remaining);
    order.push(cur);
    remaining.delete(cur);
    cur = -1;
    for (const w of outLinks.get(order[order.length - 1])!) {
      if (remaining.has(w)) { cur = w; break; }
    }
  }
  return order;
}


function cardGeometry(id: number, metrics: Map<number, CardMetrics>, positions: Map<number, Point>): { w: number; h: number; place(ox: number, oy: number): void } {
  const m = metrics.get(id)!;
  return {
    w: m.w,
    h: m.h,
    place: (ox, oy) => {
      positions.set(id, { x: Math.round(ox), y: Math.round(oy) });
    },
  };
}

/** Ring layout: n = 2 sits side by side (the back edge becomes a short arc);
 *  n ≥ 3 goes on a circle whose radius comes from the tightest adjacent pair,
 *  using card half-diagonals so rectangles never overlap at any angle. The
 *  first member (the loop's entry) lands on the left of the circle, where
 *  external in-edges arrive. Very large rings are squashed vertically into an
 *  ellipse (capped height) — if that would pinch cards together on the steep
 *  sides, the vertical radius grows back toward the guaranteed circle. */
function ringGeometry(members: number[], metrics: Map<number, CardMetrics>, positions: Map<number, Point>): { w: number; h: number; place(ox: number, oy: number): void } {
  const ms = members.map((id) => metrics.get(id)!);
  const setPos = (id: number, x: number, y: number): void => {
    positions.set(id, { x: Math.round(x), y: Math.round(y) });
  };
  if (members.length === 2) {
    const w = ms[0].w + RING_GAP + ms[1].w;
    const h = Math.max(ms[0].h, ms[1].h);
    return {
      w, h,
      place: (ox, oy) => {
        setPos(members[0], ox, oy + (h - ms[0].h) / 2);
        setPos(members[1], ox + ms[0].w + RING_GAP, oy + (h - ms[1].h) / 2);
      },
    };
  }
  const rad = ms.map((m) => Math.hypot(m.w, m.h) / 2);
  const total = rad.reduce((a, b) => a + b, 0);
  let R = MIN_RING_R;
  for (let i = 0; i < members.length; i++) {
    const j = (i + 1) % members.length;
    const dtheta = Math.PI * (rad[i] + rad[j]) / total;
    R = Math.max(R, (rad[i] + rad[j] + RING_GAP) / (2 * Math.sin(dtheta / 2)));
  }
  const angles: number[] = [];
  let acc = 0;
  for (const r of rad) {
    angles.push(Math.PI + 2 * Math.PI * (acc + r / 2) / total);
    acc += r;
  }
  const overlaps = (ry: number): boolean => {
    const pts = angles.map((a) => ({ x: R * Math.cos(a), y: ry * Math.sin(a) }));
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        if (Math.abs(pts[i].x - pts[j].x) < (ms[i].w + ms[j].w) / 2 &&
          Math.abs(pts[i].y - pts[j].y) < (ms[i].h + ms[j].h) / 2) return true;
      }
    }
    return false;
  };
  let Ry = Math.min(R, MAX_RING_HALF_H);
  while (Ry < R && overlaps(Ry)) Ry = Math.min(R, Ry * 1.2);
  const w = 2 * R + Math.max(...ms.map((m) => m.w));
  const h = 2 * Ry + Math.max(...ms.map((m) => m.h));
  return {
    w, h,
    place: (ox, oy) => {
      const cx = ox + w / 2, cy = oy + h / 2;
      members.forEach((id, i) => {
        setPos(id, cx + R * Math.cos(angles[i]) - ms[i].w / 2, cy + Ry * Math.sin(angles[i]) - ms[i].h / 2);
      });
    },
  };
}

function avg(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 1e9;
}
