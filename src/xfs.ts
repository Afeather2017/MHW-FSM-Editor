// XFS binary container: MT Framework serialized FSM files (.fsm).
//
// Layout (byte-verified against game-written wp03_action.fsm samples):
//   0x00 "XFS\0" | u16 v1=0x13 | u16 v2=0x0E05 | u64 instanceCount
//   0x10 u32 defCount | u32 defsBlockLen
//   0x18 defs block:
//        defCount × u64  (block-relative offset of each def's hash field)
//        packed records: { u64 hash, u64 memberCount, members × 0x50:
//          { u64 namePtr (block-relative C-string offset), u8 type, u8 flags,
//            u8 size, 69 zero bytes } }
//        member-name C-strings (first-use order), zero padding to 8
//   instances (to EOF): ClassEntry tree; every member value is u32-count-prefixed.
//     ClassEntry = { u16 classId = defIndex*2+1, u16 var = ordinal++,
//                    u64 size = 8 + bodyLen, body }
//     null classref = { u16 0xFFFE, u16 0 }
import { ClassDef, DefMember, HASH_TO_NAME, MtType } from './deftable';

export interface XfsInstance {
  __class__: number; // index into doc.defs
  __vals__: Record<string, XfsValue | XfsValue[] | null>;
}

export interface XfsNull {
  __null__: boolean;
  __id__: number; // 0xFFFE (or 0xFFFF) null-reference marker
}

export type PrimValue = number | string | number[];
export type XfsValue = XfsInstance | XfsNull | PrimValue;

export function isNullRef(v: unknown): v is XfsNull {
  return !!v && typeof v === 'object' && '__null__' in (v as Record<string, unknown>);
}
export function isInstance(v: unknown): v is XfsInstance {
  return !!v && typeof v === 'object' && '__vals__' in (v as Record<string, unknown>);
}

export interface XfsDoc {
  v1: number;
  v2: number;
  defs: ClassDef[];
  root: XfsInstance;
  rootName: string; // mOwnerObjectName for FSMs
}

const NULL_ID = 0xfffe;

class Reader {
  pos = 0;
  constructor(readonly data: Uint8Array) {}
  u8(): number { return this.data[this.pos++]; }
  u16(): number { const v = this.data[this.pos] | (this.data[this.pos + 1] << 8); this.pos += 2; return v; }
  u32(): number {
    const v = this.data[this.pos] | (this.data[this.pos + 1] << 8) | (this.data[this.pos + 2] << 16) | (this.data[this.pos + 3] << 24);
    this.pos += 4;
    return v >>> 0;
  }
  u64(): number {
    let lo = this.u32(), hi = this.u32();
    return hi * 0x100000000 + lo;
  }
  f32(): number {
    const b = this.data.slice(this.pos, this.pos + 4);
    this.pos += 4;
    return Math.fround(new DataView(b.buffer, b.byteOffset, 4).getFloat32(0, true));
  }
  f64(): number {
    const b = this.data.slice(this.pos, this.pos + 8);
    this.pos += 8;
    return new DataView(b.buffer, b.byteOffset, 8).getFloat64(0, true);
  }
  cstr(): string {
    let end = this.pos;
    while (this.data[end] !== 0) end++;
    const s = new TextDecoder('utf-8').decode(this.data.subarray(this.pos, end));
    this.pos = end + 1;
    return s;
  }
  raw(n: number): Uint8Array {
    const b = this.data.subarray(this.pos, this.pos + n);
    this.pos += n;
    return b;
  }
}

class Writer {
  buf: number[] = [];
  u8(v: number): void { this.buf.push(v & 0xff); }
  u16(v: number): void { this.buf.push(v & 0xff, (v >>> 8) & 0xff); }
  u32(v: number): void { this.buf.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff); }
  u64(v: number): void {
    const lo = v % 0x100000000, hi = Math.floor(v / 0x100000000);
    this.u32(lo); this.u32(hi);
  }
  f32(v: number): void { this.raw(new Uint8Array(new Float32Array([Math.fround(v)]).buffer)); }
  f64(v: number): void { this.raw(new Uint8Array(new Float64Array([v]).buffer)); }
  raw(b: Uint8Array | number[]): void { for (let i = 0; i < b.length; i++) this.buf.push(b[i]); }
  cstr(s: string): void { this.raw(Array.from(new TextEncoder().encode(s))); this.u8(0); }
  bytes(): Uint8Array { return new Uint8Array(this.buf); }
}

