// FsmModel: editing layer over the generic XFS document tree.
// All mutations are plain operations on the instance tree; the UI pushes
// JSON snapshots onto the undo stack around them.
import { BUILTIN_DEFS, ClassDef, MtType } from './deftable';
import { XfsDoc, XfsInstance, XfsNull, XfsValue, isInstance, isNullRef, parseXfs, writeXfs } from './xfs';
import { parseMtXml, writeMtXml } from './fsmxml';

export type Selection =
  | { kind: 'none' }
  | { kind: 'root' }
  | { kind: 'node'; nodeId: number }
  | { kind: 'multi'; nodeIds: number[] }
  | { kind: 'link'; nodeId: number; linkIndex: number }
  | { kind: 'condition'; condIndex: number };

export class FsmModel {
  doc: XfsDoc;
  format: 'binary' | 'xml' = 'binary';
  fileName = '';
  dirty = false;
  warnings: string[] = [];
  onChange: (() => void) | null = null;

  private undoStack: string[] = [];
  private redoStack: string[] = [];

  constructor(doc: XfsDoc) { this.doc = doc; }

  static fromBinary(bytes: Uint8Array, fileName: string): FsmModel {
    const m = new FsmModel(parseXfs(bytes));
    m.format = 'binary';
    m.fileName = fileName;
    return m;
  }

  static fromXml(text: string, fileName: string): FsmModel {
    const m = new FsmModel(parseMtXml(text));
    m.format = 'xml';
    m.fileName = fileName;
    return m;
  }

  toBinary(): Uint8Array { return writeXfs(this.doc); }
  toXml(): string { return writeMtXml(this.doc); }

  // ----- undo / redo -------------------------------------------------------

