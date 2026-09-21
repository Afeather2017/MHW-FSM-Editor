// Application shell: file I/O, toolbar, sidebar, wiring graph + inspector.
import { FsmModel, Selection } from './model';
import { GraphView } from './graph';
import { renderInspector as paintInspector } from './inspector';

let model: FsmModel | null = null;
let selection: Selection = { kind: 'none' };
let fileHandle: FileSystemFileHandle | null = null;
let search = '';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function btn(id: string): HTMLButtonElement { return document.getElementById(id) as HTMLButtonElement; }

// ---------- context menu ----------

interface CtxMenuItem {
  label: string;
  danger?: boolean;
  action?: () => void;
  children?: CtxMenuItem[];
}

function closeContextMenu(): void {
  document.querySelectorAll('.ctxMenu').forEach((m) => m.remove());
}

function buildMenuDom(items: CtxMenuItem[]): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'ctxMenu';
  for (const item of items) {
    if (item.label === '---') {
      const sep = document.createElement('div');
      sep.className = 'ctxSep';
      menu.appendChild(sep);
      continue;
    }
    const row = document.createElement('div');
    row.className = 'ctxItem' + (item.danger ? ' danger' : '') + (item.children ? ' hasSub' : '');
    row.textContent = item.label;
    if (item.children) {
      const sub = buildMenuDom(item.children);
      row.appendChild(sub);
    } else if (item.action) {
      row.addEventListener('click', () => { closeContextMenu(); item.action!(); });
    }
    menu.appendChild(row);
  }
  return menu;
}

