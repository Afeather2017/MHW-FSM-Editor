// SVG graph view: pan/zoom canvas, node cards, condition-labeled edges.
import { FsmModel } from './model';
import { XfsInstance } from './xfs';

export interface Point { x: number; y: number; }

export interface GraphCallbacks {
  onSelectNode(nodeId: number): void;
  onSelectLink(nodeId: number, linkIndex: number): void;
  onCreateNodeAt(world: Point): void;
  onSelectionCleared(): void;
  /** rubber-band / ctrl-click changed the multi-selection (empty = cleared) */
  onMultiSelect(ids: number[]): void;
  /** reorder an out-link by ±1 — link order is the game's condition priority */
  onReorderLink(nodeId: number, linkIndex: number, dir: -1 | 1): void;
  onContextMenu(ctx: {
    kind: 'canvas' | 'node' | 'link';
    nodeId?: number;
    linkIndex?: number;
    screen: Point;
    world: Point;
  }): void;
}



const COLOR_PALETTE = ['#8a8f98', '#4f8ef7', '#e05555', '#e8c33a', '#54c46a', '#a86ee0', '#38c7d8', '#e08a3a'];

export class GraphView {
  svg: SVGSVGElement;
  private world: SVGGElement;
  private edgeLayer: SVGGElement;
  private nodeLayer: SVGGElement;
  private model: FsmModel | null = null;
  private cb: GraphCallbacks;
  edgesOnTop = true;
  view: { x: number; y: number; z: number } = { x: 60, y: 60, z: 1 };
  positions = new Map<number, Point>();
  highlightIds = new Set<number>();
  selectedNodeId: number | null = null;
  selectedLink: { nodeId: number; linkIndex: number } | null = null;
  /** multi-selection (band select / ctrl-click); includes selectedNodeId */
  selectedIds = new Set<number>();

  private drag: { kind: 'pan'; sx: number; sy: number; ox: number; oy: number } |
    { kind: 'node'; nodeId: number; dx: number; dy: number; orig: Point; moved: boolean; pendingLink?: { nodeId: number; linkIndex: number }; group?: Map<number, Point> } |
    { kind: 'band'; start: Point; cur: Point; moved: boolean } | null = null;
  private lastMouse: Point = { x: 0, y: 0 };
  private bandRect: SVGRectElement | null = null;
  /** last rendered card sizes, for band hit-testing without re-measuring */
  private cardMetrics = new Map<number, CardMetrics>();
  /** the reorder-handle row the pointer is over (revealed above the edges) */
  private hoverReveal: { nodeId: number; linkIndex: number } | null = null;