  snapshot(): void {
    this.undoStack.push(JSON.stringify(this.doc.root));
    if (this.undoStack.length > 200) this.undoStack.shift();
    this.redoStack = [];
    this.dirty = true;
    this.onChange?.();
  }

  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }

  undo(): void {
    const snap = this.undoStack.pop();
    if (!snap) return;
    this.redoStack.push(JSON.stringify(this.doc.root));
    this.doc.root = JSON.parse(snap);
    this.onChange?.();
  }

  redo(): void {
    const snap = this.redoStack.pop();
    if (!snap) return;
    this.undoStack.push(JSON.stringify(this.doc.root));
    this.doc.root = JSON.parse(snap);
    this.onChange?.();
  }

  // ----- structure accessors ------------------------------------------------

  defName(idx: number): string { return this.doc.defs[idx]?.name ?? `#${idx}`; }

  rootCluster(): XfsInstance {
    const v = this.doc.root.__vals__['mpRootCluster'];
    if (!isInstance(v)) throw new Error('FSM 缺少根 cluster');
    return v;
  }

  conditionTree(): XfsInstance | null {
    const v = this.doc.root.__vals__['mpConditionTree'];
    return isInstance(v) ? v : null;
  }

  nodes(): XfsInstance[] {
    return this.memberList(this.rootCluster(), 'mpNodeList');
  }

  nodeById(id: number): XfsInstance | undefined {
    return this.nodes().find((nd) => nd.__vals__['mId'] === id);
  }

  linksOf(node: XfsInstance): XfsInstance[] {
    return this.memberList(node, 'mpLinkList');
  }

  processesOf(node: XfsInstance): XfsInstance[] {
    return this.memberList(node, 'mpProcessList');
  }

  conditions(): XfsInstance[] {
    const ct = this.conditionTree();
    if (!ct) return [];
    return this.memberList(ct, 'mpTreeList');
  }

  initialStateId(): number {
    return Number(this.rootCluster().__vals__['mInitialStateId'] ?? 0);
  }

  // ----- field helpers ------------------------------------------------------

  getNum(inst: XfsInstance, name: string): number { return Number(inst.__vals__[name] ?? 0); }
  setField(inst: XfsInstance, name: string, value: XfsValue | XfsValue[] | null): void {
    inst.__vals__[name] = value;
    this.dirty = true;
  }
  str(inst: XfsInstance, name: string): string {
    const v = inst.__vals__[name];
    return typeof v === 'string' ? v : '';
  }
  list(inst: XfsInstance, name: string): XfsValue[] | null {
    const v = inst.__vals__[name];
    return Array.isArray(v) ? (v as XfsValue[]) : null;
  }
  /** class-list member as an array, whether the file boxed it or not */
  memberList(inst: XfsInstance, name: string): XfsInstance[] {
    return onlyInstances(inst.__vals__[name]);
  }
  setList(inst: XfsInstance, name: string, arr: XfsValue[]): void {
    inst.__vals__[name] = arr;
    this.dirty = true;
  }

  // ----- node level editing --------------------------------------------------

  nextNodeId(): number {
    return Math.max(-1, ...this.nodes().map((nd) => this.getNum(nd, 'mId'))) + 1;
  }

  private nextUniqueId(): number {
    return Math.max(0, ...this.nodes().map((nd) => this.getNum(nd, 'mUniqueId'))) + 1;
  }

  private actionSetDefIndex(): number {
    const idx = this.doc.defs.findIndex((d) => /ActionSet/.test(d.name));
    if (idx >= 0) return idx;
    // fall back: a def whose members are exactly ActionNo:Class
    return this.doc.defs.findIndex((d) => d.members.length === 1 && d.members[0].name === 'ActionNo');
  }

  private enumDefIndex(): number {
    return this.doc.defs.findIndex((d) => d.members.some((mm) => mm.name === 'EnumValue'));
  }

  private makeInstance(defIdx: number): XfsInstance {
    const vals: XfsInstance['__vals__'] = {};
    for (const mem of this.doc.defs[defIdx].members) {
      vals[mem.name] = mem.type === MtType.Class || mem.type === MtType.ClassRef ? null : defaultValueFor(mem.type);
    }
    return { __class__: defIdx, __vals__: vals };
  }

  newNode(name: string, kind: 'plain' | 'action' | 'motion' = 'plain'): XfsInstance {
    const node = this.makeInstance(this.defIndexByName('cAIFSMNode'));
    node.__vals__['mName'] = name;
    node.__vals__['mId'] = this.nextNodeId();
    node.__vals__['mUniqueId'] = this.nextUniqueId();
    node.__vals__['mpSubCluster'] = { __null__: true, __id__: 0xfffe };
    node.__vals__['mpLinkList'] = [];
    node.__vals__['mpProcessList'] = [];
    node.__vals__['mUIPos'] = 0;
    node.__vals__['mColorType'] = kind === 'action' ? 1 : kind === 'motion' ? 5 : 0;
    node.__vals__['mSetting'] = 1;
    if (kind === 'action') this.setNodeActionNo(node, 0);
    if (kind === 'motion') this.setNodeMotionNo(node, 0, -1);
    const cluster = this.rootCluster();
    const list = this.list(cluster, 'mpNodeList');
    if (list) list.push(node);
    else this.setList(cluster, 'mpNodeList', [node]);
    return node;
  }

  deleteNode(nodeId: number): void {
    const cluster = this.rootCluster();
    const list = this.list(cluster, 'mpNodeList');
    if (!list) return;
    const idx = list.findIndex((nd) => isInstance(nd) && (nd as XfsInstance).__vals__['mId'] === nodeId);
    if (idx < 0) return;
    list.splice(idx, 1);
    // drop links pointing at the deleted node
    for (const nd of this.nodes()) {
      const kept = this.linksOf(nd).filter((lk) => lk.__vals__['mDestinationNodeId'] !== nodeId);
      this.setList(nd, 'mpLinkList', kept);
    }
    if (this.initialStateId() === nodeId) this.setField(this.rootCluster(), 'mInitialStateId', this.nodes()[0] ? this.getNum(this.nodes()[0], 'mId') : 0);
  }

  addLink(node: XfsInstance, destId: number, conditionId: number | null): XfsInstance {
    const link = this.makeInstance(this.defIndexByName('cAIFSMLink'));
    link.__vals__['mName'] = '';
    link.__vals__['mDestinationNodeId'] = destId;
    if (conditionId === null) {
      link.__vals__['mExistCondition'] = 0;
      link.__vals__['mConditionId'] = 0;
    } else {
      link.__vals__['mExistCondition'] = 1;
      link.__vals__['mConditionId'] = conditionId;
    }
    const list = this.list(node, 'mpLinkList');
    if (list) list.push(link);
    else this.setList(node, 'mpLinkList', [link]);
    return link;
  }

  deleteLink(node: XfsInstance, linkIndex: number): void {
    this.list(node, 'mpLinkList')?.splice(linkIndex, 1);
  }

  /** swap a link with its neighbour — link order is the game's evaluation
   *  priority, so the first matching condition wins (e.g. `R+Circle` must sit
   *  above plain `R`, or the shorter one always eats the input) */
  moveLink(node: XfsInstance, from: number, to: number): void {
    const list = this.list(node, 'mpLinkList');
    if (!list || from === to) return;
    if (from < 0 || to < 0 || from >= list.length || to >= list.length) return;
    const [lk] = list.splice(from, 1);
    list.splice(to, 0, lk);
    this.dirty = true;
  }

  deleteCondition(condIndex: number): void {
    const ct = this.conditionTree();
    if (!ct) return;
    const list = this.list(ct, 'mpTreeList');
    if (!list) return;
    list.splice(condIndex, 1);
    // remap references: == idx becomes unconditional, > idx shifts down
    for (const nd of this.nodes()) {
      for (const lk of this.linksOf(nd)) {
        const cid = this.getNum(lk, 'mConditionId');
        if (this.getNum(lk, 'mExistCondition') === 1) {
          if (cid === condIndex) this.setField(lk, 'mExistCondition', 0);
          else if (cid > condIndex) this.setField(lk, 'mConditionId', cid - 1);
        } else if (cid > condIndex) {
          this.setField(lk, 'mConditionId', cid - 1);
        }
      }
      const allId = this.getNum(nd, 'mConditionTrainsitionFromAllId');
      if (this.getNum(nd, 'mExistConditionTrainsitionFromAll') === 1) {
        if (allId === condIndex) this.setField(nd, 'mExistConditionTrainsitionFromAll', 0);
        else if (allId > condIndex) this.setField(nd, 'mConditionTrainsitionFromAllId', allId - 1);
      } else if (allId > condIndex) {
        this.setField(nd, 'mConditionTrainsitionFromAllId', allId - 1);
      }
    }
  }

  addCondition(): { tree: XfsInstance; index: number } {
    let ct = this.conditionTree();
    if (!ct) {
      const ctIdx = this.doc.defs.findIndex((d) => d.name === 'rAIConditionTree');
      ct = this.makeInstance(ctIdx);
      ct.__vals__['mpTreeList'] = [];
      this.doc.root.__vals__['mpConditionTree'] = ct;
    }
    void ct;
    const treeIdx = this.defIndexByName('rAIConditionTree::TreeInfo');
    const enumIdx = this.defIndexByName('cAIDEnum');
    const tree = this.makeInstance(treeIdx);
    const nameEnum = this.makeInstance(enumIdx);
    nameEnum.__vals__['mId'] = this.conditions().length;
    tree.__vals__['mName'] = nameEnum;
    tree.__vals__['mpRootNode'] = this.makeOperationNode(0);
    const list = this.list(ct, 'mpTreeList');
    if (list) list.push(tree);
    else this.setList(ct, 'mpTreeList', [tree]);
    return { tree, index: this.list(ct, 'mpTreeList')!.length - 1 };
  }

  // ----- condition tree factories ---------------------------------------------

  makeOperationNode(operator: number): XfsInstance {
    const inst = this.makeInstance(this.defIndexByName('rAIConditionTree::OperationNode'));
    inst.__vals__['mpChildList'] = [];
    inst.__vals__['mOperator'] = operator;
    return inst;
  }

  makeVariableNode(propertyName: string, ownerName: string): XfsInstance {
    const inst = this.makeInstance(this.defIndexByName('rAIConditionTree::VariableNode'));
    const vi = this.makeInstance(this.defIndexByName('rAIConditionTree::VariableNode::VariableInfo'));
    vi.__vals__['mPropertyName'] = propertyName;
    vi.__vals__['mOwnerName'] = ownerName;
    vi.__vals__['mIsSingletonOwner'] = 0;
    inst.__vals__['mpChildList'] = [];
    inst.__vals__['mVariable'] = vi;
    inst.__vals__['mIsBitNo'] = 0;
    inst.__vals__['mIsArray'] = 0;
    inst.__vals__['mIsDynamicIndex'] = 0;
    inst.__vals__['mIndex'] = 0;
    inst.__vals__['mIndexVariable'] = this.makeInstance(this.defIndexByName('rAIConditionTree::VariableNode::VariableInfo'));
    (inst.__vals__['mIndexVariable'] as XfsInstance).__vals__['mPropertyName'] = '';
    (inst.__vals__['mIndexVariable'] as XfsInstance).__vals__['mOwnerName'] = '';
    (inst.__vals__['mIndexVariable'] as XfsInstance).__vals__['mIsSingletonOwner'] = 0;
    inst.__vals__['mUseEnumIndex'] = 0;
    inst.__vals__['mIndexEnum'] = this.makeInstance(this.defIndexByName('nAI::EnumProp'));
    return inst;
  }

  makeConstS32(value: number): XfsInstance {
    // no dedicated ConstS32 def appears in weapon FSMs; operation node with a
    // single variable child covers the practical cases. This factory is kept
    // for future const-node support once a sample provides the def.
    throw new Error('此 FSM 未包含常量节点类定义');
  }

  // ----- processes --------------------------------------------------------------

  nodeActionNo(node: XfsInstance): number | null {
    for (const proc of this.processesOf(node)) {
      const param = proc.__vals__['mpParameter'];
      if (isInstance(param)) {
        const actionNo = param.__vals__['ActionNo'];
        if (isInstance(actionNo)) return Number(actionNo.__vals__['EnumValue'] ?? 0);
      }
    }
    return null;
  }

  nodeMotionNo(node: XfsInstance): { motion: number; phase: number } | null {
    for (const proc of this.processesOf(node)) {
      const param = proc.__vals__['mpParameter'];
      if (isInstance(param) && 'MotionNo' in param.__vals__) {
        return { motion: Number(param.__vals__['MotionNo'] ?? 0), phase: Number(param.__vals__['MotionNo_Phase1'] ?? 0) };
      }
    }
    return null;
  }

  private containerSuffix(): string {
    for (const nd of this.nodes()) {
      const proc = this.processesOf(nd)[0];
      if (proc) {
        const cn = this.str(proc, 'mContainerName');
        const mMatch = cn.match(/_(W\d+)$/);
        if (mMatch) return `_${mMatch[1]}`;
        return '';
      }
    }
    const mMatch = this.doc.rootName.match(/_(W\d+)$/);
    return mMatch ? `_${mMatch[1]}` : '';
  }

  /** Action_W03 / LinkMotion_W03 style container names, matching XFsm */
  private containerName(kind: 'action' | 'motion'): string {
    const base = kind === 'action' ? 'Action' : 'LinkMotion';
    const suffix = this.containerSuffix();
    return suffix ? `${base}${suffix}` : base;
  }

  private linkMotionDefIndex(): number {
    const idx = this.doc.defs.findIndex((d) => /LinkMotion/.test(d.name));
    if (idx >= 0) return idx;
    return this.doc.defs.findIndex((d) => d.members.some((mm) => mm.name === 'MotionNo'));
  }

  setNodeActionNo(node: XfsInstance, actionNo: number): void {
    const procs = this.processesOf(node);
    for (const proc of procs) {
      const param = proc.__vals__['mpParameter'];
      if (isInstance(param) && isInstance(param.__vals__['ActionNo'])) {
        (param.__vals__['ActionNo'] as XfsInstance).__vals__['EnumValue'] = actionNo;
        return;
      }
    }
    // create a new Action process
    const procDefIdx = this.defIndexByName('cAIFSMNodeProcess');
    const proc = this.makeInstance(procDefIdx);
    proc.__vals__['mContainerName'] = this.containerName('action');
    proc.__vals__['mCategoryName'] = 'cAIFSMProcessContainer';
    const setIdx = this.actionSetDefIndex();
    if (setIdx < 0) throw new Error('此 FSM 没有 ActionSet 参数类定义，无法设置 ActionNo');
    const param = this.makeInstance(setIdx);
    const enumIdx = this.enumDefIndex();
    if (enumIdx < 0) throw new Error('此 FSM 没有 MtEnum 类定义，无法设置 ActionNo');
    const en = this.makeInstance(enumIdx);
    en.__vals__['EnumValue'] = actionNo;
    param.__vals__['ActionNo'] = en;
    proc.__vals__['mpParameter'] = param;
    node.__vals__['mpProcessList'] = [proc];
  }

  setNodeMotionNo(node: XfsInstance, motionNo: number, phase: number): void {
    const procs = this.processesOf(node);
    for (const proc of procs) {
      const param = proc.__vals__['mpParameter'];
      if (isInstance(param) && 'MotionNo' in param.__vals__) {
        param.__vals__['MotionNo'] = motionNo;
        param.__vals__['MotionNo_Phase1'] = phase;
        return;
      }
    }
    const procDefIdx = this.defIndexByName('cAIFSMNodeProcess');
    const proc = this.makeInstance(procDefIdx);
    proc.__vals__['mContainerName'] = this.containerName('motion');
    proc.__vals__['mCategoryName'] = 'cAIFSMProcessContainer';
    const motionIdx = this.linkMotionDefIndex();
    if (motionIdx < 0) throw new Error('此 FSM 没有 LinkMotion 参数类定义，无法设置 MotionNo');
    const param = this.makeInstance(motionIdx);
    param.__vals__['MotionNo'] = motionNo;
    param.__vals__['MotionNo_Phase1'] = phase;
    proc.__vals__['mpParameter'] = param;
    const list = this.list(node, 'mpProcessList');
    if (list) list.push(proc);
    else this.setList(node, 'mpProcessList', [proc]);
  }

  hasProcessContainer(node: XfsInstance, prefix: string): boolean {
    return this.processesOf(node).some((p) => this.str(p, 'mContainerName').startsWith(prefix));
  }

  // ----- condition summary / references ----------------------------------------

  conditionSummary(tree: XfsInstance): string {
    const parts: string[] = [];
    const nameObj = tree.__vals__['mName'];
    let idStr = '?';
    if (isInstance(nameObj)) idStr = String(nameObj.__vals__['mId'] ?? '?');
    const collect = (v: XfsValue | XfsValue[] | null, depth: number): void => {
      if (depth > 8 || !isInstance(v)) return;
      const defName = this.defName(v.__class__);
      if (defName.endsWith('OperationNode')) {
        const kids = v.__vals__['mpChildList'];
        if (Array.isArray(kids)) kids.forEach((k) => collect(k, depth + 1));
      } else if (defName.endsWith('VariableNode')) {
        const vi = v.__vals__['mVariable'];
        if (isInstance(vi)) {
          const p = this.str(vi, 'mPropertyName');
          if (p) parts.push(p);
        }
        const kids = v.__vals__['mpChildList'];
        if (Array.isArray(kids)) kids.forEach((k) => collect(k, depth + 1));
      }
    };
    const root = tree.__vals__['mpRootNode'];
    if (isInstance(root)) collect(root, 0);
    return `#${idStr}: ${parts.join(' & ') || '(空条件)'}`;
  }

  /** summary for an arbitrary condition-tree node (nested groups etc.) */
  conditionSummaryOf(node: XfsInstance): string {
    const parts: string[] = [];
    const collect = (v: XfsValue | XfsValue[] | null, depth: number): void => {
      if (depth > 8 || !isInstance(v)) return;
      const defName = this.defName(v.__class__);
      if (defName.endsWith('OperationNode')) {
        const kids = v.__vals__['mpChildList'];
        if (Array.isArray(kids)) kids.forEach((k) => collect(k, depth + 1));
      } else if (defName.endsWith('VariableNode')) {
        const vi = v.__vals__['mVariable'];
        if (isInstance(vi)) {
          const p = this.str(vi, 'mPropertyName');
          parts.push(p || '(未填属性)');
        }
        const kids = v.__vals__['mpChildList'];
        if (Array.isArray(kids)) kids.forEach((k) => collect(k, depth + 1));
      }
    };
    collect(node, 0);
    return parts.join(' & ') || '(空)';
  }

  conditionUsage(condIndex: number): number {
    let count = 0;
    for (const nd of this.nodes()) {
      for (const lk of this.linksOf(nd)) {
        if (this.getNum(lk, 'mConditionId') === condIndex) count++;
      }
      if (this.getNum(nd, 'mConditionTrainsitionFromAllId') === condIndex) count++;
    }
    return count;
  }

  collectPropertyNames(): string[] {
    const names = new Set<string>();
    const visit = (v: XfsValue | XfsValue[] | null, depth: number): void => {
      if (depth > 24 || !isInstance(v)) return;
      const dn = this.defName(v.__class__);
      if (dn.endsWith('VariableInfo')) {
        const p = this.str(v, 'mPropertyName');
        if (p) names.add(p);
      }
      for (const val of Object.values(v.__vals__)) {
        if (Array.isArray(val)) val.forEach((x) => visit(x, depth + 1));
        else visit(val, depth + 1);
      }
    };
    visit(this.doc.root, 0);
    return [...names].sort();
  }

  // ----- validation -------------------------------------------------------------

  validate(): string[] {
    const problems: string[] = [];
    const ids = new Set<number>();
    for (const nd of this.nodes()) ids.add(this.getNum(nd, 'mId'));
    for (const nd of this.nodes()) {
      const nid = this.getNum(nd, 'mId');
      for (const lk of this.linksOf(nd)) {
        const dst = this.getNum(lk, 'mDestinationNodeId');
        if (!ids.has(dst)) problems.push(`节点 ${nid} 有链接指向不存在的节点 ${dst}`);
        const cid = this.getNum(lk, 'mConditionId');
        const hasCond = this.getNum(lk, 'mExistCondition') === 1;
        if (hasCond && cid >= this.conditions().length) {
          problems.push(`节点 ${nid} 链接引用了越界条件 #${cid}`);
        }
      }
      const allId = this.getNum(nd, 'mConditionTrainsitionFromAllId');
      if (this.getNum(nd, 'mExistConditionTrainsitionFromAll') === 1 && allId >= this.conditions().length) {
        problems.push(`节点 ${nid} 的全局转换引用了越界条件 #${allId}`);
      }
    }
    const dup = this.nodes().length !== ids.size;
    if (dup) problems.push('存在重复的节点 mId');
    return problems;
  }

  private defIndexByName(name: string): number {
    const idx = this.doc.defs.findIndex((d) => d.name === name);
    if (idx < 0) throw new Error(`此 FSM 缺少类定义 ${name}`);
    return idx;
  }
}

function onlyInstances(arr: XfsValue[] | XfsValue | null | undefined): XfsInstance[] {
  if (arr === null || arr === undefined) return [];
  const list = Array.isArray(arr) ? arr : [arr];
  return list.filter((x): x is XfsInstance => isInstance(x));
}

function defaultValueFor(t: MtType): XfsValue {
  switch (t) {
    case MtType.String: return '';
    case MtType.F32: case MtType.F64: return 0;
    case MtType.RGBA: return [0, 0, 0, 0];
    case MtType.Vec3: case MtType.Vec4: case MtType.Quat: return [0, 0, 0, 0];
    default: return 0;
  }
}

export { isInstance, isNullRef };
export type { XfsNull };