function openContextMenu(items: CtxMenuItem[], x: number, y: number): void {
  closeContextMenu();
  if (!items.length) return;
  const menu = buildMenuDom(items);
  menu.style.left = '0px';
  menu.style.top = '0px';
  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${Math.min(x, window.innerWidth - rect.width - 8)}px`;
  menu.style.top = `${Math.min(y, window.innerHeight - rect.height - 8)}px`;
}
document.addEventListener('pointerdown', (e) => {
  const t = e.target as Element;
  if (!t.closest('.ctxMenu')) closeContextMenu();
}, true);
window.addEventListener('blur', closeContextMenu);

function nodeMenuItems(nodeId: number, world: { x: number; y: number }): CtxMenuItem[] {
  const m = model;
  if (!m) return [];
  const targetItems = (): CtxMenuItem[] =>
    m.nodes().map((nd) => {
      const tid = m.getNum(nd, 'mId');
      return {
        label: `${tid} — ${m.str(nd, 'mName') || '(未命名)'}`,
        action: () => {
          m.snapshot();
          m.addLink(m.nodeById(nodeId)!, tid, null);
          selection = { kind: 'link', nodeId, linkIndex: m.linksOf(m.nodeById(nodeId)!).length - 1 };
          renderAll();
        },
      };
    });
  return [
    {
      label: '添加链接到…',
      children: targetItems(),
    },
    { label: '---' },
    {
      label: '在此新建 Action 节点',
      action: () => createNode('action', { x: world.x + 30, y: world.y }),
    },
    {
      label: '在此新建 Motion 节点',
      action: () => createNode('motion', { x: world.x + 30, y: world.y }),
    },
    {
      label: '在此新建空节点',
      action: () => createNode('plain', { x: world.x + 30, y: world.y }),
    },
    { label: '---' },
    {
      label: '删除此节点',
      danger: true,
      action: () => {
        if (!confirm(`删除节点 ${nodeId}？指向它的链接也会一并删除。`)) return;
        m.snapshot();
        m.deleteNode(nodeId);
        selection = { kind: 'none' };
        renderAll();
      },
    },
  ];
}

function createNode(kind: 'action' | 'motion' | 'plain', world?: { x: number; y: number }): void {
  if (!model) return;
  model.snapshot();
  const name = kind === 'action' ? '新Action节点' : kind === 'motion' ? '新Motion节点' : '新节点';
  const nd = model.newNode(name, kind);
  const id = model.getNum(nd, 'mId');
  if (world) graph.positions.set(id, world);
  selection = { kind: 'node', nodeId: id };
  graph.selectNode(id);
  renderAll();
}

// ---------- File System Access API ----------

interface FsOpts { suggestedName?: string; types?: { description: string; accept: Record<string, string[]> }[]; }

function hasFsApi(): boolean {
  return typeof (window as unknown as { showOpenFilePicker?: unknown }).showOpenFilePicker === 'function';
}
function openPicker(o: FsOpts): Promise<FileSystemFileHandle[]> {
  return (window as unknown as { showOpenFilePicker: (o: FsOpts) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker(o);
}
function savePicker(o: FsOpts): Promise<FileSystemFileHandle> {
  return (window as unknown as { showSaveFilePicker: (o: FsOpts) => Promise<FileSystemFileHandle> }).showSaveFilePicker(o);
}

async function pickOpen(): Promise<{ bytes: Uint8Array; name: string; handle: FileSystemFileHandle | null } | null> {
  if (hasFsApi()) {
    try {
      const [handle] = await openPicker({
        types: [{ description: 'MHW FSM', accept: { 'application/octet-stream': ['.fsm'], 'text/xml': ['.xml'] } }],
      });
      const file = await handle.getFile();
      return { bytes: new Uint8Array(await file.arrayBuffer()), name: file.name, handle };
    } catch (e) {
      if ((e as Error).name === 'AbortError') return null;
      // fall through to input fallback
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.fsm,.xml';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      resolve({ bytes: new Uint8Array(await file.arrayBuffer()), name: file.name, handle: null });
    };
    input.click();
  });
}

async function pickSave(name: string, kind: 'fsm' | 'xml', data: Uint8Array | string): Promise<FileSystemFileHandle | null> {
  const blobPart: BlobPart = typeof data === 'string' ? data : data.slice().buffer as ArrayBuffer;
  if (hasFsApi()) {
    try {
      const handle = await savePicker({
        suggestedName: name,
        types: [kind === 'fsm'
          ? { description: 'MHW FSM', accept: { 'application/octet-stream': ['.fsm'] } }
          : { description: 'MtSerializer XML', accept: { 'text/xml': ['.xml'] } }],
      });
      const w = await handle.createWritable();
      await w.write(new Blob([blobPart]));
      await w.close();
      return handle;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return null;
    }
  }
  // download fallback
  const blob = new Blob([blobPart], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return null;
}

async function saveToHandle(handle: FileSystemFileHandle, data: Uint8Array | string): Promise<void> {
  const w = await handle.createWritable();
  await w.write(typeof data === 'string' ? new Blob([data]) : new Blob([data.slice().buffer as ArrayBuffer]));
  await w.close();
}

// ---------- app wiring ----------

const graph = new GraphView($('canvas') as unknown as SVGSVGElement, {
  onSelectNode(id) { selection = { kind: 'node', nodeId: id }; renderSide(); updateInspector(); },
  onSelectLink(nodeId, linkIndex) { selection = { kind: 'link', nodeId, linkIndex }; renderSide(); updateInspector(); },
  onCreateNodeAt(world) { createNode('action', world); },
  onSelectionCleared() { selection = { kind: 'none' }; renderSide(); updateInspector(); },
  onMultiSelect(ids) {
    selection = ids.length > 1 ? { kind: 'multi', nodeIds: ids }
      : ids.length === 1 ? { kind: 'node', nodeId: ids[0] }
      : { kind: 'none' };
    renderSide();
    updateInspector();
  },
  onReorderLink(nodeId, linkIndex, dir) { reorderLink(nodeId, linkIndex, dir); },
  onContextMenu(ctx) {
    if (!model) return;
    if (ctx.kind === 'node' && ctx.nodeId !== undefined) {
      openContextMenu(nodeMenuItems(ctx.nodeId, ctx.world), ctx.screen.x, ctx.screen.y);
    } else if (ctx.kind === 'link' && ctx.nodeId !== undefined && ctx.linkIndex !== undefined) {
      const link = model.linksOf(model.nodeById(ctx.nodeId)!)[ctx.linkIndex];
      const condId = link ? model.getNum(link, 'mConditionId') : 0;
      const hasCond = link ? model.getNum(link, 'mExistCondition') === 1 : false;
      const linkTotal = model.linksOf(model.nodeById(ctx.nodeId)!).length;
      openContextMenu([
        ...(ctx.linkIndex > 0
          ? [{ label: '↑ 上移（更早判定）', action: () => reorderLink(ctx.nodeId!, ctx.linkIndex!, -1) }]
          : []),
        ...(ctx.linkIndex < linkTotal - 1
          ? [{ label: '↓ 下移（更晚判定）', action: () => reorderLink(ctx.nodeId!, ctx.linkIndex!, 1) }]
          : []),
        hasCond
          ? {
              label: `编辑条件 #${condId}`,
              action: () => {
                selection = { kind: 'condition', condIndex: condId };
                document.getElementById('tabConds')?.click();
                renderSide();
                updateInspector();
              },
            }
          : {
              label: '新建组合条件…',
              action: () => {
                model!.snapshot();
                const created = model!.addCondition();
                model!.setField(link!, 'mExistCondition', 1);
                model!.setField(link!, 'mConditionId', created.index);
                selection = { kind: 'condition', condIndex: created.index };
                renderAll();
              },
            },
        { label: '---' },
        {
          label: '删除此链接',
          danger: true,
          action: () => {
            model!.snapshot();
            model!.deleteLink(model!.nodeById(ctx.nodeId!)!, ctx.linkIndex!);
            selection = { kind: 'node', nodeId: ctx.nodeId! };
            renderAll();
          },
        },
      ], ctx.screen.x, ctx.screen.y);
    } else {
      openContextMenu([
        { label: '新建 Action 节点', action: () => createNode('action', ctx.world) },
        { label: '新建 Motion 节点', action: () => createNode('motion', ctx.world) },
        { label: '新建空节点', action: () => createNode('plain', ctx.world) },
        { label: '---' },
        {
          label: '新建条件',
          action: () => {
            model!.snapshot();
            const created = model!.addCondition();
            selection = { kind: 'condition', condIndex: created.index };
            $('tabConds').click();
            renderAll();
          },
        },
        { label: '---' },
        { label: '适应视图', action: () => graph.fit() },
      ], ctx.screen.x, ctx.screen.y);
    }
  },
});

