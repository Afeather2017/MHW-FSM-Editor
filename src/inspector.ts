// Inspector: right-hand property editor for the current selection.
// Every mutating control snapshots the model first (undo granularity).
import { FsmModel, Selection } from './model';
import { XfsInstance, isInstance } from './xfs';

export interface InspectorHost {
  model: FsmModel | null;
  selection: Selection;
  setSelection(sel: Selection): void;
  requestRender(): void;
  selectNode(id: number): void;
}

const OPERATORS: [number, string][] = [
  [0, 'None（直通）'],
  [1, 'IsTrue'],
  [2, 'IsFalse'],
  [3, 'Equal'],
  [4, 'NotEqual'],
  [5, 'LessThan'],
  [6, 'LessThanOrEqual'],
  [7, 'GreaterThan'],
  [8, 'GreaterThanOrEqual'],
  [9, 'BitAnd'],
  [10, 'BitOr'],
  [16, 'And'],
  [17, 'Or'],
];

const COMMON_PROPS = [
  'R', '回避', 'オーラレベル白以上', 'オーラレベル黄以上', 'オーラレベル赤以上',
  '練気ゲージ判定(見切り)', '練気ゲージ判定(必殺)', '居合斬り', '見切り回避成功後の攻撃ヒット',
];

export function renderInspector(host: InspectorHost, root: HTMLElement): void {
  root.innerHTML = '';
  const m = host.model;
  if (!m) {
    root.innerHTML = '<div class="inspEmpty">打开 .fsm 或 .xml 文件后开始编辑。<br><br>支持 XFsm 的二进制与 XML 两种格式，保存为游戏可用的 .fsm。</div>';
    return;
  }
  const sel = host.selection;
  switch (sel.kind) {
    case 'none': renderRootHint(m, root); break;
    case 'root': renderRoot(m, host, root); break;
    case 'node': renderNode(m, host, root, sel.nodeId); break;
    case 'link': renderLink(m, host, root, sel.nodeId, sel.linkIndex); break;
    case 'condition': renderConditionEditor(m, host, root, sel.condIndex); break;
  }
}

function section(root: HTMLElement, title: string): HTMLDivElement {
  const box = document.createElement('div');
  box.className = 'inspSection';
  const h = document.createElement('h3');
  h.textContent = title;
  box.appendChild(h);
  root.appendChild(box);
  return box;
}

function row(box: HTMLElement, label: string): HTMLDivElement {
  const r = document.createElement('div');
  r.className = 'row';
  const lab = document.createElement('label');
  lab.textContent = label;
  r.appendChild(lab);
  box.appendChild(r);
  return r;
}

function numInput(r: HTMLDivElement, value: number, onChange: (v: number) => void, opts: { step?: number; wide?: boolean } = {}): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'number';
  input.value = String(value);
  input.step = String(opts.step ?? 1);
  if (opts.wide) input.className = 'wide';
  input.addEventListener('change', () => onChange(Math.trunc(Number(input.value) || 0)));
  r.appendChild(input);
  return input;
}

function textInput(r: HTMLDivElement, value: string, onChange: (v: string) => void, datalist?: string[]): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.addEventListener('change', () => onChange(input.value));
  if (datalist) {
    const dl = document.createElement('datalist');
    dl.id = `dl-${Math.random().toString(36).slice(2)}`;
    for (const s of datalist) {
      const o = document.createElement('option');
      o.value = s;
      dl.appendChild(o);
    }
    input.setAttribute('list', dl.id);
    r.appendChild(dl);
  }
  r.appendChild(input);
  return input;
}

function checkbox(r: HTMLDivElement, value: boolean, onChange: (v: boolean) => void): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = value;
  input.addEventListener('change', () => onChange(input.checked));
  r.appendChild(input);
  return input;
}

