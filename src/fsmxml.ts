// MtSerializer XML: the human-readable format XFsm exports/imports ("Save As .xml").
// We accept XFsm-shaped XML and emit XFsm-shaped XML so files stay interoperable
// with the in-game editor (field order quirks reproduced: node/link mName last,
// root mLastEditType omitted, EnumProp carries empty mName/mEnumName strings).
import { BUILTIN_DEFS, ClassDef, DefMember, MtType, NAME_TO_HASH } from './deftable';
import { XfsDoc, XfsInstance, XfsValue, isNullRef } from './xfs';

const SCALAR_TAG_TO_TYPE: Record<string, MtType> = {
  bool: MtType.Bool,
  u8: MtType.U8,
  u16: MtType.U16,
  u32: MtType.U32,
  u64: MtType.U64,
  s8: MtType.S8,
  s16: MtType.S16,
  s32: MtType.S32,
  s64: MtType.S64,
  f32: MtType.F32,
  f64: MtType.F64,
  string: MtType.String,
};

interface XmlElem {
  tag: string;
  attrs: Record<string, string>;
  children: XmlElem[];
}

// --- tiny XML tokenizer (MtSerializer XML is machine-generated and regular;
// this avoids DOMParser so the same code runs in node tests and the browser)

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function encodeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function encodeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseXml(text: string): XmlElem {
  let i = 0;
  const n = text.length;
  const decl = text.startsWith('<?xml');
  if (decl) {
    i = text.indexOf('?>');
    if (i < 0) throw new Error('XML 声明未闭合');
    i += 2;
  }
  const skipWs = (): void => { while (i < n && /\s/.test(text[i])) i++; };

  const parseElem = (): XmlElem => {
    skipWs();
    if (text[i] !== '<') throw new Error(`XML 解析错误: 期望 '<' @${i}`);
    i++;
    let tag = '';
    while (i < n && /[^\s/>]/.test(text[i])) tag += text[i++];
    const attrs: Record<string, string> = {};
    for (;;) {
      skipWs();
      if (text[i] === '>' ) { i++; break; }
      if (text[i] === '/' && text[i + 1] === '>') { i += 2; return { tag, attrs, children: [] }; }
      let an = '';
      while (i < n && /[^\s=]/.test(text[i])) an += text[i++];
      skipWs();
      if (text[i] !== '=') throw new Error(`XML 属性缺少 = @${i}`);
      i++;
      skipWs();
      const q = text[i];
      if (q !== '"' && q !== "'") throw new Error(`XML 属性引号错误 @${i}`);
      i++;
      let av = '';
      while (i < n && text[i] !== q) av += text[i++];
      i++;
      attrs[an] = decodeEntities(av);
    }
    const children: XmlElem[] = [];
    for (;;) {
      skipWs();
      if (text.startsWith('</', i)) {
        i = text.indexOf('>', i) + 1;
        return { tag, attrs, children };
      }
      if (text.startsWith('<!--', i)) { i = text.indexOf('-->', i) + 3; continue; }
      children.push(parseElem());
    }
  };

  const root = parseElem();
  return root;
}

// --- defs resolution

interface ParseCtx {
  defs: ClassDef[];
  byName: Map<string, number>;
  unknownClasses: Set<string>;
}

function defFor(ctx: ParseCtx, typeName: string, membersIfNew: DefMember[]): number {
  let idx = ctx.byName.get(typeName);
  if (idx !== undefined) return idx;
  const builtin = BUILTIN_DEFS.find((d) => d.name === typeName);
  if (builtin) {
    idx = ctx.defs.length;
    ctx.defs.push({ ...builtin, members: builtin.members.map((mm) => ({ ...mm })) });
  } else {
    idx = ctx.defs.length;
    ctx.defs.push({ name: typeName, hash: NAME_TO_HASH[typeName] ?? 0, members: membersIfNew });
    ctx.unknownClasses.add(typeName);
  }
  ctx.byName.set(typeName, idx);
  return idx;
}

function inferMember(child: XmlElem): DefMember {
  const scalar = SCALAR_TAG_TO_TYPE[child.tag];
  if (scalar !== undefined) return { name: child.attrs['name'] ?? '', type: scalar, flags: 0, size: scalar === MtType.String ? 8 : 4 };
  if (child.tag === 'class') return { name: child.attrs['name'] ?? '', type: MtType.Class, flags: 0, size: 8 };
  if (child.tag === 'classref') return { name: child.attrs['name'] ?? '', type: MtType.ClassRef, flags: 0, size: 8 };
  if (child.tag === 'array') return { name: child.attrs['name'] ?? '', type: MtType.ClassRef, flags: 160, size: 8 };
  throw new Error(`无法识别的 XML 元素 <${child.tag}>`);
}