/** swap a node's link with its neighbour; one undo step, selection follows */
function reorderLink(nodeId: number, linkIndex: number, dir: -1 | 1): void {
  const m = model;
  if (!m) return;
  const node = m.nodeById(nodeId);
  if (!node) return;
  const to = linkIndex + dir;
  if (to < 0 || to >= m.linksOf(node).length) return;
  m.snapshot();
  m.moveLink(node, linkIndex, to);
  // keep an open link selection attached to the link it was on
  if (selection.kind === 'link' && selection.nodeId === nodeId) {
    if (selection.linkIndex === linkIndex) selection = { kind: 'link', nodeId, linkIndex: to };
    else if (selection.linkIndex === to) selection = { kind: 'link', nodeId, linkIndex };
  }
  renderAll();
}

function ensureChangeHook(): void {
  model!.onChange = () => renderAll();
}

function renderAll(): void {
  $('fileLabel').textContent = model ? `${model.fileName || '(未保存)'} [${model.format === 'binary' ? 'fsm' : 'xml'}]` : '未打开文件';
  $('dirtyBadge').textContent = model?.dirty ? '● 未保存' : '';
  btn('btnSave').disabled = !model;
  btn('btnSaveAs').disabled = !model;
  btn('btnExportXml').disabled = !model;
  btn('btnUndo').disabled = !model?.canUndo();
  btn('btnRedo').disabled = !model?.canRedo();
  applySearch();
  graph.render();
  renderSide();
  updateInspector();
  renderStatus();
}

function updateInspector(): void {
  paintInspector(
    {
      model,
      selection,
      setSelection: (sel) => { selection = sel; },
      requestRender: () => renderAll(),
      reorderLink,
      selectNode: (id) => {
        graph.selectNode(id);
        selection = { kind: 'node', nodeId: id };
        renderSide();
        updateInspector();
      },
    },
    $('inspector'),
  );
}

function renderStatus(): void {
  if (!model) { $('statusText').textContent = '就绪'; return; }
  const nodes = model.nodes().length;
  const links = model.nodes().reduce((a, nd) => a + model!.linksOf(nd).length, 0);
  const problems = model.validate();
  $('statusText').textContent =
    `节点 ${nodes} · 链接 ${links} · 条件 ${model.conditions().length}` +
    (problems.length ? ` · ⚠ ${problems.length} 个校验问题` : ' · 校验通过');
}