function button(r: HTMLDivElement | HTMLElement, label: string, onClick: (e: Event) => void, cls = ''): HTMLButtonElement {
  const b = document.createElement('button');
  b.textContent = label;
  b.className = cls;
  b.addEventListener('click', onClick);
  r.appendChild(b);
  return b;
}

// ----- root -----

function renderRootHint(m: FsmModel, root: HTMLElement): void {
  const box = section(root, `FSM 总览 — ${m.doc.rootName}`);
  const info = document.createElement('div');
  info.className = 'hintBox';
  const problems = m.validate();
  info.innerHTML =
    `<p>节点 <b>${m.nodes().length}</b> · 链接 <b>${m.nodes().reduce((a, nd) => a + m.linksOf(nd).length, 0)}</b> · 条件 <b>${m.conditions().length}</b></p>` +
    (problems.length
      ? `<p class="bad">校验问题:<br>${problems.map((p) => `· ${escapeHtml(p)}`).join('<br>')}</p>`
      : '<p class="ok">校验通过，无悬空引用。</p>') +
    '<p class="dim">点击节点 / 连线查看属性；双击空白处新建节点。</p>';
  box.appendChild(info);
  button(box, '查看 FSM 根属性', () => (window as unknown as { selectRoot(): void }).selectRoot(), 'linkish');
}

function renderRoot(m: FsmModel, host: InspectorHost, root: HTMLElement): void {
  const r = m.doc.root;
  const box = section(root, 'FSM 根属性 (rAIFSM)');
  let rowEl = row(box, 'mOwnerObjectName');
  textInput(rowEl, m.str(r, 'mOwnerObjectName'), (v) => { m.snapshot(); m.setField(r, 'mOwnerObjectName', v); m.doc.rootName = v; host.requestRender(); });
  rowEl = row(box, 'mQuality');
  numInput(rowEl, m.getNum(r, 'mQuality'), (v) => { m.snapshot(); m.setField(r, 'mQuality', v); });
  rowEl = row(box, 'mFSMAttribute');
  numInput(rowEl, m.getNum(r, 'mFSMAttribute'), (v) => { m.snapshot(); m.setField(r, 'mFSMAttribute', v); });
  rowEl = row(box, '初始状态节点');
  const select = document.createElement('select');
  for (const nd of m.nodes()) {
    const o = document.createElement('option');
    o.value = String(m.getNum(nd, 'mId'));
    o.textContent = `${m.getNum(nd, 'mId')} — ${m.str(nd, 'mName')}`;
    select.appendChild(o);
  }
  select.value = String(m.initialStateId());
  select.addEventListener('change', () => { m.snapshot(); m.setField(m.rootCluster(), 'mInitialStateId', Number(select.value)); host.requestRender(); });
  rowEl.appendChild(select);
}

// ----- node -----