export function parseXfs(data: Uint8Array): XfsDoc {
  if (data.length < 0x18) throw new Error('文件太小，不是 XFS 格式');
  const sig = String.fromCharCode(data[0], data[1], data[2], data[3]);
  if (sig !== 'XFS\0') throw new Error(`错误的文件签名 "${sig}"（需要 "XFS\\0"）`);
  const r = new Reader(data);
  r.pos = 4;
  const v1 = r.u16(), v2 = r.u16();
  r.u64(); // instance count (recomputed on write)
  const defCount = r.u32();
  const blockLen = r.u32();
  const defsBase = 0x18;
  const instBase = defsBase + blockLen;

  // def records
  const dir: number[] = [];
  for (let i = 0; i < defCount; i++) { r.pos = defsBase + i * 8; dir.push(r.u64()); }
  const defs: ClassDef[] = [];
  const decoder = new TextDecoder('utf-8');
  for (let i = 0; i < defCount; i++) {
    r.pos = dir[i] + 0x18; // hash sits 0x18 after the directory value
    const hash = r.u64();
    const memberCount = r.u64();
    const members: DefMember[] = [];
    for (let j = 0; j < memberCount; j++) {
      const namePtr = r.u64();
      const type = r.u8(), flags = r.u8(), size = r.u8();
      r.raw(69);
      let name = '';
      if (namePtr) {
        let end = namePtr + defsBase;
        while (data[end] !== 0) end++;
        name = decoder.decode(data.subarray(namePtr + defsBase, end));
      }
      members.push({ name, type, flags, size });
    }
    defs.push({ name: HASH_TO_NAME[hash] ?? `0x${hash.toString(16)}`, hash, members });
  }

  // instances
  r.pos = instBase;
  const ctx = { r, defs, stack: '' as string };
  const root = readClassEntry(ctx);
  if (r.pos !== data.length) {
    throw new Error(`实例数据解析后仍有 ${data.length - r.pos} 字节剩余（格式不匹配）`);
  }
  const rootInst = root as XfsInstance;
  let rootName = '';
  const own = rootInst.__vals__['mOwnerObjectName'];
  if (typeof own === 'string') rootName = own;
  return { v1, v2, defs, root: rootInst, rootName };
}

interface ReadCtx { r: Reader; defs: ClassDef[]; stack: string; }

function readClassEntry(ctx: ReadCtx): XfsValue {
  const { r } = ctx;
  const classId = r.u16();
  r.u16(); // var ordinal (recomputed on write)
  if (classId === NULL_ID || classId === 0xffff) return { __null__: true, __id__: classId };
  const defIdx = (classId / 2) | 0;
  const def = ctx.defs[defIdx];
  if (!def) throw new Error(`类索引越界: id=${classId} @0x${(r.pos - 4).toString(16)}`);
  r.u64(); // body size (includes itself; not needed for reading)
  const saved = ctx.stack;
  ctx.stack = saved + `${def.name}.`;
  const inst: XfsInstance = { __class__: defIdx, __vals__: {} };
  for (const mem of def.members) {
    const count = r.u32();
    if (count === 0) { inst.__vals__[mem.name] = null; continue; }
    if (count === 1) {
      inst.__vals__[mem.name] = readValue(ctx, mem);
    } else {
      const arr: XfsValue[] = [];
      for (let i = 0; i < count; i++) arr.push(readValue(ctx, mem));
      inst.__vals__[mem.name] = arr;
    }
  }
  ctx.stack = saved;
  return inst;
}

function readValue(ctx: ReadCtx, mem: DefMember): XfsValue {
  const { r } = ctx;
  switch (mem.type) {
    case MtType.Class:
    case MtType.ClassRef:
      return readClassEntry(ctx);
    case MtType.Bool:
    case MtType.U8: return r.u8();
    case MtType.U16: return r.u16();
    case MtType.U32: return r.u32();
    case MtType.U64: return r.u64();
    case MtType.S8: return (r.u8() << 24) >> 24;
    case MtType.S16: return (r.u16() << 16) >> 16;
    case MtType.S32: return r.u32() | 0;
    case MtType.S64: return r.u64();
    case MtType.F32: return r.f32();
    case MtType.F64: return r.f64();
    case MtType.String: return r.cstr();
    case MtType.RGBA: {
      const out: number[] = [];
      for (let i = 0; i < 4; i++) out.push(r.u8());
      return out;
    }
    case MtType.Ptr: return r.u64();
    case MtType.Vec3:
    case MtType.Vec4:
    case MtType.Quat: {
      const n = mem.type === MtType.Vec3 ? 3 : 4;
      const out: number[] = [];
      for (let i = 0; i < n; i++) out.push(r.f32());
      return out;
    }
    default:
      throw new Error(`${ctx.stack}${mem.name}: 未知类型 ${mem.type}`);
  }
}

// ---------------------------------------------------------------------------
// writing

export function writeXfs(doc: XfsDoc): Uint8Array {
  const defsBlock = buildDefsBlock(doc.defs);

  // body first: instances, with ordinal bookkeeping (the header stores the
  // total non-null instance count, verified against game-written files)
  const ordinal = { n: 0 };
  currentDefs = doc.defs;
  const instWriter = new Writer();
  writeEntry(instWriter, doc.root, ordinal);
  currentDefs = [];
  const instBytes = instWriter.bytes();

  const w = new Writer();
  w.raw(new TextEncoder().encode('XFS\0'));
  w.u16(doc.v1); w.u16(doc.v2);
  w.u64(ordinal.n);
  w.u32(doc.defs.length);
  w.u32(defsBlock.length);
  w.raw(defsBlock);
  w.raw(instBytes);
  return w.bytes();
}