// ---------- sidebar ----------

function renderSide(): void {
  const list = $('nodeList');
  list.innerHTML = '';
  const m = model;
  if (!m) return;
  const tab = ($('tabNodes') as HTMLButtonElement).classList.contains('active') ? 'nodes' : 'conds';
  if (tab === 'nodes') {
    const multiSel = selection.kind === 'multi' ? new Set(selection.nodeIds) : null;
    for (const nd of m.nodes()) {
      const id = m.getNum(nd, 'mId');
      const name = m.str(nd, 'mName');
      if (search && !`${id} ${name} ${m.nodeActionNo(nd) ?? ''}`.toLowerCase().includes(search)) continue;
      const r = document.createElement('div');
      r.className = 'nodeRow'
        + ((selection.kind === 'node' && selection.nodeId === id) || multiSel?.has(id) ? ' sel' : '');
      r.innerHTML =
        `<span class="nid">${id}</span><span class="nname">${escapeHtml(name) || '<i>未命名</i>'}</span>` +
        `<span class="nact">${m.nodeActionNo(nd) ?? '·'}</span><span class="ncnt">${m.linksOf(nd).length}</span>`;
      r.addEventListener('click', () => {
        selection = { kind: 'node', nodeId: id };
        graph.selectNode(id);
        graph.centerOn(graph.nodePos(id));
        renderSide();
        updateInspector();
      });
      r.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        openContextMenu(nodeMenuItems(id, graph.nodePos(id)), ev.clientX, ev.clientY);
      });
      list.appendChild(r);
    }
  } else {
    const add = document.createElement('div');
    add.className = 'nodeRow head';
    add.innerHTML = '<span class="nid">#</span><span class="nname">条件摘要</span><span class="nact">引用</span><span class="ncnt"></span>';
    list.appendChild(add);
    m.conditions().forEach((c, i) => {
      const summary = m.conditionSummary(c);
      if (search && summary.toLowerCase().includes(search) === false && String(i).includes(search) === false) return;
      const r = document.createElement('div');
      r.className = 'nodeRow' + (selection.kind === 'condition' && selection.condIndex === i ? ' sel' : '');
      r.innerHTML =
        `<span class="nid">${i}</span><span class="nname">${escapeHtml(summary.replace(/^#\d+:\s*/, ''))}</span>` +
        `<span class="nact">${m.conditionUsage(i)}</span><span class="ncnt"></span>`;
      r.addEventListener('click', () => {
        selection = { kind: 'condition', condIndex: i };
        renderSide();
        updateInspector();
      });
      r.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        openContextMenu([
          {
            label: `删除条件 #${i}`,
            danger: true,
            action: () => {
              if (!confirm(`删除条件 #${i}？引用它的链接将变为无条件。`)) return;
              model!.snapshot();
              model!.deleteCondition(i);
              selection = { kind: 'none' };
              renderAll();
            },
          },
        ], ev.clientX, ev.clientY);
      });
      list.appendChild(r);
    });
  }
}

function applySearch(): void {
  if (!model || !search) { graph.highlightIds.clear(); return; }
  graph.highlightIds.clear();
  for (const nd of model.nodes()) {
    const id = model.getNum(nd, 'mId');
    if (`${id} ${model.str(nd, 'mName')} ${model.nodeActionNo(nd) ?? ''}`.toLowerCase().includes(search)) {
      graph.highlightIds.add(id);
    }
  }
}

// ---------- actions ----------

async function doOpen(): Promise<void> {
  const picked = await pickOpen();
  if (!picked) return;
  const { bytes, name, handle } = picked;
  try {
    if (/\.xml$/i.test(name)) {
      model = FsmModel.fromXml(new TextDecoder('utf-8').decode(bytes), name);
    } else {
      model = FsmModel.fromBinary(bytes, name);
    }
    fileHandle = handle;
    selection = { kind: 'none' };
    ensureChangeHook();
    graph.setModel(model);
    graph.autoLayout();
    renderAll();
  } catch (e) {
    alert(`打开失败: ${(e as Error).message}`);
  }
}