function renderNode(m: FsmModel, host: InspectorHost, root: HTMLElement, nodeId: number): void {
  const node = m.nodeById(nodeId);
  if (!node) { root.innerHTML = '<div class="inspEmpty">节点已被删除</div>'; return; }
  const title = section(root, `节点 ${nodeId} — ${m.str(node, 'mName') || '(未命名)'}`);

  let r = row(title, '名称 mName');
  textInput(r, m.str(node, 'mName'), (v) => { m.snapshot(); m.setField(node, 'mName', v); host.requestRender(); });

  const motion = m.nodeMotionNo(node);
  r = row(title, 'ActionNo（动作号）');
  numInput(r, m.nodeActionNo(node) ?? -1, (v) => { m.snapshot(); m.setNodeActionNo(node, v); host.requestRender(); }, { wide: true });
  r = row(title, 'MotionNo（动作号）');
  numInput(r, motion?.motion ?? -1, (v) => { m.snapshot(); m.setNodeMotionNo(node, v, motion?.phase ?? -1); host.requestRender(); }, { wide: true });
  r = row(title, 'MotionNo_Phase1');
  numInput(r, motion?.phase ?? -1, (v) => { m.snapshot(); m.setNodeMotionNo(node, motion?.motion ?? 0, v); });

  r = row(title, 'mUniqueId');
  const ro = document.createElement('span');
  ro.textContent = String(m.getNum(node, 'mUniqueId'));
  ro.className = 'dim';
  r.appendChild(ro);

  r = row(title, 'mColorType');
  numInput(r, m.getNum(node, 'mColorType'), (v) => { m.snapshot(); m.setField(node, 'mColorType', v); host.requestRender(); });

  r = row(title, 'mSetting');
  numInput(r, m.getNum(node, 'mSetting'), (v) => { m.snapshot(); m.setField(node, 'mSetting', v); });

  r = row(title, 'mUserAttribute');
  numInput(r, m.getNum(node, 'mUserAttribute'), (v) => { m.snapshot(); m.setField(node, 'mUserAttribute', v); });

  r = row(title, '全局条件转换');
  checkbox(r, m.getNum(node, 'mExistConditionTrainsitionFromAll') === 1, (v) => {
    m.snapshot();
    m.setField(node, 'mExistConditionTrainsitionFromAll', v ? 1 : 0);
    host.requestRender();
  });
  const condOpts = m.conditions().map((c, i) => [i, m.conditionSummary(c)] as const);
  const condSelect = conditionSelect(condOpts, m.getNum(node, 'mConditionTrainsitionFromAllId'));
  condSelect.addEventListener('change', () => {
    m.snapshot();
    m.setField(node, 'mConditionTrainsitionFromAllId', Number(condSelect.value));
  });
  r.appendChild(condSelect);

  // links
  const linkBox = section(root, `出链接 (${m.linksOf(node).length})`);
  m.linksOf(node).forEach((lk, idx) => {
    const lb = document.createElement('div');
    lb.className = 'linkItem' + (isLinkSelected(host, nodeId, idx) ? ' sel' : '');
    const destSel = document.createElement('select');
    for (const nd of m.nodes()) {
      const o = document.createElement('option');
      o.value = String(m.getNum(nd, 'mId'));
      o.textContent = `${m.getNum(nd, 'mId')} — ${m.str(nd, 'mName')}`;
      destSel.appendChild(o);
    }
    destSel.value = String(m.getNum(lk, 'mDestinationNodeId'));
    destSel.addEventListener('change', () => { m.snapshot(); m.setField(lk, 'mDestinationNodeId', Number(destSel.value)); host.requestRender(); });
    lb.appendChild(destSel);
    const condSel2 = conditionSelect(condOpts, m.getNum(lk, 'mConditionId'), m.getNum(lk, 'mExistCondition') !== 1);
    condSel2.addEventListener('change', () => {
      m.snapshot();
      if (condSel2.value === '') m.setField(lk, 'mExistCondition', 0);
      else { m.setField(lk, 'mExistCondition', 1); m.setField(lk, 'mConditionId', Number(condSel2.value)); }
    });
    lb.appendChild(condSel2);
    textInput(lb, m.str(lk, 'mName'), (v) => { m.snapshot(); m.setField(lk, 'mName', v); });
    const btns = document.createElement('span');
    btns.className = 'btns';
    button(btns, '→', () => { host.selectNode(m.getNum(lk, 'mDestinationNodeId')); }, 'linkish');
    button(btns, '删', () => { m.snapshot(); m.deleteLink(node, idx); host.requestRender(); }, 'danger');
    lb.appendChild(btns);
    linkBox.appendChild(lb);
  });
  const addRow = document.createElement('div');
  addRow.className = 'row';
  button(addRow, '＋ 添加链接', () => {
    m.snapshot();
    const firstId = m.nodes()[0] ? m.getNum(m.nodes()[0], 'mId') : 0;
    m.addLink(node, firstId, null);
    host.requestRender();
  }, 'primary');
  linkBox.appendChild(addRow);

  // danger zone
  const dz = section(root, '危险操作');
  button(dz, '删除此节点', () => {
    if (!confirm(`删除节点 ${nodeId}（${m.str(node, 'mName')}）及其所有链接？`)) return;
    m.snapshot();
    m.deleteNode(nodeId);
    host.setSelection({ kind: 'none' });
    host.requestRender();
  }, 'danger');
}