export function buildDefsBlock(defs: ClassDef[]): Uint8Array {
  const w = new Writer();
  const n = defs.length;
  // block-relative offset of each def's hash field; directory entries hold
  // this value, readers add the 0x18 defs base to get the file offset
  let pos = n * 8;
  const hashOff: number[] = [];
  for (const def of defs) {
    hashOff.push(pos);
    pos += 16 + 0x50 * def.members.length;
  }
  // member-name C-strings in first-use order, then zero pad to 8
  const strOff: Record<string, number> = {};
  const strings: number[] = [];
  for (const def of defs) {
    for (const mem of def.members) {
      if (mem.name && !(mem.name in strOff)) {
        strOff[mem.name] = pos + strings.length;
        for (const b of new TextEncoder().encode(mem.name)) strings.push(b);
        strings.push(0);
      }
    }
  }
  const pad = (8 - ((pos + strings.length) % 8)) % 8;

  for (const off of hashOff) w.u64(off);
  for (const def of defs) {
    w.u64(def.hash);
    w.u64(def.members.length);
    for (const mem of def.members) {
      w.u64(mem.name ? strOff[mem.name] : 0);
      w.u8(mem.type); w.u8(mem.flags); w.u8(mem.size);
      for (let k = 0; k < 69; k++) w.u8(0);
    }
  }
  w.raw(strings);
  for (let k = 0; k < pad; k++) w.u8(0);
  return w.bytes();
}

function writeEntry(w: Writer, value: XfsValue, ordinal: { n: number }): void {
  const inst = value as XfsInstance & { __null__?: boolean; __id__?: number };
  if (inst && inst.__null__) {
    w.u16(inst.__id__ ?? NULL_ID);
    w.u16(0);
    return;
  }
  const varId = ordinal.n++;
  const body = new Writer();
  writeMembers(body, inst, ordinal);
  const bodyBytes = body.bytes();
  w.u16(inst.__class__ * 2 + 1);
  w.u16(varId);
  w.u64(bodyBytes.length + 8);
  w.raw(bodyBytes);
}

function writeMembers(w: Writer, inst: XfsInstance, ordinal: { n: number }): void {
  const def = currentDefs[inst.__class__];
  if (!def) throw new Error(`写出时找不到类定义 #${inst.__class__}`);
  for (const mem of def.members) {
    const v = inst.__vals__[mem.name];
    if (v === null || v === undefined) { w.u32(0); continue; }
    if (Array.isArray(v)) {
      w.u32(v.length);
      for (const e of v) writeValue(w, mem, e as XfsValue, ordinal);
    } else {
      w.u32(1);
      writeValue(w, mem, v as XfsValue, ordinal);
    }
  }
}

// The instance tree does not carry a back-reference to its defs array; set
// module-level before serializing a tree (writeXfs / serializeInstances).
let currentDefs: ClassDef[] = [];

export function serializeInstances(root: XfsInstance, defs: ClassDef[]): Uint8Array {
  currentDefs = defs;
  const w = new Writer();
  const ordinal = { n: 0 };
  writeEntry(w, root, ordinal);
  currentDefs = [];
  return w.bytes();
}

function writeValue(w: Writer, mem: DefMember, v: XfsValue, ordinal: { n: number }): void {
  switch (mem.type) {
    case MtType.Class:
    case MtType.ClassRef:
      writeEntry(w, v, ordinal);
      return;
    case MtType.Bool: w.u8(v ? 1 : 0); return;
    case MtType.U8: w.u8(Number(v)); return;
    case MtType.U16: w.u16(Number(v)); return;
    case MtType.U32: w.u32(Number(v) >>> 0); return;
    case MtType.U64: w.u64(Number(v)); return;
    case MtType.S8: w.u8(Number(v) & 0xff); return;
    case MtType.S16: w.u16(Number(v) & 0xffff); return;
    case MtType.S32: w.u32(Number(v) | 0); return;
    case MtType.S64: w.u64(Number(v)); return;
    case MtType.F32: w.f32(Number(v)); return;
    case MtType.F64: w.f64(Number(v)); return;
    case MtType.String: w.cstr(String(v)); return;
    case MtType.RGBA:
      for (const b of v as number[]) w.u8(b);
      return;
    case MtType.Ptr: w.u64(Number(v)); return;
    case MtType.Vec3:
    case MtType.Vec4:
    case MtType.Quat:
      for (const f of v as number[]) w.f32(f);
      return;
    default:
      throw new Error(`${mem.name}: 未知类型 ${mem.type}`);
  }
}