async function doSave(saveAs: boolean): Promise<void> {
  if (!model) return;
  const baseName = model.fileName || 'untitled.fsm';
  const isXml = model.format === 'xml';
  const data: Uint8Array | string = isXml ? model.toXml() : model.toBinary();
  const outName = saveAs || !fileHandle ? baseName.replace(/\.(fsm|xml)$/i, isXml ? '.xml' : '.fsm') : baseName;
  if (fileHandle && !saveAs) {
    await saveToHandle(fileHandle, data);
  } else {
    const handle = await pickSave(outName, isXml ? 'xml' : 'fsm', data);
    if (handle) { fileHandle = handle; model.fileName = handle.name; }
  }
  model.dirty = false;
  renderAll();
}

async function doExportXml(): Promise<void> {
  if (!model) return;
  const outName = model.fileName.replace(/\.(fsm|xml)$/i, '') + '.xml';
  await pickSave(outName, 'xml', model.toXml());
}

// ---------- events ----------

$('btnOpen').addEventListener('click', () => void doOpen());
$('btnSave').addEventListener('click', () => void doSave(false));
$('btnSaveAs').addEventListener('click', () => void doSave(true));
$('btnExportXml').addEventListener('click', () => void doExportXml());
$('btnUndo').addEventListener('click', () => model?.undo());
$('btnRedo').addEventListener('click', () => model?.redo());
$('btnLayout').addEventListener('click', () => graph.autoLayout());
// edge z-order preference
{
  const saved = localStorage.getItem('fsmstudio.edgesOnTop');
  const on = saved === null ? true : saved === '1';
  graph.edgesOnTop = on;
  btn('btnEdgeZ').classList.toggle('active', on);
  // apply stacking once layers exist
  requestAnimationFrame(() => graph.setEdgesOnTop(on));
}
$('btnEdgeZ').addEventListener('click', () => {
  const on = !graph.edgesOnTop;
  graph.setEdgesOnTop(on);
  btn('btnEdgeZ').classList.toggle('active', on);
  localStorage.setItem('fsmstudio.edgesOnTop', on ? '1' : '0');
});
$('btnFit').addEventListener('click', () => graph.fit());
$('btnNewAction').addEventListener('click', () => createNode('action'));
$('btnNewMotion').addEventListener('click', () => createNode('motion'));
$('btnNewPlain').addEventListener('click', () => createNode('plain'));
$('search').addEventListener('input', () => {
  search = ($('search') as HTMLInputElement).value.trim().toLowerCase();
  renderAll();
});
$('tabNodes').addEventListener('click', () => {
  $('tabNodes').classList.add('active');
  $('tabConds').classList.remove('active');
  renderSide();
});
$('tabConds').addEventListener('click', () => {
  $('tabConds').classList.add('active');
  $('tabNodes').classList.remove('active');
  renderSide();
});
(window as unknown as { selectRoot(): void }).selectRoot = () => {
  selection = { kind: 'root' };
  renderSide();
  updateInspector();
};

document.addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'SELECT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
    if (e.key === 'Escape') (e.target as HTMLElement).blur();
    return;
  }
  if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); void doSave(false); return; }
  if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); model?.undo(); return; }
  if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); model?.redo(); return; }
  if (e.ctrlKey && e.key.toLowerCase() === 'f') { e.preventDefault(); $('search').focus(); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selection.kind === 'multi') {
    e.preventDefault();
    const ids = [...selection.nodeIds];
    if (!confirm(`删除选中的 ${ids.length} 个节点？指向它们的链接也会一并删除。`)) return;
    model?.snapshot();
    for (const id of ids) model?.deleteNode(id);
    selection = { kind: 'none' };
    graph.clearSelection();
    renderAll();
    return;
  }
  if (e.key === 'f') graph.fit();
  if (e.key === 'Escape') { selection = { kind: 'none' }; graph.clearSelection(); renderSide(); updateInspector(); }
});

document.addEventListener('fsmstudio:zoom', (e) => {
  $('zoomLabel').textContent = `${(e as CustomEvent).detail}%`;
});