function isLinkSelected(host: InspectorHost, nodeId: number, idx: number): boolean {
  return host.selection.kind === 'link' && host.selection.nodeId === nodeId && host.selection.linkIndex === idx;
}

function conditionSelect(opts: readonly (readonly [number, string])[], current: number, includeNone = true): HTMLSelectElement {
  const sel = document.createElement('select');
  if (includeNone) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = '（无条件）';
    sel.appendChild(o);
  }
  opts.forEach(([i, summary]) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = truncate(summary, 42);
    sel.appendChild(o);
  });
  sel.value = includeNone && current === 0 ? '' : String(current);
  return sel;
}

function renderLink(m: FsmModel, host: InspectorHost, root: HTMLElement, nodeId: number, linkIndex: number): void {
  const node = m.nodeById(nodeId);
  const link = node ? m.linksOf(node)[linkIndex] : undefined;
  if (!node || !link) { root.innerHTML = '<div class="inspEmpty">链接已被删除</div>'; return; }
  const box = section(root, `链接: ${nodeId} → ${m.getNum(link, 'mDestinationNodeId')}`);
  let r = row(box, '目标节点');
  const destSel = document.createElement('select');
  for (const nd of m.nodes()) {
    const o = document.createElement('option');
    o.value = String(m.getNum(nd, 'mId'));
    o.textContent = `${m.getNum(nd, 'mId')} — ${m.str(nd, 'mName')}`;
    destSel.appendChild(o);
  }
  destSel.value = String(m.getNum(link, 'mDestinationNodeId'));
  destSel.addEventListener('change', () => { m.snapshot(); m.setField(link, 'mDestinationNodeId', Number(destSel.value)); host.requestRender(); });
  r.appendChild(destSel);

  r = row(box, '条件');
  const condOpts = m.conditions().map((c, i) => [i, m.conditionSummary(c)] as const);
  const sel2 = conditionSelect(condOpts, m.getNum(link, 'mConditionId'), m.getNum(link, 'mExistCondition') !== 1);
  sel2.addEventListener('change', () => {
    m.snapshot();
    if (sel2.value === '') { m.setField(link, 'mExistCondition', 0); }
    else { m.setField(link, 'mExistCondition', 1); m.setField(link, 'mConditionId', Number(sel2.value)); }
    host.requestRender();
  });
  r.appendChild(sel2);
  button(r, '＋新建组合条件', () => {
    m.snapshot();
    const created = m.addCondition();
    const root = created.tree.__vals__['mpRootNode'];
    if (isInstance(root)) {
      m.setField(root, 'mOperator', 16); // And
      const child = m.makeVariableNode('', ownerGuess(m));
      const kids = m.memberList(root, 'mpChildList');
      kids.push(child);
      m.setList(root, 'mpChildList', kids);
    }
    m.setField(link, 'mExistCondition', 1);
    m.setField(link, 'mConditionId', created.index);
    host.selection = { kind: 'condition', condIndex: created.index };
    host.requestRender();
  }, 'mini');
  const src = m.conditions()[m.getNum(link, 'mConditionId')];
  if (m.getNum(link, 'mExistCondition') === 1 && src) {
    button(r, '编辑条件', () => {
      host.setSelection({ kind: 'condition', condIndex: m.getNum(link, 'mConditionId') });
      document.getElementById('tabConds')?.click();
      host.requestRender();
    }, 'linkish');
  }

  r = row(box, '链接名');
  textInput(r, m.str(link, 'mName'), (v) => { m.snapshot(); m.setField(link, 'mName', v); });

  const dz = section(root, '操作');
  button(dz, '删除此链接', () => {
    m.snapshot();
    m.deleteLink(node, linkIndex);
    host.setSelection({ kind: 'node', nodeId });
    host.requestRender();
  }, 'danger');
}