function parseInstance(ctx: ParseCtx, elem: XmlElem): XfsInstance {
  const typeName = elem.attrs['type'] ?? '';
  const known = BUILTIN_DEFS.find((d) => d.name === typeName);
  const defIdx = defFor(ctx, typeName, known ? [] : elem.children.map(inferMember));
  const def = ctx.defs[defIdx];
  const inst: XfsInstance = { __class__: defIdx, __vals__: {} };
  // known classes: assign by name (order-independent), canonical member set
  for (const mem of def.members) inst.__vals__[mem.name] = mem.type === MtType.ClassRef || mem.type === MtType.Class ? null : defaultValue(mem.type);
  const childByName = new Map<string, XmlElem[]>();
  for (const c of elem.children) {
    const nm = c.attrs['name'] ?? '';
    if (!childByName.has(nm)) childByName.set(nm, []);
    childByName.get(nm)!.push(c);
  }
  if (!known) {
    // synthesized def mirrors document order exactly
    for (const c of elem.children) {
      const mem = inferMember(c);
      inst.__vals__[mem.name] = parseMemberValue(ctx, mem, c);
    }
  } else {
    for (const [nm, elems] of childByName) {
      const mem = def.members.find((mm) => mm.name === nm);
      if (!mem) continue; // XML-only field (e.g. nAI::EnumProp mName strings): drop
      inst.__vals__[nm] = parseMemberValue(ctx, mem, elems[0]);
    }
  }
  return inst;
}

function defaultValue(t: MtType): XfsValue {
  switch (t) {
    case MtType.String: return '';
    case MtType.Bool: return 0;
    case MtType.F32: case MtType.F64: return 0;
    case MtType.RGBA: return [0, 0, 0, 0];
    case MtType.Vec3: case MtType.Quat: return [0, 0, 0, 0];
    case MtType.Vec4: return [0, 0, 0, 0];
    default: return 0;
  }
}

function parseMemberValue(ctx: ParseCtx, mem: DefMember, elem: XmlElem): XfsValue | XfsValue[] | null {
  if (elem.tag === 'array') {
    const out: XfsValue[] = [];
    for (const c of elem.children) {
      if (c.attrs['type'] === 'null') out.push({ __null__: true, __id__: 0xfffe });
      else out.push(parseInstance(ctx, c));
    }
    return out;
  }
  if (elem.tag === 'classref') {
    if (elem.attrs['type'] === 'null') return { __null__: true, __id__: 0xfffe };
    return parseInstance(ctx, elem);
  }
  if (elem.tag === 'class') return parseInstance(ctx, elem);
  const scalar = SCALAR_TAG_TO_TYPE[elem.tag];
  if (scalar !== undefined) return parseScalar(scalar, elem.attrs['value'] ?? '');
  throw new Error(`无法解析成员 <${elem.tag} name="${elem.attrs['name']}">`);
}

function parseScalar(t: MtType, raw: string): number | string {
  switch (t) {
    case MtType.Bool: return raw === 'true' || raw === '1' ? 1 : 0;
    case MtType.F32: return Math.fround(parseFloat(raw));
    case MtType.F64: return parseFloat(raw);
    case MtType.String: return raw;
    case MtType.S8: case MtType.S16: case MtType.S32:
      return parseInt(raw, 10) | 0;
    case MtType.U8: case MtType.U16: case MtType.U32: case MtType.U64: case MtType.S64:
      return parseInt(raw, 10) >>> 0;
    default: return parseInt(raw, 10);
  }
}

// --- public API

export function parseMtXml(text: string): XfsDoc {
  const root = parseXml(text);
  if (root.tag !== 'class') throw new Error(`根元素不是 <class>（是 <${root.tag}>）`);
  const ctx: ParseCtx = { defs: [], byName: new Map(), unknownClasses: new Set() };
  const inst = parseInstance(ctx, root);
  return {
    v1: 0x13,
    v2: 0x0e05,
    defs: ctx.defs,
    root: inst,
    rootName: root.attrs['name'] ?? '',
  };
}

// XFsm XML field-order quirks
const XML_ORDER_OVERRIDES: Record<string, { omit?: string[]; moveLast?: string[]; extras?: string[] }> = {
  'rAIFSM': { omit: ['mLastEditType'] },
  'cAIFSMNode': { moveLast: ['mName'] },
  'cAIFSMLink': { moveLast: ['mName'] },
  'nAI::EnumProp': { extras: ['mName', 'mEnumName'] },
};