  constructor(svg: SVGSVGElement, cb: GraphCallbacks) {
    this.svg = svg;
    this.cb = cb;
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');
    defs.innerHTML =
      `<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
      `<path d="M 0 0 L 10 5 L 0 10 z" fill="#9aa4b2"/></marker>` +
      `<marker id="arrowSel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
      `<path d="M 0 0 L 10 5 L 0 10 z" fill="#ff5252"/></marker>`;
    svg.appendChild(defs);
    this.world = document.createElementNS(ns, 'g');
    this.edgeLayer = document.createElementNS(ns, 'g');
    this.nodeLayer = document.createElementNS(ns, 'g');
    this.world.appendChild(this.nodeLayer);
    this.world.appendChild(this.edgeLayer); // edges above cards by default
    svg.appendChild(this.world);
    this.bandRect = document.createElementNS(ns, 'rect');
    this.bandRect.setAttribute('class', 'bandRect');
    this.bandRect.setAttribute('visibility', 'hidden');
    this.world.appendChild(this.bandRect);

    svg.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    svg.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const target = e.target as Element;
      const edge = target.closest('[data-edge]') as SVGElement | null;
      const nodeG = target.closest('[data-node-id]') as SVGGElement | null;
      const screen = { x: e.clientX, y: e.clientY };
      const world = this.screenToWorld(e.clientX, e.clientY);
      if (edge) {
        const [nid, li] = (edge.dataset['edge'] ?? '').split(',').map(Number);
        this.selectLink(nid, li);
        this.cb.onSelectLink(nid, li);
        this.cb.onContextMenu({ kind: 'link', nodeId: nid, linkIndex: li, screen, world });
      } else if (nodeG) {
        const nid = Number(nodeG.dataset['nodeId']);
        this.selectNode(nid);
        this.cb.onSelectNode(nid);
        this.cb.onContextMenu({ kind: 'node', nodeId: nid, screen, world });
      } else {
        this.cb.onContextMenu({ kind: 'canvas', screen, world });
      }
    });
    svg.addEventListener('auxclick', (e) => {
      if ((e as MouseEvent).button === 1) e.preventDefault();
    });
    svg.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
    svg.addEventListener('dblclick', (e) => {
      if (e.target === this.svg) this.cb.onCreateNodeAt(this.screenToWorld(e.clientX, e.clientY));
    });
  }

  /** draw edges above (true) or below (false) the node cards */
  setEdgesOnTop(v: boolean): void {
    this.edgesOnTop = v;
    const world = this.world;
    if (v) { this.world.appendChild(this.nodeLayer); this.world.appendChild(this.edgeLayer); }
    else { this.world.appendChild(this.edgeLayer); this.world.appendChild(this.nodeLayer); }
    if (this.bandRect) this.world.appendChild(this.bandRect); // band stays on top
    document.dispatchEvent(new CustomEvent('fsmstudio:edgez', { detail: v }));
  }

  setModel(model: FsmModel | null): void {
    this.model = model;
    this.positions.clear();
    this.selectedNodeId = null;
    this.selectedLink = null;
    this.selectedIds.clear();
    this.restorePositions();
  }

  // ----- coordinates -----

  screenToWorld(sx: number, sy: number): Point {
    const rect = this.svg.getBoundingClientRect();
    return {
      x: (sx - rect.left - this.view.x) / this.view.z,
      y: (sy - rect.top - this.view.y) / this.view.z,
    };
  }

  private applyView(): void {
    this.world.setAttribute('transform', `translate(${this.view.x},${this.view.y}) scale(${this.view.z})`);
    document.dispatchEvent(new CustomEvent('fsmstudio:zoom', { detail: Math.round(this.view.z * 100) }));
  }

  fit(): void {
    if (!this.model) return;
    const bb = this.world.getBBox();
    if (bb.width <= 0 || bb.height <= 0) return;
    const rect = this.svg.getBoundingClientRect();
    const z = Math.min(1.4, Math.min(rect.width / (bb.width + 80), rect.height / (bb.height + 80)));
    this.view.z = z;
    this.view.x = (rect.width - bb.width * z) / 2 - bb.x * z;
    this.view.y = (rect.height - bb.height * z) / 2 - bb.y * z;
    this.applyView();
  }

  centerOn(p: Point): void {
    const rect = this.svg.getBoundingClientRect();
    this.view.x = rect.width / 2 - p.x * this.view.z;
    this.view.y = rect.height / 2 - p.y * this.view.z;
    this.applyView();
  }

  setZoom(z: number): void {
    const rect = this.svg.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const wx = (cx - this.view.x) / this.view.z, wy = (cy - this.view.y) / this.view.z;
    this.view.z = Math.min(3, Math.max(0.08, z));
    this.view.x = cx - wx * this.view.z;
    this.view.y = cy - wy * this.view.z;
    this.applyView();
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect = this.svg.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const nz = Math.min(3, Math.max(0.08, this.view.z * factor));
    this.view.x = mx - (mx - this.view.x) * (nz / this.view.z);
    this.view.y = my - (my - this.view.y) * (nz / this.view.z);
    this.view.z = nz;
    this.applyView();
  }

  private onPointerDown(e: PointerEvent): void {
    this.lastMouse = { x: e.clientX, y: e.clientY };
    // middle button: pan from anywhere (cards included)
    if (e.button === 1) {
      e.preventDefault();
      this.drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: this.view.x, oy: this.view.y };
      return;
    }
    if (e.button !== 0) return;
    const target = e.target as Element;
    const p = this.screenToWorld(e.clientX, e.clientY);
    // reorder handles sit right of the card where the out-edges start, so
    // edge paths often cover them — hit-test by geometry, not by DOM stacking
    if (this.hoverReveal) {
      const h = this.hitReorderHandle(p);
      if (h && h.nodeId === this.hoverReveal.nodeId && h.linkIndex === this.hoverReveal.linkIndex) {
        this.hoverReveal = null;
        this.svg.querySelectorAll('g[data-reorder].show').forEach((el) => el.classList.remove('show'));
        this.cb.onReorderLink(h.nodeId, h.linkIndex, h.dir);
        return;
      }
    }
    this.hoverReveal = null;
    this.svg.querySelectorAll('g[data-reorder].show').forEach((el) => el.classList.remove('show'));
    // little ↑/↓ handles on out-link rows: reorder, don't drag/select
    const reorder = target.closest('[data-reorder]') as SVGGElement | null;
    if (reorder) {
      const [nid, li] = (reorder.dataset['reorder'] ?? '').split(',').map(Number);
      const dir = Number(reorder.dataset['dir']) as -1 | 1;
      this.cb.onReorderLink(nid, li, dir);
      return;
    }
    // link rows on cards: click = select the link, drag = move the card.
    // rows are nested inside the card group, so the row match must win.
    const edge = target.closest('[data-edge]') as SVGPathElement | SVGGElement | null;
    const nodeG = target.closest('[data-node-id]') as SVGGElement | null;

    if (edge) {
      const [nid, li] = (edge.dataset['edge'] ?? '').split(',').map(Number);
      const pos = this.positions.get(nid) ?? { x: 0, y: 0 };
      // dragging a card that belongs to a multi-selection moves the group
      if (this.selectedIds.has(nid) && this.selectedIds.size > 1) {
        this.drag = { kind: 'node', nodeId: nid, dx: p.x - pos.x, dy: p.y - pos.y, orig: { ...pos }, moved: false, group: this.groupStart() };
        return;
      }
      this.selectedIds.clear();
      this.selectLink(nid, li);
      this.drag = {
        kind: 'node', nodeId: nid, dx: p.x - pos.x, dy: p.y - pos.y, orig: { ...pos }, moved: false,
        pendingLink: { nodeId: nid, linkIndex: li },
      };
      return;
    }
    if (nodeG) {
      const nid = Number(nodeG.dataset['nodeId']);
      // ctrl/shift+click: toggle membership in the multi-selection
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        if (this.selectedIds.has(nid) && this.selectedIds.size > 1) this.selectedIds.delete(nid);
        else this.selectedIds.add(nid);
        this.selectedLink = null;
        if (this.selectedIds.size === 1) {
          const only = [...this.selectedIds][0];
          this.selectedNodeId = only;
          this.render();
          this.cb.onSelectNode(only);
        } else {
          this.selectedNodeId = null;
          this.render();
          this.cb.onMultiSelect([...this.selectedIds]);
        }
        return;
      }
      const pos = this.positions.get(nid) ?? { x: 0, y: 0 };
      if (this.selectedIds.has(nid) && this.selectedIds.size > 1) {
        this.drag = { kind: 'node', nodeId: nid, dx: p.x - pos.x, dy: p.y - pos.y, orig: { ...pos }, moved: false, group: this.groupStart() };
        return;
      }
      this.drag = { kind: 'node', nodeId: nid, dx: p.x - pos.x, dy: p.y - pos.y, orig: { ...pos }, moved: false };
      this.selectNode(nid);
      this.cb.onSelectNode(nid);
      return;
    }
    if (e.target === this.svg) {
      // background: clear selection, then a left-drag rubber-band selects
      const hadSel = this.selectedNodeId !== null || this.selectedLink !== null || this.selectedIds.size > 0;
      this.selectedNodeId = null;
      this.selectedLink = null;
      this.selectedIds.clear();
      if (hadSel) this.cb.onSelectionCleared();
      this.drag = { kind: 'band', start: p, cur: p, moved: false };
      this.updateBandRect();
    }
  }

  private groupStart(): Map<number, Point> {
    const map = new Map<number, Point>();
    for (const id of this.selectedIds) {
      const pos = this.positions.get(id);
      if (pos) map.set(id, { ...pos });
    }
    return map;
  }

  /** reorder-handle hit test in world coords: the ↑/↓ strip just right of a
   *  card's out-link rows. Returns null outside any handle (incl. boundary
   *  rows whose handle is hidden). */
  private hitReorderHandle(w: Point): { nodeId: number; linkIndex: number; dir: -1 | 1 } | null {
    if (!this.model) return null;
    for (const nd of this.model.nodes()) {
      const id = this.model.getNum(nd, 'mId');
      const pos = this.positions.get(id);
      const m = this.cardMetrics.get(id);
      if (!pos || !m || m.outColW === 0) continue;
      const dx = w.x - pos.x, dy = w.y - pos.y;
      if (dx < m.w + 4 || dx > m.w + 32) continue;
      const row = Math.floor((dy - 26) / 16);
      if (row < 0 || dy > 26 + row * 16 + 14) continue;
      const linkCount = this.model.linksOf(nd).length;
      const dir: -1 | 1 = dx < m.w + 17 ? -1 : 1;
      if (row >= linkCount) continue;
      if (dir < 0 && row === 0) continue;
      if (dir > 0 && row >= linkCount - 1) continue;
      return { nodeId: id, linkIndex: row, dir };
    }
    return null;
  }

  /** reveal the reorder handles under the pointer even though edge paths
   *  render above them (geometry-based, so z-order can't hide them) */
  private updateHoverReveal(e: PointerEvent): void {
    const t = e.target as Element | null;
    let next: { nodeId: number; linkIndex: number } | null = null;
    if (t && this.svg.contains(t) && !this.drag) {
      const h = this.hitReorderHandle(this.screenToWorld(e.clientX, e.clientY));
      if (h) next = { nodeId: h.nodeId, linkIndex: h.linkIndex };
    }
    if (this.hoverReveal?.nodeId === next?.nodeId && this.hoverReveal?.linkIndex === next?.linkIndex) return;
    this.hoverReveal = next;
    this.svg.querySelectorAll('g[data-reorder].show').forEach((el) => el.classList.remove('show'));
    if (next) {
      this.svg.querySelectorAll(`g[data-reorder="${next.nodeId},${next.linkIndex}"]`).forEach((el) => el.classList.add('show'));
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.drag) {
      this.updateHoverReveal(e);
      return;
    }
    if (this.drag.kind === 'pan') {
      this.view.x = this.drag.ox + (e.clientX - this.drag.sx);
      this.view.y = this.drag.oy + (e.clientY - this.drag.sy);
      this.applyView();
    } else if (this.drag.kind === 'band') {
      const p = this.screenToWorld(e.clientX, e.clientY);
      const movedPx = Math.hypot(e.clientX - this.lastMouse.x, e.clientY - this.lastMouse.y);
      if (!this.drag.moved && movedPx < 4) return;
      this.drag.moved = true;
      this.drag.cur = p;
      this.updateBandRect();
      // live-preview the band selection (re-render only when the set changes)
      const hit = this.bandHit(this.drag.start, p);
      const prev = this.selectedIds;
      const same = prev.size === hit.size && [...hit].every((id) => prev.has(id));
      this.selectedIds = hit;
      if (!same) {
        this.selectedNodeId = hit.size === 1 ? [...hit][0] : null;
        this.render();
        this.cb.onMultiSelect([...hit]);
      }
    } else {
      const p = this.screenToWorld(e.clientX, e.clientY);
      const nx = Math.round(p.x - this.drag.dx);
      const ny = Math.round(p.y - this.drag.dy);
      const pos = this.positions.get(this.drag.nodeId) ?? { x: 0, y: 0 };
      if (!this.drag.moved && Math.abs(nx - pos.x) < 4 && Math.abs(ny - pos.y) < 4) return;
      this.positions.set(this.drag.nodeId, { x: nx, y: ny });
      if (this.drag.group) {
        // group members follow the primary card's TOTAL delta from drag start
        const ddx = nx - this.drag.orig.x, ddy = ny - this.drag.orig.y;
        for (const [id, start] of this.drag.group) {
          if (id === this.drag.nodeId) continue;
          this.positions.set(id, { x: start.x + ddx, y: start.y + ddy });
        }
      }
      this.drag.moved = true;
      this.render();
    }
  }

  private onPointerUp(): void {
    if (this.drag?.kind === 'node') {
      if (this.drag.moved) {
        this.savePositions();
      } else if (this.drag.pendingLink) {
        // no movement: it was a click on the link row
        this.cb.onSelectLink(this.drag.pendingLink.nodeId, this.drag.pendingLink.linkIndex);
      }
    } else if (this.drag?.kind === 'band') {
      this.bandRect?.setAttribute('visibility', 'hidden');
      if (this.drag.moved) {
        const hit = this.bandHit(this.drag.start, this.drag.cur);
        this.selectedIds = hit;
        if (hit.size === 1) {
          const id = [...hit][0];
          this.selectedNodeId = id;
          this.render();
          this.cb.onSelectNode(id);
        } else if (hit.size > 1) {
          this.selectedNodeId = null;
          this.render();
          this.cb.onMultiSelect([...hit]);
        }
      }
    }
    this.drag = null;
  }

  private updateBandRect(): void {
    if (!this.bandRect || !this.drag || this.drag.kind !== 'band') return;
    const x = Math.min(this.drag.start.x, this.drag.cur.x);
    const y = Math.min(this.drag.start.y, this.drag.cur.y);
    this.bandRect.setAttribute('x', String(x));
    this.bandRect.setAttribute('y', String(y));
    this.bandRect.setAttribute('width', String(Math.abs(this.drag.cur.x - this.drag.start.x)));
    this.bandRect.setAttribute('height', String(Math.abs(this.drag.cur.y - this.drag.start.y)));
    this.bandRect.setAttribute('visibility', 'visible');
  }

  /** ids of nodes whose card intersects the band (world coords) */
  private bandHit(a: Point, b: Point): Set<number> {
    const hit = new Set<number>();
    if (!this.model) return hit;
    const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
    const y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
    for (const nd of this.model.nodes()) {
      const id = this.model.getNum(nd, 'mId');
      const pos = this.positions.get(id);
      const m = this.cardMetrics.get(id);
      if (!pos) continue;
      const w = m?.w ?? 216, h = m?.h ?? 64;
      if (pos.x < x1 && pos.x + w > x0 && pos.y < y1 && pos.y + h > y0) hit.add(id);
    }
    return hit;
  }

  selectNode(nodeId: number): void {
    this.selectedNodeId = nodeId;
    this.selectedLink = null;
    this.selectedIds = new Set([nodeId]);
    this.render();
  }
  selectLink(nodeId: number, linkIndex: number): void {
    this.selectedLink = { nodeId, linkIndex };
    this.selectedIds = new Set([nodeId]);
    this.render();
  }
  clearSelection(): void {
    this.selectedNodeId = null;
    this.selectedLink = null;
    this.selectedIds.clear();
    this.render();
  }

  // ----- layout -----

  autoLayout(): void {
    if (!this.model) return;
    const model = this.model;
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
        if (idSet.has(dst)) { outLinks.get(id)!.push(dst); inLinks.get(dst)!.push(id); }
      }
    }

    // Split into bands: band 0 starts at the initial state; every remaining
    // unvisited node seeds its own band (request-entered subgraphs: rolls,
    // jumps, iai, ...). Each band is layered by BFS depth inside the band.
    const bandOf = new Map<number, number>();
    const depthInBand = new Map<number, number>();
    const bands: number[] = [];
    for (const seed of ids) {
      if (bandOf.has(seed)) continue;
      const bandIdx = bands.length;
      bands.push(seed);
      const queue = [seed];
      bandOf.set(seed, bandIdx);
      depthInBand.set(seed, 0);
      while (queue.length) {
        const cur = queue.shift()!;
        for (const nxt of outLinks.get(cur) ?? []) {
          if (!bandOf.has(nxt)) {
            bandOf.set(nxt, bandIdx);
            depthInBand.set(nxt, depthInBand.get(cur)! + 1);
            queue.push(nxt);
          }
        }
      }
    }

    // group ids into bands/layers preserving id order
    const bandLayers: number[][][] = bands.map(() => []);
    for (const id of ids) {
      const b = bandOf.get(id)!;
      const d = depthInBand.get(id)!;
      while (bandLayers[b].length <= d) bandLayers[b].push([]);
      bandLayers[b][d].push(id);
    }

    // barycenter sweeps within each band (against neighbor layers)
    for (const layers of bandLayers) {
      for (let sweep = 0; sweep < 4; sweep++) {
        for (let li = 1; li < layers.length; li++) {
          const prev = layers[li - 1];
          this.sortLayer(layers[li], (id) =>
            avg((inLinks.get(id) ?? []).filter((p) => prev.includes(p)).map((p) => prev.indexOf(p) + 1)));
        }
        for (let li = layers.length - 2; li >= 0; li--) {
          const next = layers[li + 1];
          this.sortLayer(layers[li], (id) =>
            avg((outLinks.get(id) ?? []).filter((p) => next.includes(p)).map((p) => next.indexOf(p) + 1)));
        }
      }
    }

    // place using real card sizes: layers flow left→right; nodes stack in
    // columns of limited height so nothing overlaps
    const initId = model.initialStateId();
    const metrics = new Map<number, CardMetrics>();
    for (const nd of nodes) {
      const id = model.getNum(nd, 'mId');
      metrics.set(id, measureCard(model, nd, id, initId));
    }
    this.positions.clear();
    const TARGET_H = 480;
    const COL_GAP = 26;
    const LAYER_GAP = 60;
    const BAND_GAP = 90;
    let bandY = 40;
    for (const layers of bandLayers) {
      let layerX = 40;
      let bandH = 0;
      for (const layer of layers) {
        if (layer.length === 0) continue;
        // greedy column packing by accumulated card height
        const columns: { id: number; m: CardMetrics }[][] = [[]];
        let colH = 0;
        for (const id of layer) {
          const mm = metrics.get(id)!;
          if (colH > 0 && colH + mm.h > TARGET_H) { columns.push([]); colH = 0; }
          columns[columns.length - 1].push({ id, m: mm });
          colH += mm.h + 14;
        }
        let colX = layerX;
        let layerH = 0;
        for (const col of columns) {
          let y = bandY;
          let colMaxW = 0;
          for (const { id, m } of col) {
            this.positions.set(id, { x: colX, y });
            y += m.h + 14;
            colMaxW = Math.max(colMaxW, m.w);
          }
          layerH = Math.max(layerH, y - bandY);
          colX += colMaxW + COL_GAP;
        }
        layerX = colX + LAYER_GAP;
        bandH = Math.max(bandH, layerH);
      }
      bandY += bandH + BAND_GAP;
    }
    this.savePositions();
    this.render();
    this.fit();
  }

  private sortLayer(layer: number[], key: (id: number) => number): void {
    const keyed = layer.map((id) => ({ id, k: key(id) }));
    keyed.sort((a, b) => a.k - b.k);
    keyed.forEach((e, i) => { layer[i] = e.id; });
  }

  // ----- persistence -----

  private posKey(): string { return `fsmstudio.pos.${this.model?.fileName ?? 'unsaved'}`; }
  restorePositions(): void {
    try {
      const raw = localStorage.getItem(this.posKey());
      if (raw) this.positions = new Map(Object.entries(JSON.parse(raw)).map(([k, v]) => [Number(k), v as Point]));
    } catch { /* private mode etc. */ }
  }
  private savePositions(): void {
    try {
      localStorage.setItem(this.posKey(), JSON.stringify(Object.fromEntries(this.positions)));
    } catch { /* ignore */ }
  }

  // ----- rendering -----

  nodePos(id: number): Point {
    return this.positions.get(id) ?? { x: 40, y: 40 };
  }

  render(): void {
    if (!this.model) { this.edgeLayer.innerHTML = ''; this.nodeLayer.innerHTML = ''; return; }
    const ns = 'http://www.w3.org/2000/svg';
    const model = this.model;
    const initId = model.initialStateId();

    // measure every card first so edge endpoints can use real sizes
    const cards = new Map<number, CardMetrics>();
    for (const nd of model.nodes()) {
      const id = model.getNum(nd, 'mId');
      cards.set(id, measureCard(model, nd, id, initId));
    }
    this.cardMetrics = cards;

    // edges — anchored per row: start at the out-row's right edge on the
    // source card, end at the matching in-row's left edge on the target card
    const rowY = (i: number): number => 24 + 2 + i * 16 + 8;
    this.edgeLayer.innerHTML = '';
    for (const nd of model.nodes()) {
      const id = model.getNum(nd, 'mId');
      const a = this.nodePos(id), sa = cards.get(id)!;
      model.linksOf(nd).forEach((lk, idx) => {
        const dst = model.getNum(lk, 'mDestinationNodeId');
        const b = this.nodePos(dst), sb = cards.get(dst);
        const isSel = this.selectedLink?.nodeId === id && this.selectedLink?.linkIndex === idx;
        const incident = this.selectedNodeId === id || this.selectedNodeId === dst;
        const path = document.createElementNS(ns, 'path');
        path.dataset['edge'] = `${id},${idx}`;
        // start: right edge of the source's out-row
        const sx = a.x + sa.w;
        const sy = a.y + rowY(idx);
        // end: left edge of the target's matching in-row
        let ty = sb ? sb.h / 2 : 28;
        let tx = b.x;
        if (sb) {
          const ir = sb.inRows.findIndex((r) => r.src === id && r.lidx === idx);
          if (ir >= 0) ty = b.y + rowY(ir);
        }
        let d: string;
        if (id === dst) {
          d = `M ${sx},${sy} C ${sx + 56},${sy - 40} ${sx + 96},${sy - 40} ${sx + 40},${sy}`;
        } else {
          const dx = Math.max(30, Math.abs(tx - sx) * 0.45);
          const sgn = tx >= sx ? 1 : -1;
          d = `M ${sx},${sy} C ${sx + dx * sgn},${sy} ${tx - dx * sgn},${ty} ${tx},${ty}`;
        }
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', isSel ? '#ff5252' : incident ? '#c98a8a' : '#8b95a3');
        path.setAttribute('stroke-opacity', incident ? '0.95' : this.edgesOnTop ? '0.5' : '0.42');
        path.setAttribute('stroke-width', isSel ? '2.4' : '1.3');
        path.setAttribute('marker-end', isSel ? 'url(#arrowSel)' : 'url(#arrow)');
        this.edgeLayer.appendChild(path);
      });
    }

    // nodes — variable-size cards: colored header, info column, out-link list
    this.nodeLayer.innerHTML = '';
    const HEADER_H = 24;
    const ROW_H = 16;
    for (const nd of model.nodes()) {
      const id = model.getNum(nd, 'mId');
      const pos = this.nodePos(id);
      const g = document.createElementNS(ns, 'g');
      g.dataset['nodeId'] = String(id);
      g.setAttribute('transform', `translate(${pos.x},${pos.y})`);
      const dim = this.highlightIds.size > 0 && !this.highlightIds.has(id);
      g.style.opacity = dim ? '0.18' : '1';

      const m = cards.get(id)!;
      const W = m.w;
      const H = m.h;
      const HEADER = HEADER_H;

      const bodyRect = document.createElementNS(ns, 'rect');
      bodyRect.setAttribute('width', String(W));
      bodyRect.setAttribute('height', String(H));
      bodyRect.setAttribute('rx', '8');
      bodyRect.setAttribute('class', 'nodeCard'
        + (this.selectedNodeId === id ? ' sel' : this.selectedIds.has(id) ? ' multisel' : '')
        + (m.isInit ? ' init' : ''));
      g.appendChild(bodyRect);

      const header = document.createElementNS(ns, 'path');
      header.setAttribute('d', `M 0,8 a 8,8 0 0 1 8,-8 L ${W - 8},0 a 8,8 0 0 1 8,8 L ${W},${HEADER} L 0,${HEADER} Z`);
      header.setAttribute('fill', COLOR_PALETTE[m.colorIdx]);
      header.setAttribute('class', 'nodeHeader' + (this.selectedNodeId === id ? ' sel' : ''));
      g.appendChild(header);
      const nameT = document.createElementNS(ns, 'text');
      nameT.setAttribute('x', '9');
      nameT.setAttribute('y', '17');
      nameT.setAttribute('class', 'nodeHeaderText');
      nameT.textContent = clip(m.name, W - 30);
      g.appendChild(nameT);
      if (m.isInit) {
        const badge = document.createElementNS(ns, 'text');
        badge.setAttribute('x', String(W - 8));
        badge.setAttribute('y', '17');
        badge.setAttribute('class', 'nodeHeaderText');
        badge.setAttribute('text-anchor', 'end');
        badge.textContent = '▶';
        g.appendChild(badge);
      }

      const listX = W - m.outColW - 6;
      const inX = 8;
      const infoX = 8 + m.inColW + 8;

      // in-edge rows (left column)
      m.inRows.forEach((r, ri) => {
        const rg = document.createElementNS(ns, 'g');
        rg.dataset['edge'] = `${r.src},${r.lidx}`;
        rg.setAttribute('class', 'edgeRow');
        const hit = document.createElementNS(ns, 'rect');
        hit.setAttribute('x', String(inX - 3));
        hit.setAttribute('y', String(HEADER + 2 + ri * 16));
        hit.setAttribute('width', String(m.inColW));
        hit.setAttribute('height', '16');
        hit.setAttribute('rx', '3');
        hit.setAttribute('class', 'edgeRowHit');
        rg.appendChild(hit);
        const t = document.createElementNS(ns, 'text');
        t.setAttribute('x', String(inX));
        t.setAttribute('y', String(HEADER + 13 + ri * 16));
        t.setAttribute('class', 'edgeRowText inRowText');
        t.textContent = clip(r.text, Math.max(34, m.inColW - textW(r.cond) - 14));
        rg.appendChild(t);
        if (r.cond) {
          const ct = document.createElementNS(ns, 'text');
          ct.setAttribute('x', String(inX + m.inColW - 2));
          ct.setAttribute('y', String(HEADER + 13 + ri * 16));
          ct.setAttribute('class', 'edgeRowCond');
          ct.setAttribute('text-anchor', 'end');
          ct.textContent = clip(r.cond, m.inColW * 0.6);
          rg.appendChild(ct);
        }
        const title = document.createElementNS(ns, 'title');
        title.textContent = `来自 ${r.src}`;
        rg.appendChild(title);
        g.appendChild(rg);
      });

      // middle info column
      m.infoLines.forEach((line, li) => {
        const t = document.createElementNS(ns, 'text');
        t.setAttribute('x', String(infoX));
        t.setAttribute('y', String(HEADER + 16 + li * 15));
        const cls = line.startsWith('act') ? 'nodeAct' : line.startsWith('mot') ? 'nodeMot' : 'nodeSub';
        t.setAttribute('class', cls);
        t.textContent = line;
        g.appendChild(t);
      });
      m.rows.forEach((r) => {
        const rg = document.createElementNS(ns, 'g');
        rg.dataset['edge'] = `${id},${r.idx}`;
        rg.setAttribute('class', 'edgeRow' + (this.selectedLink?.nodeId === id && this.selectedLink?.linkIndex === r.idx ? ' sel' : ''));
        const hit = document.createElementNS(ns, 'rect');
        hit.setAttribute('x', String(listX - 4));
        hit.setAttribute('y', String(HEADER + 2 + r.idx * ROW_H));
        hit.setAttribute('width', String(m.outColW));
        hit.setAttribute('height', String(ROW_H));
        hit.setAttribute('rx', '3');
        hit.setAttribute('class', 'edgeRowHit');
        rg.appendChild(hit);
        const label = document.createElementNS(ns, 'text');
        label.setAttribute('x', String(listX));
        label.setAttribute('y', String(HEADER + 13 + r.idx * ROW_H));
        label.setAttribute('class', 'edgeRowText');
        // split row width between link name and condition tag; the name wins
        const rowW = m.outColW;
        let condShown = r.cond;
        let labelMax = rowW - textW(condShown) - 10;
        if (r.cond && labelMax < 40) {
          condShown = r.cond.split(' ')[0]; // keep just cN
          labelMax = rowW - textW(condShown) - 10;
        }
        label.textContent = clip(r.text, Math.max(30, labelMax));
        rg.appendChild(label);
        if (condShown) {
          const condT = document.createElementNS(ns, 'text');
          condT.setAttribute('x', String(W - 6));
          condT.setAttribute('y', String(HEADER + 13 + r.idx * ROW_H));
          condT.setAttribute('class', 'edgeRowCond');
          condT.setAttribute('text-anchor', 'end');
          condT.textContent = clip(condShown, rowW * 0.6);
          rg.appendChild(condT);
        } else {
          const arrow = document.createElementNS(ns, 'text');
          arrow.setAttribute('x', String(W - 8));
          arrow.setAttribute('y', String(HEADER + 13 + r.idx * ROW_H));
          arrow.setAttribute('class', 'edgeRowArrow');
          arrow.setAttribute('text-anchor', 'end');
          arrow.textContent = '→';
          rg.appendChild(arrow);
        }
        const title = document.createElementNS(ns, 'title');
        title.textContent = `→ ${r.dst}${r.cond ? `  [${r.cond}]` : ''}`;
        rg.appendChild(title);
        // hover reorder handles (just outside the card): link order is the
        // game's evaluation priority, first matching link wins
        const linkCount = model.linksOf(nd).length;
        const reorder = (dir: -1 | 1, gx: number): void => {
          const btn = document.createElementNS(ns, 'g');
          btn.dataset['reorder'] = `${id},${r.idx}`;
          btn.dataset['dir'] = String(dir);
          btn.setAttribute('class', 'rowReorder');
          const hitR = document.createElementNS(ns, 'rect');
          hitR.setAttribute('x', String(gx - 2));
          hitR.setAttribute('y', String(HEADER + 2 + r.idx * ROW_H));
          hitR.setAttribute('width', '14');
          hitR.setAttribute('height', '14');
          hitR.setAttribute('rx', '3');
          hitR.setAttribute('class', 'rowReorderHit');
          btn.appendChild(hitR);
          const arrow = document.createElementNS(ns, 'text');
          arrow.setAttribute('x', String(gx + 5));
          arrow.setAttribute('y', String(HEADER + 13 + r.idx * ROW_H));
          arrow.setAttribute('text-anchor', 'middle');
          arrow.setAttribute('class', 'rowReorderArrow');
          arrow.textContent = dir < 0 ? '↑' : '↓';
          btn.appendChild(arrow);
          btn.setAttribute('visibility', dir < 0
            ? (r.idx === 0 ? 'hidden' : 'visible')
            : (r.idx === linkCount - 1 ? 'hidden' : 'visible'));
          rg.appendChild(btn);
        };
        reorder(-1, W + 6);
        reorder(1, W + 19);
        g.appendChild(rg);
      });
      this.nodeLayer.appendChild(g);
    }
  }
}