// ----- condition list & tree editor -----

export function renderConditionEditor(m: FsmModel, host: InspectorHost, root: HTMLElement, condIndex: number): void {
  const tree = m.conditions()[condIndex];
  if (!tree) { root.innerHTML = '<div class="inspEmpty">条件已被删除</div>'; return; }
  const box = section(root, `条件 #${condIndex}`);
  let r = row(box, '条件号 (mName.mId)');
  numInput(r, m.getNum(tree.__vals__['mName'] as XfsInstance, 'mId'), (v) => {
    m.snapshot();
    (tree.__vals__['mName'] as XfsInstance).__vals__['mId'] = v;
  });
  r = row(box, '引用次数');
  const usage = document.createElement('span');
  usage.textContent = `${m.conditionUsage(condIndex)} 处`;
  usage.className = 'dim';
  r.appendChild(usage);

  const rootNode = tree.__vals__['mpRootNode'];
  if (isInstance(rootNode) && m.defName(rootNode.__class__).endsWith('OperationNode')) {
    const listBox = section(root, '条件组合（列表）');
    const rOp = row(listBox, '组合方式');
    const opSel = document.createElement('select');
    for (const [v, label] of OPERATORS) {
      if (v !== 0 && v !== 16 && v !== 17 && v < 1) continue;
      const o = document.createElement('option');
      o.value = String(v);
      o.textContent = v === 0 ? '单个条件（直通）' : v === 16 ? '同时满足（AND）' : '任一满足（OR）';
      opSel.appendChild(o);
    }
    opSel.value = String(m.getNum(rootNode, 'mOperator'));
    opSel.addEventListener('change', () => { m.snapshot(); m.setField(rootNode, 'mOperator', Number(opSel.value)); host.requestRender(); });
    rOp.appendChild(opSel);

    const kids = m.memberList(rootNode, 'mpChildList');
    kids.forEach((child, ci) => {
      const isVar = m.defName(child.__class__).endsWith('VariableNode');
      const cr = document.createElement('div');
      cr.className = 'condCombineRow';
      const tag = document.createElement('span');
      tag.className = 'condTag';
      tag.textContent = isVar ? '变量' : '嵌套组';
      cr.appendChild(tag);
      if (isVar) {
        const vi = child.__vals__['mVariable'];
        if (isInstance(vi)) {
          const propIn = document.createElement('input');
          propIn.type = 'text';
          propIn.value = m.str(vi, 'mPropertyName');
          propIn.placeholder = '属性名（如 R）';
          propIn.addEventListener('change', () => { m.snapshot(); m.setField(vi, 'mPropertyName', propIn.value); host.requestRender(); });
          const dlId = 'dl-combine-' + condIndex;
          propIn.setAttribute('list', dlId);
          if (!document.getElementById(dlId)) {
            const dl = document.createElement('datalist');
            dl.id = dlId;
            for (const pName of [...new Set([...COMMON_PROPS, ...m.collectPropertyNames()])]) {
              const o = document.createElement('option');
              o.value = pName;
              dl.appendChild(o);
            }
            listBox.appendChild(dl);
          }
          cr.appendChild(propIn);
          const ownerIn = document.createElement('input');
          ownerIn.type = 'text';
          ownerIn.value = m.str(vi, 'mOwnerName');
          ownerIn.placeholder = 'Owner';
          ownerIn.addEventListener('change', () => { m.snapshot(); m.setField(vi, 'mOwnerName', ownerIn.value); });
          cr.appendChild(ownerIn);
          const idxIn = document.createElement('input');
          idxIn.type = 'number';
          idxIn.value = String(m.getNum(child, 'mIndex'));
          idxIn.title = 'mIndex';
          idxIn.addEventListener('change', () => { m.snapshot(); m.setField(child, 'mIndex', Math.trunc(Number(idxIn.value) || 0)); });
          cr.appendChild(idxIn);
        }
      } else {
        const note = document.createElement('span');
        note.className = 'dim small';
        note.textContent = m.conditionSummaryOf(child);
        cr.appendChild(note);
      }
      const btns = document.createElement('span');
      btns.className = 'btns';
      button(btns, '↑', () => {
        if (ci === 0) return;
        m.snapshot();
        const arr = m.memberList(rootNode, 'mpChildList');
        [arr[ci - 1], arr[ci]] = [arr[ci], arr[ci - 1]];
        m.setList(rootNode, 'mpChildList', arr);
        host.requestRender();
      }, 'mini');
      button(btns, '↓', () => {
        m.snapshot();
        const arr = m.memberList(rootNode, 'mpChildList');
        if (ci >= arr.length - 1) return;
        [arr[ci + 1], arr[ci]] = [arr[ci], arr[ci + 1]];
        m.setList(rootNode, 'mpChildList', arr);
        host.requestRender();
      }, 'mini');
      button(btns, '删', () => {
        m.snapshot();
        m.setList(rootNode, 'mpChildList', m.memberList(rootNode, 'mpChildList').filter((_, i) => i !== ci));
        host.requestRender();
      }, 'mini danger');
      cr.appendChild(btns);
      listBox.appendChild(cr);
    });

    const addRow = document.createElement('div');
    addRow.className = 'rowCond';
    button(addRow, '＋ 变量条件', () => {
      m.snapshot();
      const arr = m.memberList(rootNode, 'mpChildList');
      arr.push(m.makeVariableNode('', ownerGuess(m)));
      m.setList(rootNode, 'mpChildList', arr);
      host.requestRender();
    }, 'mini');
    button(addRow, '＋ 嵌套逻辑组', () => {
      m.snapshot();
      const arr = m.memberList(rootNode, 'mpChildList');
      arr.push(m.makeOperationNode(0));
      m.setList(rootNode, 'mpChildList', arr);
      host.requestRender();
    }, 'mini');
    listBox.appendChild(addRow);
  }

  const treeBox = section(root, '条件树（完整视图）');
  if (isInstance(rootNode)) {
    renderCondNode(m, host, treeBox, rootNode, condIndex, 0);
  }

  const dz = section(root, '操作');
  button(dz, '删除此条件（自动清理引用）', () => {
    if (!confirm(`删除条件 #${condIndex}？引用它的链接将变为无条件。`)) return;
    m.snapshot();
    m.deleteCondition(condIndex);
    host.setSelection({ kind: 'none' });
    host.requestRender();
  }, 'danger');
}