export function writeMtXml(doc: XfsDoc): string {
  const out: string[] = ['<?xml version="1.0" encoding="utf-8"?>'];
  const writeInstance = (inst: XfsInstance, elemName: string | null, elemTag: string, depth: number, typeNameOverride?: string): void => {
    const def = doc.defs[inst.__class__];
    const ind = '\t'.repeat(depth);
    const typeAttr = typeNameOverride ?? def.name;
    const openLine = elemName !== null
      ? `${ind}<${elemTag} name="${encodeAttr(elemName)}" type="${encodeAttr(typeAttr)}"`
      : `${ind}<${elemTag} type="${encodeAttr(typeAttr)}"`;
    const over = XML_ORDER_OVERRIDES[def.name] ?? {};
    const members = orderedMembers(def, over);
    if (members.length === 0) {
      out.push(`${openLine}/>` );
      return;
    }
    out.push(`${openLine}>`);
    for (const key of members) {
      writeMember(inst, key, depth + 1);
    }
    // template extras (EnumProp empty strings)
    for (const extra of over.extras ?? []) {
      out.push(`${'\t'.repeat(depth + 1)}<string name="${extra}" value=""/>`);
    }
    out.push(`${ind}</${elemTag}>`);
  };

  const writeMember = (inst: XfsInstance, name: string, depth: number): void => {
    const def = doc.defs[inst.__class__];
    const mem = def.members.find((mm) => mm.name === name);
    if (!mem) return;
    const v = inst.__vals__[name];
    const ind = '\t'.repeat(depth);
    if (mem.type === MtType.ClassRef && Array.isArray(v)) {
      out.push(`${ind}<array name="${encodeAttr(name)}" type="classref" count="${v.length}">`);
      for (const e of v) {
        if (isNullRef(e)) {
          out.push(`${ind}\t<classref type="null"/>`);
        } else {
          writeInstance(e as XfsInstance, null, 'classref', depth + 1);
        }
      }
      out.push(`${ind}</array>`);
      return;
    }
    if (v === null || v === undefined) {
      if (mem.type === MtType.ClassRef || mem.type === MtType.Class) {
        out.push(`${ind}<classref name="${encodeAttr(name)}" type="null"/>`);
      } else {
        // scalar with no value: emit default
        writeScalar(mem, defaultValue(mem.type), ind);
      }
      return;
    }
    if (mem.type === MtType.ClassRef) {
      if (isNullRef(v)) {
        out.push(`${ind}<classref name="${encodeAttr(name)}" type="null"/>`);
      } else {
        writeInstance(v as XfsInstance, name, 'classref', depth);
      }
      return;
    }
    if (mem.type === MtType.Class) {
      writeInstance(v as XfsInstance, name, 'class', depth);
      return;
    }
    writeScalar(mem, v, ind);
  };

  const writeScalar = (mem: DefMember, v: unknown, ind: string): void => {
    const tag = SCALAR_TYPE_TO_TAG[mem.type];
    if (!tag) return;
    let val: string;
    if (mem.type === MtType.Bool) val = v ? 'true' : 'false';
    else if (mem.type === MtType.String) val = encodeAttr(String(v));
    else val = String(v);
    out.push(`${ind}<${tag} name="${encodeAttr(mem.name)}" value="${val}"/>`);
  };

  writeInstance(doc.root, doc.rootName, 'class', 0);
  out.push('');
  return out.join('\n');
}

function orderedMembers(def: ClassDef, over: { omit?: string[]; moveLast?: string[] }): string[] {
  let names = def.members.map((mm) => mm.name);
  if (over.omit) names = names.filter((nm) => !over.omit!.includes(nm));
  if (over.moveLast) {
    for (const last of over.moveLast) {
      names = names.filter((nm) => nm !== last);
      names.push(last);
    }
  }
  return names;
}

const SCALAR_TYPE_TO_TAG: Partial<Record<MtType, string>> = {
  [MtType.Bool]: 'bool',
  [MtType.U8]: 'u8',
  [MtType.U16]: 'u16',
  [MtType.U32]: 'u32',
  [MtType.U64]: 'u64',
  [MtType.S8]: 's8',
  [MtType.S16]: 's16',
  [MtType.S32]: 's32',
  [MtType.S64]: 's64',
  [MtType.F32]: 'f32',
  [MtType.F64]: 'f64',
  [MtType.String]: 'string',
};