interface CardMetrics {
  w: number;
  h: number;
  colorIdx: number;
  name: string;
  isInit: boolean;
  infoLines: string[];
  rows: { idx: number; text: string; cond: string; dst: number }[];
  inRows: { src: number; lidx: number; text: string; cond: string }[];
  inColW: number;
  outColW: number;
}

function textW(s: string): number {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 0x2e80 ? 11 : 6.5;
  return w;
}

const MAX_LIST_ROWS = 12;

function condTagOf(model: FsmModel, lk: XfsInstance): string {
  const condId = model.getNum(lk, 'mConditionId');
  const hasCond = model.getNum(lk, 'mExistCondition') === 1;
  if (!hasCond) return '';
  let cond = `c${condId}`;
  if (model.conditions()[condId]) {
    const sum = model.conditionSummary(model.conditions()[condId]).replace(/^#\d+:\s*/, '');
    const props = sum === '(空条件)' ? '' : sum.slice(0, 12);
    if (props) cond += ' ' + props;
  }
  return cond;
}

function measureCard(model: FsmModel, nd: XfsInstance, id: number, initId: number): CardMetrics {
  const name = model.str(nd, 'mName') || `(id ${id})`;
  const act = model.nodeActionNo(nd);
  const motion = model.nodeMotionNo(nd);
  const links = model.linksOf(nd);
  const isInit = id === initId;
  const outRows = links.map((lk, i) => {
    const dst = model.getNum(lk, 'mDestinationNodeId');
    return { idx: i, text: model.str(lk, 'mName') || `→ ${dst}`, cond: condTagOf(model, lk), dst };
  });

  // in-edges: one row per incoming link (source name + condition), all shown
  const inRows: { src: number; lidx: number; text: string; cond: string }[] = [];
  for (const srcNode of model.nodes()) {
    const srcId = model.getNum(srcNode, 'mId');
    model.linksOf(srcNode).forEach((lk, lidx) => {
      if (model.getNum(lk, 'mDestinationNodeId') !== id) return;
      inRows.push({ src: srcId, lidx, text: model.str(srcNode, 'mName') || `← ${srcId}`, cond: condTagOf(model, lk) });
    });
  }

  const infoLines: string[] = [];
  if (isInit) infoLines.push('▶初始');
  if (act !== null) infoLines.push(`act ${act}`);
  if (motion) infoLines.push(`mot ${motion.motion}${motion.phase ? `/p${motion.phase}` : ''}`);
  infoLines.push(`#${id}`);

  const OUT_MIN = 96;
  const IN_MIN = 48;
  const INFO_W = Math.max(56, ...infoLines.map((l) => textW(l) + 14));
  const outW = outRows.length || links.length
    ? Math.max(OUT_MIN, Math.min(190, outRows.length ? Math.max(...outRows.map((r) => textW(r.text) + textW(r.cond) + 30)) : OUT_MIN))
    : 0;
  const inW = inRows.length
    ? Math.max(60, Math.min(170, Math.max(...inRows.map((r) => textW(r.text) + textW(r.cond) + 30))))
    : 0;
  const nameW = textW(name) + 22;
  // columns: [8 + inColW + 8 | INFO_W | gap | outColW + 6] — pad so info text
  // never runs into the out column
  const W = Math.min(470, Math.max(216, nameW, inW + INFO_W + outW + 38));
  const listRows = Math.max(outRows.length, inRows.length, 3);
  const H = 24 + listRows * 16 + 12;
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

function countInbound(model: FsmModel, id: number): number {
  let n = 0;
  for (const srcNode of model.nodes()) {
    for (const lk of model.linksOf(srcNode)) {
      if (model.getNum(lk, 'mDestinationNodeId') === id) n++;
    }
  }
  return n;
}

function clip(s: string, maxW: number): string {
  let w = 0;
  const chars = Array.from(s);
  for (let i = 0; i < chars.length; i++) {
    w += chars[i].charCodeAt(0) > 0x2e80 ? 11 : 6.5;
    if (w > maxW) return chars.slice(0, i).join('') + '…';
  }
  return s;
}
function avg(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 1e9;
}