function renderCondNode(m: FsmModel, host: InspectorHost, box: HTMLElement, node: XfsInstance, condIndex: number, depth: number): void {
  const defName = m.defName(node.__class__);
  const wrap = document.createElement('div');
  wrap.className = `condNode depth${Math.min(depth, 5)}`;
  const head = document.createElement('div');
  head.className = 'condHead';
  if (defName.endsWith('OperationNode')) {
    const op = document.createElement('select');
    for (const [v, label] of OPERATORS) {
      const o = document.createElement('option');
      o.value = String(v);
      o.textContent = label;
      op.appendChild(o);
    }
    op.value = String(m.getNum(node, 'mOperator'));
    op.addEventListener('change', () => { m.snapshot(); m.setField(node, 'mOperator', Number(op.value)); });
    head.appendChild(op);
  } else if (defName.endsWith('VariableNode')) {
    const tag = document.createElement('span');
    tag.className = 'condTag';
    tag.textContent = '变量';
    head.appendChild(tag);
  } else {
    const tag = document.createElement('span');
    tag.className = 'condTag';
    tag.textContent = defName;
    head.appendChild(tag);
  }
  wrap.appendChild(head);

  if (defName.endsWith('VariableNode')) {
    const vi = node.__vals__['mVariable'];
    if (isInstance(vi)) {
      let r = row(wrap, '属性名');
      textInput(r, m.str(vi, 'mPropertyName'), (v) => {
        m.snapshot();
        m.setField(vi, 'mPropertyName', v);
        host.requestRender();
      }, [...new Set([...COMMON_PROPS, ...m.collectPropertyNames()])]);
      r = row(wrap, 'Owner');
      textInput(r, m.str(vi, 'mOwnerName'), (v) => { m.snapshot(); m.setField(vi, 'mOwnerName', v); });
      r = row(wrap, 'IsSingletonOwner');
      checkbox(r, m.getNum(vi, 'mIsSingletonOwner') === 1, (v) => { m.snapshot(); m.setField(vi, 'mIsSingletonOwner', v ? 1 : 0); });
    }
    let r = row(wrap, 'mIndex');
    numInput(r, m.getNum(node, 'mIndex'), (v) => { m.snapshot(); m.setField(node, 'mIndex', v); });
    r = row(wrap, 'IsBitNo');
    checkbox(r, m.getNum(node, 'mIsBitNo') === 1, (v) => { m.snapshot(); m.setField(node, 'mIsBitNo', v ? 1 : 0); });
    r = row(wrap, 'IsArray');
    checkbox(r, m.getNum(node, 'mIsArray') === 1, (v) => { m.snapshot(); m.setField(node, 'mIsArray', v ? 1 : 0); });
    r = row(wrap, 'IsDynamicIndex');
    checkbox(r, m.getNum(node, 'mIsDynamicIndex') === 1, (v) => { m.snapshot(); m.setField(node, 'mIsDynamicIndex', v ? 1 : 0); });
    r = row(wrap, 'UseEnumIndex');
    checkbox(r, m.getNum(node, 'mUseEnumIndex') === 1, (v) => { m.snapshot(); m.setField(node, 'mUseEnumIndex', v ? 1 : 0); });
  }

  // children (OperationNode / VariableNode with childList)
  if (defName.endsWith('OperationNode') || defName.endsWith('VariableNode')) {
    const kids = m.memberList(node, 'mpChildList');
    kids.forEach((child, ci) => {
      const childWrap = document.createElement('div');
      childWrap.className = 'condChild';
      const bar = document.createElement('div');
      bar.className = 'condChildBar';
      button(bar, '×', () => {
        m.snapshot();
        m.setList(node, 'mpChildList', m.memberList(node, 'mpChildList').filter((_, i) => i !== ci));
        host.requestRender();
      }, 'danger mini');
      childWrap.appendChild(bar);
      renderCondNode(m, host, childWrap, child, condIndex, depth + 1);
      wrap.appendChild(childWrap);
    });
    if (defName.endsWith('OperationNode')) {
      const addRow = document.createElement('div');
      addRow.className = 'rowCond';
      button(addRow, '＋ 子节点', (e) => {
        const menu = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement | null;
        if (menu) menu.classList.toggle('hidden');
      }, 'mini');
      const menu = document.createElement('span');
      menu.className = 'hidden';
      button(menu, '逻辑组', () => {
        m.snapshot();
        pushChild(m, node, m.makeOperationNode(0));
        host.requestRender();
      }, 'mini');
      button(menu, '变量条件', () => {
        m.snapshot();
        pushChild(m, node, m.makeVariableNode('', ownerGuess(m)));
        host.requestRender();
      }, 'mini');
      addRow.appendChild(menu);
      wrap.appendChild(addRow);
    }
  }
  box.appendChild(wrap);
}

function pushChild(m: FsmModel, node: XfsInstance, child: XfsInstance): void {
  const cur = m.memberList(node, 'mpChildList');
  cur.push(child);
  m.setList(node, 'mpChildList', cur);
}

function ownerGuess(m: FsmModel): string {
  return m.doc.rootName || 'cFSMPl_W03';
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