// drag & drop
let dragDepth = 0;
const wrap = document.body;
wrap.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; $('dropOverlay').classList.add('show'); });
wrap.addEventListener('dragover', (e) => { e.preventDefault(); });
wrap.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) $('dropOverlay').classList.remove('show');
});
wrap.addEventListener('dragend', () => { dragDepth = 0; $('dropOverlay').classList.remove('show'); });
wrap.addEventListener('drop', async (e) => {
  e.preventDefault();
  dragDepth = 0;
  $('dropOverlay').classList.remove('show');
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    if (/\.xml$/i.test(file.name)) model = FsmModel.fromXml(new TextDecoder('utf-8').decode(bytes), file.name);
    else model = FsmModel.fromBinary(bytes, file.name);
    fileHandle = null;
    selection = { kind: 'none' };
    ensureChangeHook();
    graph.setModel(model);
    graph.autoLayout();
    renderAll();
  } catch (err) {
    alert(`打开失败: ${(err as Error).message}`);
  }
});

window.addEventListener('beforeunload', (e) => {
  if (model?.dirty) { e.preventDefault(); e.returnValue = ''; }
});

// ---------- resizable side panels ----------

function setupResizer(handleId: string, panelId: string, dir: 'l' | 'r'): void {
  const handle = document.getElementById(handleId);
  const panel = document.getElementById(panelId);
  if (!handle || !panel) return;
  const key = `fsmstudio.width.${panelId}`;
  const clamp = (w: number): number => Math.min(620, Math.max(170, w));
  const saved = localStorage.getItem(key);
  if (saved) panel.style.flexBasis = `${clamp(Number(saved))}px`;
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { handle.setPointerCapture(e.pointerId); } catch { /* synthetic pointers have no active id */ }
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const startX = e.clientX;
    const startW = panel.getBoundingClientRect().width;
    const onMove = (ev: PointerEvent): void => {
      const delta = dir === 'r' ? ev.clientX - startX : startX - ev.clientX;
      panel.style.flexBasis = `${clamp(startW + delta)}px`;
    };
    const onUp = (ev: PointerEvent): void => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      void ev;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem(key, String(parseInt(panel.style.flexBasis, 10)));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}
setupResizer('sbResize', 'sidebar', 'r');
setupResizer('inspResize', 'inspectorWrap', 'l');

// initial paint for the empty state
updateInspector();
renderStatus();

// ---------- automation / test hooks (harmless in normal use) ----------
const w = window as unknown as Record<string, unknown>;
w['FSM_STUDIO_GRAPH'] = graph;
w['FSM_STUDIO_LOAD'] = (name: string, b64: string): string => {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  try {
    if (/\.xml$/i.test(name)) model = FsmModel.fromXml(new TextDecoder('utf-8').decode(bin), name);
    else model = FsmModel.fromBinary(bin, name);
    fileHandle = null;
    selection = { kind: 'none' };
    ensureChangeHook();
    graph.setModel(model);
    graph.autoLayout();
    renderAll();
    return 'ok';
  } catch (e) {
    return `error: ${(e as Error).message}`;
  }
};
w['FSM_STUDIO_STATE'] = (): unknown => ({
  open: !!model,
  name: model?.fileName ?? null,
  nodes: model?.nodes().length ?? 0,
  conditions: model?.conditions().length ?? 0,
  links: model ? model.nodes().reduce((a, nd) => a + model!.linksOf(nd).length, 0) : 0,
  dirty: model?.dirty ?? false,
  selection: selection.kind,
  validate: model?.validate() ?? [],
});
w['FSM_STUDIO_SELECT'] = (kind: string, a: number, b: number): void => {
  if (kind === 'node') { selection = { kind: 'node', nodeId: a }; graph.selectNode(a); }
  else if (kind === 'link') { selection = { kind: 'link', nodeId: a, linkIndex: b }; graph.selectLink(a, b); }
  else if (kind === 'cond') selection = { kind: 'condition', condIndex: a };
  else if (kind === 'root') selection = { kind: 'root' };
  renderSide();
  updateInspector();
};
w['FSM_STUDIO_EXPORT'] = (): string => {
  if (!model) return '';
  const bytes = model.format === 'xml' ? new TextEncoder().encode(model.toXml()) : model.toBinary();
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
