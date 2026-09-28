"use strict";
(() => {
  // src/deftable.ts
  var m = (name, type, flags = 0, size = 0) => ({ name, type, flags, size });
  var BUILTIN_DEFS = [
    {
      name: "rAIFSM",
      hash: 1723094544,
      members: [
        m("mQuality", 6 /* U32 */, 145, 4),
        m("mOwnerObjectName", 14 /* String */, 0, 8),
        m("mpRootCluster", 2 /* ClassRef */, 0, 8),
        m("mpConditionTree", 2 /* ClassRef */, 0, 8),
        m("mFSMAttribute", 6 /* U32 */, 0, 4),
        m("mLastEditType", 6 /* U32 */, 0, 4)
      ]
    },
    {
      name: "cAIFSMCluster",
      hash: 411468038,
      members: [
        m("mId", 6 /* U32 */, 0, 4),
        m("mOwnerNodeUniqueId", 6 /* U32 */, 0, 4),
        m("mInitialStateId", 6 /* U32 */, 0, 4),
        m("mpNodeList", 2 /* ClassRef */, 160, 8)
      ]
    },
    {
      name: "cAIFSMNode",
      hash: 1345706237,
      members: [
        m("mName", 14 /* String */, 0, 8),
        m("mId", 6 /* U32 */, 0, 4),
        m("mUniqueId", 6 /* U32 */, 0, 4),
        m("mOwnerId", 6 /* U32 */, 0, 4),
        m("mpSubCluster", 2 /* ClassRef */, 0, 8),
        m("mpLinkList", 2 /* ClassRef */, 160, 8),
        m("mpProcessList", 2 /* ClassRef */, 160, 8),
        m("mUIPos", 6 /* U32 */, 0, 4),
        m("mColorType", 4 /* U8 */, 0, 1),
        m("mSetting", 6 /* U32 */, 0, 4),
        m("mUserAttribute", 6 /* U32 */, 0, 4),
        m("mExistConditionTrainsitionFromAll", 3 /* Bool */, 0, 1),
        m("mConditionTrainsitionFromAllId", 6 /* U32 */, 0, 4)
      ]
    },
    {
      name: "cAIFSMLink",
      hash: 1676061001,
      members: [
        m("mName", 14 /* String */, 0, 8),
        m("mDestinationNodeId", 6 /* U32 */, 0, 4),
        m("mExistCondition", 3 /* Bool */, 0, 1),
        m("mConditionId", 6 /* U32 */, 0, 4)
      ]
    },
    {
      name: "cAIFSMNodeProcess",
      hash: 1620948288,
      members: [
        m("mContainerName", 14 /* String */, 0, 8),
        m("mCategoryName", 14 /* String */, 0, 8),
        m("mpParameter", 2 /* ClassRef */, 0, 8)
      ]
    },
    {
      name: "nPlFSM::ActionSet_W03",
      hash: 1314856239,
      members: [m("ActionNo", 1 /* Class */, 4, 8)]
    },
    {
      name: "MtEnum",
      hash: 2120343442,
      members: [m("EnumValue", 10 /* S32 */, 128, 4)]
    },
    {
      name: "nPlFSM::LinkMotion_W03",
      hash: 431532545,
      members: [
        m("MotionNo", 10 /* S32 */, 0, 4),
        m("MotionNo_Phase1", 10 /* S32 */, 0, 4)
      ]
    },
    {
      name: "rAIConditionTree",
      hash: 2019452450,
      members: [
        m("mQuality", 6 /* U32 */, 145, 4),
        m("mpTreeList", 2 /* ClassRef */, 160, 8)
      ]
    },
    {
      name: "rAIConditionTree::TreeInfo",
      hash: 1455101785,
      members: [
        m("mName", 1 /* Class */, 0, 8),
        m("mpRootNode", 2 /* ClassRef */, 0, 8)
      ]
    },
    {
      name: "cAIDEnum",
      hash: 740917853,
      members: [m("mId", 6 /* U32 */, 0, 4)]
    },
    {
      name: "rAIConditionTree::OperationNode",
      hash: 473071737,
      members: [
        m("mpChildList", 2 /* ClassRef */, 160, 8),
        m("mOperator", 6 /* U32 */, 0, 4)
      ]
    },
    {
      name: "rAIConditionTree::VariableNode",
      hash: 1033179304,
      members: [
        m("mpChildList", 2 /* ClassRef */, 160, 8),
        m("mVariable", 1 /* Class */, 0, 8),
        m("mIsBitNo", 3 /* Bool */, 0, 1),
        m("mIsArray", 3 /* Bool */, 0, 1),
        m("mIsDynamicIndex", 3 /* Bool */, 0, 1),
        m("mIndex", 6 /* U32 */, 0, 4),
        m("mIndexVariable", 1 /* Class */, 0, 8),
        m("mUseEnumIndex", 3 /* Bool */, 0, 1),
        m("mIndexEnum", 1 /* Class */, 0, 8)
      ]
    },
    {
      name: "rAIConditionTree::VariableNode::VariableInfo",
      hash: 1042257449,
      members: [
        m("mPropertyName", 14 /* String */, 0, 8),
        m("mOwnerName", 14 /* String */, 0, 8),
        m("mIsSingletonOwner", 3 /* Bool */, 0, 1)
      ]
    },
    {
      name: "nAI::EnumProp",
      hash: 1748142764,
      members: [
        m("mNameCRC", 6 /* U32 */, 1, 4),
        m("mEnumNameCRC", 6 /* U32 */, 1, 4)
      ]
    }
  ];
  var HASH_TO_NAME = {};
  var NAME_TO_HASH = {};
  for (const d of BUILTIN_DEFS) {
    HASH_TO_NAME[d.hash] = d.name;
    NAME_TO_HASH[d.name] = d.hash;
  }
  for (const w2 of ["W01", "W02", "W03", "W04", "W05", "W06", "W07", "W08", "W09", "W10", "W11", "W12", "W13", "W14"]) {
    const set = `nPlFSM::ActionSet_${w2}`;
    const motion = `nPlFSM::LinkMotion_${w2}`;
    NAME_TO_HASH[set] = NAME_TO_HASH[set] ?? 0;
    NAME_TO_HASH[motion] = NAME_TO_HASH[motion] ?? 0;
  }

  // src/xfs.ts
  function isNullRef(v) {
    return !!v && typeof v === "object" && "__null__" in v;
  }
  function isInstance(v) {
    return !!v && typeof v === "object" && "__vals__" in v;
  }
  var NULL_ID = 65534;
  var Reader = class {
    constructor(data) {
      this.data = data;
      this.pos = 0;
    }
    u8() {
      return this.data[this.pos++];
    }
    u16() {
      const v = this.data[this.pos] | this.data[this.pos + 1] << 8;
      this.pos += 2;
      return v;
    }
    u32() {
      const v = this.data[this.pos] | this.data[this.pos + 1] << 8 | this.data[this.pos + 2] << 16 | this.data[this.pos + 3] << 24;
      this.pos += 4;
      return v >>> 0;
    }
    u64() {
      let lo = this.u32(), hi = this.u32();
      return hi * 4294967296 + lo;
    }
    f32() {
      const b = this.data.slice(this.pos, this.pos + 4);
      this.pos += 4;
      return Math.fround(new DataView(b.buffer, b.byteOffset, 4).getFloat32(0, true));
    }
    f64() {
      const b = this.data.slice(this.pos, this.pos + 8);
      this.pos += 8;
      return new DataView(b.buffer, b.byteOffset, 8).getFloat64(0, true);
    }
    cstr() {
      let end = this.pos;
      while (this.data[end] !== 0) end++;
      const s = new TextDecoder("utf-8").decode(this.data.subarray(this.pos, end));
      this.pos = end + 1;
      return s;
    }
    raw(n) {
      const b = this.data.subarray(this.pos, this.pos + n);
      this.pos += n;
      return b;
    }
  };
  var Writer = class {
    constructor() {
      this.buf = [];
    }
    u8(v) {
      this.buf.push(v & 255);
    }
    u16(v) {
      this.buf.push(v & 255, v >>> 8 & 255);
    }
    u32(v) {
      this.buf.push(v & 255, v >>> 8 & 255, v >>> 16 & 255, v >>> 24 & 255);
    }
    u64(v) {
      const lo = v % 4294967296, hi = Math.floor(v / 4294967296);
      this.u32(lo);
      this.u32(hi);
    }
    f32(v) {
      this.raw(new Uint8Array(new Float32Array([Math.fround(v)]).buffer));
    }
    f64(v) {
      this.raw(new Uint8Array(new Float64Array([v]).buffer));
    }
    raw(b) {
      for (let i = 0; i < b.length; i++) this.buf.push(b[i]);
    }
    cstr(s) {
      this.raw(Array.from(new TextEncoder().encode(s)));
      this.u8(0);
    }
    bytes() {
      return new Uint8Array(this.buf);
    }
  };
  function parseXfs(data) {
    if (data.length < 24) throw new Error("文件太小，不是 XFS 格式");
    const sig = String.fromCharCode(data[0], data[1], data[2], data[3]);
    if (sig !== "XFS\0") throw new Error(`错误的文件签名 "${sig}"（需要 "XFS\\0"）`);
    const r = new Reader(data);
    r.pos = 4;
    const v1 = r.u16(), v2 = r.u16();
    r.u64();
    const defCount = r.u32();
    const blockLen = r.u32();
    const defsBase = 24;
    const instBase = defsBase + blockLen;
    const dir = [];
    for (let i = 0; i < defCount; i++) {
      r.pos = defsBase + i * 8;
      dir.push(r.u64());
    }
    const defs = [];
    const decoder = new TextDecoder("utf-8");
    for (let i = 0; i < defCount; i++) {
      r.pos = dir[i] + 24;
      const hash = r.u64();
      const memberCount = r.u64();
      const members = [];
      for (let j = 0; j < memberCount; j++) {
        const namePtr = r.u64();
        const type = r.u8(), flags = r.u8(), size = r.u8();
        r.raw(69);
        let name = "";
        if (namePtr) {
          let end = namePtr + defsBase;
          while (data[end] !== 0) end++;
          name = decoder.decode(data.subarray(namePtr + defsBase, end));
        }
        members.push({ name, type, flags, size });
      }
      defs.push({ name: HASH_TO_NAME[hash] ?? `0x${hash.toString(16)}`, hash, members });
    }
    r.pos = instBase;
    const ctx = { r, defs, stack: "" };
    const root = readClassEntry(ctx);
    if (r.pos !== data.length) {
      throw new Error(`实例数据解析后仍有 ${data.length - r.pos} 字节剩余（格式不匹配）`);
    }
    const rootInst = root;
    let rootName = "";
    const own = rootInst.__vals__["mOwnerObjectName"];
    if (typeof own === "string") rootName = own;
    return { v1, v2, defs, root: rootInst, rootName };
  }
  function readClassEntry(ctx) {
    const { r } = ctx;
    const classId = r.u16();
    r.u16();
    if (classId === NULL_ID || classId === 65535) return { __null__: true, __id__: classId };
    const defIdx = classId / 2 | 0;
    const def = ctx.defs[defIdx];
    if (!def) throw new Error(`类索引越界: id=${classId} @0x${(r.pos - 4).toString(16)}`);
    r.u64();
    const saved = ctx.stack;
    ctx.stack = saved + `${def.name}.`;
    const inst = { __class__: defIdx, __vals__: {} };
    for (const mem of def.members) {
      const count = r.u32();
      if (count === 0) {
        inst.__vals__[mem.name] = null;
        continue;
      }
      if (count === 1) {
        inst.__vals__[mem.name] = readValue(ctx, mem);
      } else {
        const arr = [];
        for (let i = 0; i < count; i++) arr.push(readValue(ctx, mem));
        inst.__vals__[mem.name] = arr;
      }
    }
    ctx.stack = saved;
    return inst;
  }
  function readValue(ctx, mem) {
    const { r } = ctx;
    switch (mem.type) {
      case 1 /* Class */:
      case 2 /* ClassRef */:
        return readClassEntry(ctx);
      case 3 /* Bool */:
      case 4 /* U8 */:
        return r.u8();
      case 5 /* U16 */:
        return r.u16();
      case 6 /* U32 */:
        return r.u32();
      case 7 /* U64 */:
        return r.u64();
      case 8 /* S8 */:
        return r.u8() << 24 >> 24;
      case 9 /* S16 */:
        return r.u16() << 16 >> 16;
      case 10 /* S32 */:
        return r.u32() | 0;
      case 11 /* S64 */:
        return r.u64();
      case 12 /* F32 */:
        return r.f32();
      case 13 /* F64 */:
        return r.f64();
      case 14 /* String */:
        return r.cstr();
      case 15 /* RGBA */: {
        const out = [];
        for (let i = 0; i < 4; i++) out.push(r.u8());
        return out;
      }
      case 16 /* Ptr */:
        return r.u64();
      case 20 /* Vec3 */:
      case 21 /* Vec4 */:
      case 22 /* Quat */: {
        const n = mem.type === 20 /* Vec3 */ ? 3 : 4;
        const out = [];
        for (let i = 0; i < n; i++) out.push(r.f32());
        return out;
      }
      default:
        throw new Error(`${ctx.stack}${mem.name}: 未知类型 ${mem.type}`);
    }
  }
  function writeXfs(doc) {
    const defsBlock = buildDefsBlock(doc.defs);
    const ordinal = { n: 0 };
    currentDefs = doc.defs;
    const instWriter = new Writer();
    writeEntry(instWriter, doc.root, ordinal);
    currentDefs = [];
    const instBytes = instWriter.bytes();
    const w2 = new Writer();
    w2.raw(new TextEncoder().encode("XFS\0"));
    w2.u16(doc.v1);
    w2.u16(doc.v2);
    w2.u64(ordinal.n);
    w2.u32(doc.defs.length);
    w2.u32(defsBlock.length);
    w2.raw(defsBlock);
    w2.raw(instBytes);
    return w2.bytes();
  }
  function buildDefsBlock(defs) {
    const w2 = new Writer();
    const n = defs.length;
    let pos = n * 8;
    const hashOff = [];
    for (const def of defs) {
      hashOff.push(pos);
      pos += 16 + 80 * def.members.length;
    }
    const strOff = {};
    const strings = [];
    for (const def of defs) {
      for (const mem of def.members) {
        if (mem.name && !(mem.name in strOff)) {
          strOff[mem.name] = pos + strings.length;
          for (const b of new TextEncoder().encode(mem.name)) strings.push(b);
          strings.push(0);
        }
      }
    }
    const pad = (8 - (pos + strings.length) % 8) % 8;
    for (const off of hashOff) w2.u64(off);
    for (const def of defs) {
      w2.u64(def.hash);
      w2.u64(def.members.length);
      for (const mem of def.members) {
        w2.u64(mem.name ? strOff[mem.name] : 0);
        w2.u8(mem.type);
        w2.u8(mem.flags);
        w2.u8(mem.size);
        for (let k = 0; k < 69; k++) w2.u8(0);
      }
    }
    w2.raw(strings);
    for (let k = 0; k < pad; k++) w2.u8(0);
    return w2.bytes();
  }
  function writeEntry(w2, value, ordinal) {
    const inst = value;
    if (inst && inst.__null__) {
      w2.u16(inst.__id__ ?? NULL_ID);
      w2.u16(0);
      return;
    }
    const varId = ordinal.n++;
    const body = new Writer();
    writeMembers(body, inst, ordinal);
    const bodyBytes = body.bytes();
    w2.u16(inst.__class__ * 2 + 1);
    w2.u16(varId);
    w2.u64(bodyBytes.length + 8);
    w2.raw(bodyBytes);
  }
  function writeMembers(w2, inst, ordinal) {
    const def = currentDefs[inst.__class__];
    if (!def) throw new Error(`写出时找不到类定义 #${inst.__class__}`);
    for (const mem of def.members) {
      const v = inst.__vals__[mem.name];
      if (v === null || v === void 0) {
        w2.u32(0);
        continue;
      }
      if (Array.isArray(v)) {
        w2.u32(v.length);
        for (const e of v) writeValue(w2, mem, e, ordinal);
      } else {
        w2.u32(1);
        writeValue(w2, mem, v, ordinal);
      }
    }
  }
  var currentDefs = [];
  function writeValue(w2, mem, v, ordinal) {
    switch (mem.type) {
      case 1 /* Class */:
      case 2 /* ClassRef */:
        writeEntry(w2, v, ordinal);
        return;
      case 3 /* Bool */:
        w2.u8(v ? 1 : 0);
        return;
      case 4 /* U8 */:
        w2.u8(Number(v));
        return;
      case 5 /* U16 */:
        w2.u16(Number(v));
        return;
      case 6 /* U32 */:
        w2.u32(Number(v) >>> 0);
        return;
      case 7 /* U64 */:
        w2.u64(Number(v));
        return;
      case 8 /* S8 */:
        w2.u8(Number(v) & 255);
        return;
      case 9 /* S16 */:
        w2.u16(Number(v) & 65535);
        return;
      case 10 /* S32 */:
        w2.u32(Number(v) | 0);
        return;
      case 11 /* S64 */:
        w2.u64(Number(v));
        return;
      case 12 /* F32 */:
        w2.f32(Number(v));
        return;
      case 13 /* F64 */:
        w2.f64(Number(v));
        return;
      case 14 /* String */:
        w2.cstr(String(v));
        return;
      case 15 /* RGBA */:
        for (const b of v) w2.u8(b);
        return;
      case 16 /* Ptr */:
        w2.u64(Number(v));
        return;
      case 20 /* Vec3 */:
      case 21 /* Vec4 */:
      case 22 /* Quat */:
        for (const f of v) w2.f32(f);
        return;
      default:
        throw new Error(`${mem.name}: 未知类型 ${mem.type}`);
    }
  }

  // src/fsmxml.ts
  var SCALAR_TAG_TO_TYPE = {
    bool: 3 /* Bool */,
    u8: 4 /* U8 */,
    u16: 5 /* U16 */,
    u32: 6 /* U32 */,
    u64: 7 /* U64 */,
    s8: 8 /* S8 */,
    s16: 9 /* S16 */,
    s32: 10 /* S32 */,
    s64: 11 /* S64 */,
    f32: 12 /* F32 */,
    f64: 13 /* F64 */,
    string: 14 /* String */
  };
  function decodeEntities(s) {
    return s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10))).replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  }
  function encodeAttr(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function parseXml(text) {
    let i = 0;
    const n = text.length;
    const decl = text.startsWith("<?xml");
    if (decl) {
      i = text.indexOf("?>");
      if (i < 0) throw new Error("XML 声明未闭合");
      i += 2;
    }
    const skipWs = () => {
      while (i < n && /\s/.test(text[i])) i++;
    };
    const parseElem = () => {
      skipWs();
      if (text[i] !== "<") throw new Error(`XML 解析错误: 期望 '<' @${i}`);
      i++;
      let tag = "";
      while (i < n && /[^\s/>]/.test(text[i])) tag += text[i++];
      const attrs = {};
      for (; ; ) {
        skipWs();
        if (text[i] === ">") {
          i++;
          break;
        }
        if (text[i] === "/" && text[i + 1] === ">") {
          i += 2;
          return { tag, attrs, children: [] };
        }
        let an = "";
        while (i < n && /[^\s=]/.test(text[i])) an += text[i++];
        skipWs();
        if (text[i] !== "=") throw new Error(`XML 属性缺少 = @${i}`);
        i++;
        skipWs();
        const q = text[i];
        if (q !== '"' && q !== "'") throw new Error(`XML 属性引号错误 @${i}`);
        i++;
        let av = "";
        while (i < n && text[i] !== q) av += text[i++];
        i++;
        attrs[an] = decodeEntities(av);
      }
      const children = [];
      for (; ; ) {
        skipWs();
        if (text.startsWith("</", i)) {
          i = text.indexOf(">", i) + 1;
          return { tag, attrs, children };
        }
        if (text.startsWith("<!--", i)) {
          i = text.indexOf("-->", i) + 3;
          continue;
        }
        children.push(parseElem());
      }
    };
    const root = parseElem();
    return root;
  }
  function defFor(ctx, typeName, membersIfNew) {
    let idx = ctx.byName.get(typeName);
    if (idx !== void 0) return idx;
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
  function inferMember(child) {
    const scalar = SCALAR_TAG_TO_TYPE[child.tag];
    if (scalar !== void 0) return { name: child.attrs["name"] ?? "", type: scalar, flags: 0, size: scalar === 14 /* String */ ? 8 : 4 };
    if (child.tag === "class") return { name: child.attrs["name"] ?? "", type: 1 /* Class */, flags: 0, size: 8 };
    if (child.tag === "classref") return { name: child.attrs["name"] ?? "", type: 2 /* ClassRef */, flags: 0, size: 8 };
    if (child.tag === "array") return { name: child.attrs["name"] ?? "", type: 2 /* ClassRef */, flags: 160, size: 8 };
    throw new Error(`无法识别的 XML 元素 <${child.tag}>`);
  }
  function parseInstance(ctx, elem) {
    const typeName = elem.attrs["type"] ?? "";
    const known = BUILTIN_DEFS.find((d) => d.name === typeName);
    const defIdx = defFor(ctx, typeName, known ? [] : elem.children.map(inferMember));
    const def = ctx.defs[defIdx];
    const inst = { __class__: defIdx, __vals__: {} };
    for (const mem of def.members) inst.__vals__[mem.name] = mem.type === 2 /* ClassRef */ || mem.type === 1 /* Class */ ? null : defaultValue(mem.type);
    const childByName = /* @__PURE__ */ new Map();
    for (const c of elem.children) {
      const nm = c.attrs["name"] ?? "";
      if (!childByName.has(nm)) childByName.set(nm, []);
      childByName.get(nm).push(c);
    }
    if (!known) {
      for (const c of elem.children) {
        const mem = inferMember(c);
        inst.__vals__[mem.name] = parseMemberValue(ctx, mem, c);
      }
    } else {
      for (const [nm, elems] of childByName) {
        const mem = def.members.find((mm) => mm.name === nm);
        if (!mem) continue;
        inst.__vals__[nm] = parseMemberValue(ctx, mem, elems[0]);
      }
    }
    return inst;
  }
  function defaultValue(t) {
    switch (t) {
      case 14 /* String */:
        return "";
      case 3 /* Bool */:
        return 0;
      case 12 /* F32 */:
      case 13 /* F64 */:
        return 0;
      case 15 /* RGBA */:
        return [0, 0, 0, 0];
      case 20 /* Vec3 */:
      case 22 /* Quat */:
        return [0, 0, 0, 0];
      case 21 /* Vec4 */:
        return [0, 0, 0, 0];
      default:
        return 0;
    }
  }
  function parseMemberValue(ctx, mem, elem) {
    if (elem.tag === "array") {
      const out = [];
      for (const c of elem.children) {
        if (c.attrs["type"] === "null") out.push({ __null__: true, __id__: 65534 });
        else out.push(parseInstance(ctx, c));
      }
      return out;
    }
    if (elem.tag === "classref") {
      if (elem.attrs["type"] === "null") return { __null__: true, __id__: 65534 };
      return parseInstance(ctx, elem);
    }
    if (elem.tag === "class") return parseInstance(ctx, elem);
    const scalar = SCALAR_TAG_TO_TYPE[elem.tag];
    if (scalar !== void 0) return parseScalar(scalar, elem.attrs["value"] ?? "");
    throw new Error(`无法解析成员 <${elem.tag} name="${elem.attrs["name"]}">`);
  }
  function parseScalar(t, raw) {
    switch (t) {
      case 3 /* Bool */:
        return raw === "true" || raw === "1" ? 1 : 0;
      case 12 /* F32 */:
        return Math.fround(parseFloat(raw));
      case 13 /* F64 */:
        return parseFloat(raw);
      case 14 /* String */:
        return raw;
      case 8 /* S8 */:
      case 9 /* S16 */:
      case 10 /* S32 */:
        return parseInt(raw, 10) | 0;
      case 4 /* U8 */:
      case 5 /* U16 */:
      case 6 /* U32 */:
      case 7 /* U64 */:
      case 11 /* S64 */:
        return parseInt(raw, 10) >>> 0;
      default:
        return parseInt(raw, 10);
    }
  }
  function parseMtXml(text) {
    const root = parseXml(text);
    if (root.tag !== "class") throw new Error(`根元素不是 <class>（是 <${root.tag}>）`);
    const ctx = { defs: [], byName: /* @__PURE__ */ new Map(), unknownClasses: /* @__PURE__ */ new Set() };
    const inst = parseInstance(ctx, root);
    return {
      v1: 19,
      v2: 3589,
      defs: ctx.defs,
      root: inst,
      rootName: root.attrs["name"] ?? ""
    };
  }
  var XML_ORDER_OVERRIDES = {
    "rAIFSM": { omit: ["mLastEditType"] },
    "cAIFSMNode": { moveLast: ["mName"] },
    "cAIFSMLink": { moveLast: ["mName"] },
    "nAI::EnumProp": { extras: ["mName", "mEnumName"] }
  };
  function writeMtXml(doc) {
    const out = ['<?xml version="1.0" encoding="utf-8"?>'];
    const writeInstance = (inst, elemName, elemTag, depth, typeNameOverride) => {
      const def = doc.defs[inst.__class__];
      const ind = "	".repeat(depth);
      const typeAttr = typeNameOverride ?? def.name;
      const openLine = elemName !== null ? `${ind}<${elemTag} name="${encodeAttr(elemName)}" type="${encodeAttr(typeAttr)}"` : `${ind}<${elemTag} type="${encodeAttr(typeAttr)}"`;
      const over = XML_ORDER_OVERRIDES[def.name] ?? {};
      const members = orderedMembers(def, over);
      if (members.length === 0) {
        out.push(`${openLine}/>`);
        return;
      }
      out.push(`${openLine}>`);
      for (const key of members) {
        writeMember(inst, key, depth + 1);
      }
      for (const extra of over.extras ?? []) {
        out.push(`${"	".repeat(depth + 1)}<string name="${extra}" value=""/>`);
      }
      out.push(`${ind}</${elemTag}>`);
    };
    const writeMember = (inst, name, depth) => {
      const def = doc.defs[inst.__class__];
      const mem = def.members.find((mm) => mm.name === name);
      if (!mem) return;
      const v = inst.__vals__[name];
      const ind = "	".repeat(depth);
      if (mem.type === 2 /* ClassRef */ && Array.isArray(v)) {
        out.push(`${ind}<array name="${encodeAttr(name)}" type="classref" count="${v.length}">`);
        for (const e of v) {
          if (isNullRef(e)) {
            out.push(`${ind}	<classref type="null"/>`);
          } else {
            writeInstance(e, null, "classref", depth + 1);
          }
        }
        out.push(`${ind}</array>`);
        return;
      }
      if (v === null || v === void 0) {
        if (mem.type === 2 /* ClassRef */ || mem.type === 1 /* Class */) {
          out.push(`${ind}<classref name="${encodeAttr(name)}" type="null"/>`);
        } else {
          writeScalar(mem, defaultValue(mem.type), ind);
        }
        return;
      }
      if (mem.type === 2 /* ClassRef */) {
        if (isNullRef(v)) {
          out.push(`${ind}<classref name="${encodeAttr(name)}" type="null"/>`);
        } else {
          writeInstance(v, name, "classref", depth);
        }
        return;
      }
      if (mem.type === 1 /* Class */) {
        writeInstance(v, name, "class", depth);
        return;
      }
      writeScalar(mem, v, ind);
    };
    const writeScalar = (mem, v, ind) => {
      const tag = SCALAR_TYPE_TO_TAG[mem.type];
      if (!tag) return;
      let val;
      if (mem.type === 3 /* Bool */) val = v ? "true" : "false";
      else if (mem.type === 14 /* String */) val = encodeAttr(String(v));
      else val = String(v);
      out.push(`${ind}<${tag} name="${encodeAttr(mem.name)}" value="${val}"/>`);
    };
    writeInstance(doc.root, doc.rootName, "class", 0);
    out.push("");
    return out.join("\n");
  }
  function orderedMembers(def, over) {
    let names = def.members.map((mm) => mm.name);
    if (over.omit) names = names.filter((nm) => !over.omit.includes(nm));
    if (over.moveLast) {
      for (const last of over.moveLast) {
        names = names.filter((nm) => nm !== last);
        names.push(last);
      }
    }
    return names;
  }
  var SCALAR_TYPE_TO_TAG = {
    [3 /* Bool */]: "bool",
    [4 /* U8 */]: "u8",
    [5 /* U16 */]: "u16",
    [6 /* U32 */]: "u32",
    [7 /* U64 */]: "u64",
    [8 /* S8 */]: "s8",
    [9 /* S16 */]: "s16",
    [10 /* S32 */]: "s32",
    [11 /* S64 */]: "s64",
    [12 /* F32 */]: "f32",
    [13 /* F64 */]: "f64",
    [14 /* String */]: "string"
  };

  // src/model.ts
  var COND_OP_SYMBOLS = {
    1: "IsTrue",
    2: "IsFalse",
    3: "==",
    4: "!=",
    5: "<",
    6: "<=",
    7: ">",
    8: ">=",
    9: "&",
    10: "|"
  };
  var FsmModel = class _FsmModel {
    constructor(doc) {
      this.format = "binary";
      this.fileName = "";
      this.dirty = false;
      this.warnings = [];
      this.onChange = null;
      this.undoStack = [];
      this.redoStack = [];
      this.doc = doc;
    }
    static fromBinary(bytes, fileName) {
      const m2 = new _FsmModel(parseXfs(bytes));
      m2.format = "binary";
      m2.fileName = fileName;
      return m2;
    }
    static fromXml(text, fileName) {
      const m2 = new _FsmModel(parseMtXml(text));
      m2.format = "xml";
      m2.fileName = fileName;
      return m2;
    }
    toBinary() {
      return writeXfs(this.doc);
    }
    toXml() {
      return writeMtXml(this.doc);
    }
    // ----- undo / redo -------------------------------------------------------
    /** push the current state onto the undo stack. Fires no change event: this
     *  runs BEFORE a mutation, and every caller re-renders after mutating —
     *  rendering the pre-mutation state here would rebuild UI mid-edit (and
     *  steal input focus). onChange is for state restorations (undo/redo). */
    snapshot() {
      this.undoStack.push(JSON.stringify(this.doc.root));
      if (this.undoStack.length > 200) this.undoStack.shift();
      this.redoStack = [];
      this.dirty = true;
    }
    canUndo() {
      return this.undoStack.length > 0;
    }
    canRedo() {
      return this.redoStack.length > 0;
    }
    undo() {
      const snap = this.undoStack.pop();
      if (!snap) return;
      this.redoStack.push(JSON.stringify(this.doc.root));
      this.doc.root = JSON.parse(snap);
      this.onChange?.();
    }
    redo() {
      const snap = this.redoStack.pop();
      if (!snap) return;
      this.undoStack.push(JSON.stringify(this.doc.root));
      this.doc.root = JSON.parse(snap);
      this.onChange?.();
    }
    // ----- structure accessors ------------------------------------------------
    defName(idx) {
      return this.doc.defs[idx]?.name ?? `#${idx}`;
    }
    rootCluster() {
      const v = this.doc.root.__vals__["mpRootCluster"];
      if (!isInstance(v)) throw new Error("FSM 缺少根 cluster");
      return v;
    }
    conditionTree() {
      const v = this.doc.root.__vals__["mpConditionTree"];
      return isInstance(v) ? v : null;
    }
    nodes() {
      return this.memberList(this.rootCluster(), "mpNodeList");
    }
    nodeById(id) {
      return this.nodes().find((nd) => nd.__vals__["mId"] === id);
    }
    linksOf(node) {
      return this.memberList(node, "mpLinkList");
    }
    processesOf(node) {
      return this.memberList(node, "mpProcessList");
    }
    conditions() {
      const ct = this.conditionTree();
      if (!ct) return [];
      return this.memberList(ct, "mpTreeList");
    }
    initialStateId() {
      return Number(this.rootCluster().__vals__["mInitialStateId"] ?? 0);
    }
    // ----- field helpers ------------------------------------------------------
    getNum(inst, name) {
      return Number(inst.__vals__[name] ?? 0);
    }
    setField(inst, name, value) {
      inst.__vals__[name] = value;
      this.dirty = true;
    }
    str(inst, name) {
      const v = inst.__vals__[name];
      return typeof v === "string" ? v : "";
    }
    list(inst, name) {
      const v = inst.__vals__[name];
      return Array.isArray(v) ? v : null;
    }
    /** class-list member as an array, whether the file boxed it or not */
    memberList(inst, name) {
      return onlyInstances(inst.__vals__[name]);
    }
    setList(inst, name, arr) {
      inst.__vals__[name] = arr;
      this.dirty = true;
    }
    // ----- node level editing --------------------------------------------------
    nextNodeId() {
      return Math.max(-1, ...this.nodes().map((nd) => this.getNum(nd, "mId"))) + 1;
    }
    nextUniqueId() {
      return Math.max(0, ...this.nodes().map((nd) => this.getNum(nd, "mUniqueId"))) + 1;
    }
    actionSetDefIndex() {
      const idx = this.doc.defs.findIndex((d) => /ActionSet/.test(d.name));
      if (idx >= 0) return idx;
      return this.doc.defs.findIndex((d) => d.members.length === 1 && d.members[0].name === "ActionNo");
    }
    enumDefIndex() {
      return this.doc.defs.findIndex((d) => d.members.some((mm) => mm.name === "EnumValue"));
    }
    makeInstance(defIdx) {
      const vals = {};
      for (const mem of this.doc.defs[defIdx].members) {
        vals[mem.name] = mem.type === 1 /* Class */ || mem.type === 2 /* ClassRef */ ? null : defaultValueFor(mem.type);
      }
      return { __class__: defIdx, __vals__: vals };
    }
    newNode(name, kind = "plain") {
      const node = this.makeInstance(this.defIndexByName("cAIFSMNode"));
      node.__vals__["mName"] = name;
      node.__vals__["mId"] = this.nextNodeId();
      node.__vals__["mUniqueId"] = this.nextUniqueId();
      node.__vals__["mpSubCluster"] = { __null__: true, __id__: 65534 };
      node.__vals__["mpLinkList"] = [];
      node.__vals__["mpProcessList"] = [];
      node.__vals__["mUIPos"] = 0;
      node.__vals__["mColorType"] = kind === "action" ? 1 : kind === "motion" ? 5 : 0;
      node.__vals__["mSetting"] = 1;
      if (kind === "action") this.setNodeActionNo(node, 0);
      if (kind === "motion") this.setNodeMotionNo(node, 0, -1);
      const cluster = this.rootCluster();
      const list = this.list(cluster, "mpNodeList");
      if (list) list.push(node);
      else this.setList(cluster, "mpNodeList", [node]);
      return node;
    }
    deleteNode(nodeId) {
      const cluster = this.rootCluster();
      const list = this.list(cluster, "mpNodeList");
      if (!list) return;
      const idx = list.findIndex((nd) => isInstance(nd) && nd.__vals__["mId"] === nodeId);
      if (idx < 0) return;
      list.splice(idx, 1);
      for (const nd of this.nodes()) {
        const kept = this.linksOf(nd).filter((lk) => lk.__vals__["mDestinationNodeId"] !== nodeId);
        this.setList(nd, "mpLinkList", kept);
      }
      if (this.initialStateId() === nodeId) this.setField(this.rootCluster(), "mInitialStateId", this.nodes()[0] ? this.getNum(this.nodes()[0], "mId") : 0);
    }
    addLink(node, destId, conditionId) {
      const link = this.makeInstance(this.defIndexByName("cAIFSMLink"));
      link.__vals__["mName"] = "";
      link.__vals__["mDestinationNodeId"] = destId;
      if (conditionId === null) {
        link.__vals__["mExistCondition"] = 0;
        link.__vals__["mConditionId"] = 0;
      } else {
        link.__vals__["mExistCondition"] = 1;
        link.__vals__["mConditionId"] = conditionId;
      }
      const list = this.list(node, "mpLinkList");
      if (list) list.push(link);
      else this.setList(node, "mpLinkList", [link]);
      return link;
    }
    deleteLink(node, linkIndex) {
      this.list(node, "mpLinkList")?.splice(linkIndex, 1);
    }
    /** swap a link with its neighbour — link order is the game's evaluation
     *  priority, so the first matching condition wins (e.g. `R+Circle` must sit
     *  above plain `R`, or the shorter one always eats the input) */
    moveLink(node, from, to) {
      const list = this.list(node, "mpLinkList");
      if (!list || from === to) return;
      if (from < 0 || to < 0 || from >= list.length || to >= list.length) return;
      const [lk] = list.splice(from, 1);
      list.splice(to, 0, lk);
      this.dirty = true;
    }
    deleteCondition(condIndex) {
      const ct = this.conditionTree();
      if (!ct) return;
      const list = this.list(ct, "mpTreeList");
      if (!list) return;
      list.splice(condIndex, 1);
      for (const nd of this.nodes()) {
        for (const lk of this.linksOf(nd)) {
          const cid = this.getNum(lk, "mConditionId");
          if (this.getNum(lk, "mExistCondition") === 1) {
            if (cid === condIndex) this.setField(lk, "mExistCondition", 0);
            else if (cid > condIndex) this.setField(lk, "mConditionId", cid - 1);
          } else if (cid > condIndex) {
            this.setField(lk, "mConditionId", cid - 1);
          }
        }
        const allId = this.getNum(nd, "mConditionTrainsitionFromAllId");
        if (this.getNum(nd, "mExistConditionTrainsitionFromAll") === 1) {
          if (allId === condIndex) this.setField(nd, "mExistConditionTrainsitionFromAll", 0);
          else if (allId > condIndex) this.setField(nd, "mConditionTrainsitionFromAllId", allId - 1);
        } else if (allId > condIndex) {
          this.setField(nd, "mConditionTrainsitionFromAllId", allId - 1);
        }
      }
    }
    addCondition() {
      let ct = this.conditionTree();
      if (!ct) {
        const ctIdx = this.doc.defs.findIndex((d) => d.name === "rAIConditionTree");
        ct = this.makeInstance(ctIdx);
        ct.__vals__["mpTreeList"] = [];
        this.doc.root.__vals__["mpConditionTree"] = ct;
      }
      void ct;
      const treeIdx = this.defIndexByName("rAIConditionTree::TreeInfo");
      const enumIdx = this.defIndexByName("cAIDEnum");
      const tree = this.makeInstance(treeIdx);
      const nameEnum = this.makeInstance(enumIdx);
      nameEnum.__vals__["mId"] = this.conditions().length;
      tree.__vals__["mName"] = nameEnum;
      tree.__vals__["mpRootNode"] = this.makeOperationNode(0);
      const list = this.list(ct, "mpTreeList");
      if (list) list.push(tree);
      else this.setList(ct, "mpTreeList", [tree]);
      return { tree, index: this.list(ct, "mpTreeList").length - 1 };
    }
    // ----- condition tree factories ---------------------------------------------
    makeOperationNode(operator) {
      const inst = this.makeInstance(this.defIndexByName("rAIConditionTree::OperationNode"));
      inst.__vals__["mpChildList"] = [];
      inst.__vals__["mOperator"] = operator;
      return inst;
    }
    makeVariableNode(propertyName, ownerName) {
      const inst = this.makeInstance(this.defIndexByName("rAIConditionTree::VariableNode"));
      const vi = this.makeInstance(this.defIndexByName("rAIConditionTree::VariableNode::VariableInfo"));
      vi.__vals__["mPropertyName"] = propertyName;
      vi.__vals__["mOwnerName"] = ownerName;
      vi.__vals__["mIsSingletonOwner"] = 0;
      inst.__vals__["mpChildList"] = [];
      inst.__vals__["mVariable"] = vi;
      inst.__vals__["mIsBitNo"] = 0;
      inst.__vals__["mIsArray"] = 0;
      inst.__vals__["mIsDynamicIndex"] = 0;
      inst.__vals__["mIndex"] = 0;
      inst.__vals__["mIndexVariable"] = this.makeInstance(this.defIndexByName("rAIConditionTree::VariableNode::VariableInfo"));
      inst.__vals__["mIndexVariable"].__vals__["mPropertyName"] = "";
      inst.__vals__["mIndexVariable"].__vals__["mOwnerName"] = "";
      inst.__vals__["mIndexVariable"].__vals__["mIsSingletonOwner"] = 0;
      inst.__vals__["mUseEnumIndex"] = 0;
      inst.__vals__["mIndexEnum"] = this.makeInstance(this.defIndexByName("nAI::EnumProp"));
      return inst;
    }
    makeConstS32(value) {
      throw new Error("此 FSM 未包含常量节点类定义");
    }
    // ----- processes --------------------------------------------------------------
    nodeActionNo(node) {
      for (const proc of this.processesOf(node)) {
        const param = proc.__vals__["mpParameter"];
        if (isInstance(param)) {
          const actionNo = param.__vals__["ActionNo"];
          if (isInstance(actionNo)) return Number(actionNo.__vals__["EnumValue"] ?? 0);
        }
      }
      return null;
    }
    nodeMotionNo(node) {
      for (const proc of this.processesOf(node)) {
        const param = proc.__vals__["mpParameter"];
        if (isInstance(param) && "MotionNo" in param.__vals__) {
          return { motion: Number(param.__vals__["MotionNo"] ?? 0), phase: Number(param.__vals__["MotionNo_Phase1"] ?? 0) };
        }
      }
      return null;
    }
    containerSuffix() {
      for (const nd of this.nodes()) {
        const proc = this.processesOf(nd)[0];
        if (proc) {
          const cn = this.str(proc, "mContainerName");
          const mMatch2 = cn.match(/_(W\d+)$/);
          if (mMatch2) return `_${mMatch2[1]}`;
          return "";
        }
      }
      const mMatch = this.doc.rootName.match(/_(W\d+)$/);
      return mMatch ? `_${mMatch[1]}` : "";
    }
    /** Action_W03 / LinkMotion_W03 style container names, matching XFsm */
    containerName(kind) {
      const base = kind === "action" ? "Action" : "LinkMotion";
      const suffix = this.containerSuffix();
      return suffix ? `${base}${suffix}` : base;
    }
    linkMotionDefIndex() {
      const idx = this.doc.defs.findIndex((d) => /LinkMotion/.test(d.name));
      if (idx >= 0) return idx;
      return this.doc.defs.findIndex((d) => d.members.some((mm) => mm.name === "MotionNo"));
    }
    setNodeActionNo(node, actionNo) {
      const procs = this.processesOf(node);
      for (const proc2 of procs) {
        const param2 = proc2.__vals__["mpParameter"];
        if (isInstance(param2) && isInstance(param2.__vals__["ActionNo"])) {
          param2.__vals__["ActionNo"].__vals__["EnumValue"] = actionNo;
          return;
        }
      }
      const procDefIdx = this.defIndexByName("cAIFSMNodeProcess");
      const proc = this.makeInstance(procDefIdx);
      proc.__vals__["mContainerName"] = this.containerName("action");
      proc.__vals__["mCategoryName"] = "cAIFSMProcessContainer";
      const setIdx = this.actionSetDefIndex();
      if (setIdx < 0) throw new Error("此 FSM 没有 ActionSet 参数类定义，无法设置 ActionNo");
      const param = this.makeInstance(setIdx);
      const enumIdx = this.enumDefIndex();
      if (enumIdx < 0) throw new Error("此 FSM 没有 MtEnum 类定义，无法设置 ActionNo");
      const en = this.makeInstance(enumIdx);
      en.__vals__["EnumValue"] = actionNo;
      param.__vals__["ActionNo"] = en;
      proc.__vals__["mpParameter"] = param;
      node.__vals__["mpProcessList"] = [proc];
    }
    setNodeMotionNo(node, motionNo, phase) {
      const procs = this.processesOf(node);
      for (const proc2 of procs) {
        const param2 = proc2.__vals__["mpParameter"];
        if (isInstance(param2) && "MotionNo" in param2.__vals__) {
          param2.__vals__["MotionNo"] = motionNo;
          param2.__vals__["MotionNo_Phase1"] = phase;
          return;
        }
      }
      const procDefIdx = this.defIndexByName("cAIFSMNodeProcess");
      const proc = this.makeInstance(procDefIdx);
      proc.__vals__["mContainerName"] = this.containerName("motion");
      proc.__vals__["mCategoryName"] = "cAIFSMProcessContainer";
      const motionIdx = this.linkMotionDefIndex();
      if (motionIdx < 0) throw new Error("此 FSM 没有 LinkMotion 参数类定义，无法设置 MotionNo");
      const param = this.makeInstance(motionIdx);
      param.__vals__["MotionNo"] = motionNo;
      param.__vals__["MotionNo_Phase1"] = phase;
      proc.__vals__["mpParameter"] = param;
      const list = this.list(node, "mpProcessList");
      if (list) list.push(proc);
      else this.setList(node, "mpProcessList", [proc]);
    }
    hasProcessContainer(node, prefix) {
      return this.processesOf(node).some((p) => this.str(p, "mContainerName").startsWith(prefix));
    }
    // ----- condition summary / references ----------------------------------------
    conditionSummary(tree) {
      const nameObj = tree.__vals__["mName"];
      let idStr = "?";
      if (isInstance(nameObj)) idStr = String(nameObj.__vals__["mId"] ?? "?");
      const root = tree.__vals__["mpRootNode"];
      const expr = isInstance(root) ? this.conditionExpr(root, 0, false) : "";
      return `#${idStr}: ${expr || "(空条件)"}`;
    }
    /** one-line rendering of a condition-tree node. Reads child lists through
     *  memberList(): the file stores a single child unboxed, and a raw
     *  Array.isArray check would call every single-variable condition empty. */
    conditionExpr(node, depth, markUnfilled) {
      if (depth > 8) return "";
      const defName = this.defName(node.__class__);
      const kids = () => this.memberList(node, "mpChildList").map((k) => this.conditionExpr(k, depth + 1, markUnfilled)).filter((s) => s !== "");
      if (defName.endsWith("OperationNode")) {
        const parts = kids();
        const op = this.getNum(node, "mOperator");
        if (op === 16) return parts.join(" & ");
        if (op === 17) return parts.join(" | ");
        const label = COND_OP_SYMBOLS[op];
        if (label && parts.length === 2) return `${parts[0]} ${label} ${parts[1]}`;
        if (label && parts.length === 1) return `${label} ${parts[0]}`;
        return parts.join(" & ");
      }
      if (defName.endsWith("VariableNode")) {
        const parts = [];
        const vi = node.__vals__["mVariable"];
        if (isInstance(vi)) {
          const p = this.str(vi, "mPropertyName");
          if (p) parts.push(p);
          else if (markUnfilled) parts.push("(未填属性)");
        }
        return [...parts, ...kids()].join(" & ");
      }
      return "";
    }
    /** summary for an arbitrary condition-tree node (nested groups etc.) */
    conditionSummaryOf(node) {
      return this.conditionExpr(node, 0, true) || "(空)";
    }
    conditionUsage(condIndex) {
      let count = 0;
      for (const nd of this.nodes()) {
        for (const lk of this.linksOf(nd)) {
          if (this.getNum(lk, "mConditionId") === condIndex) count++;
        }
        if (this.getNum(nd, "mConditionTrainsitionFromAllId") === condIndex) count++;
      }
      return count;
    }
    collectPropertyNames() {
      const names = /* @__PURE__ */ new Set();
      const visit = (v, depth) => {
        if (depth > 24 || !isInstance(v)) return;
        const dn = this.defName(v.__class__);
        if (dn.endsWith("VariableInfo")) {
          const p = this.str(v, "mPropertyName");
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
    validate() {
      const problems = [];
      const ids = /* @__PURE__ */ new Set();
      for (const nd of this.nodes()) ids.add(this.getNum(nd, "mId"));
      for (const nd of this.nodes()) {
        const nid = this.getNum(nd, "mId");
        for (const lk of this.linksOf(nd)) {
          const dst = this.getNum(lk, "mDestinationNodeId");
          if (!ids.has(dst)) problems.push(`节点 ${nid} 有链接指向不存在的节点 ${dst}`);
          const cid = this.getNum(lk, "mConditionId");
          const hasCond = this.getNum(lk, "mExistCondition") === 1;
          if (hasCond && cid >= this.conditions().length) {
            problems.push(`节点 ${nid} 链接引用了越界条件 #${cid}`);
          }
        }
        const allId = this.getNum(nd, "mConditionTrainsitionFromAllId");
        if (this.getNum(nd, "mExistConditionTrainsitionFromAll") === 1 && allId >= this.conditions().length) {
          problems.push(`节点 ${nid} 的全局转换引用了越界条件 #${allId}`);
        }
      }
      const dup = this.nodes().length !== ids.size;
      if (dup) problems.push("存在重复的节点 mId");
      return problems;
    }
    defIndexByName(name) {
      const idx = this.doc.defs.findIndex((d) => d.name === name);
      if (idx < 0) throw new Error(`此 FSM 缺少类定义 ${name}`);
      return idx;
    }
  };
  function onlyInstances(arr) {
    if (arr === null || arr === void 0) return [];
    const list = Array.isArray(arr) ? arr : [arr];
    return list.filter((x) => isInstance(x));
  }
  function defaultValueFor(t) {
    switch (t) {
      case 14 /* String */:
        return "";
      case 12 /* F32 */:
      case 13 /* F64 */:
        return 0;
      case 15 /* RGBA */:
        return [0, 0, 0, 0];
      case 20 /* Vec3 */:
      case 21 /* Vec4 */:
      case 22 /* Quat */:
        return [0, 0, 0, 0];
      default:
        return 0;
    }
  }

  // src/card.ts
  var HEADER_H = 24;
  var ROW_H = 16;
  var ROW_TOP = 2;
  function textW(s) {
    let w2 = 0;
    for (const ch of s) w2 += ch.charCodeAt(0) > 11904 ? 11 : 6.5;
    return w2;
  }
  function clip(s, maxW) {
    let w2 = 0;
    const chars = Array.from(s);
    for (let i = 0; i < chars.length; i++) {
      w2 += chars[i].charCodeAt(0) > 11904 ? 11 : 6.5;
      if (w2 > maxW) return chars.slice(0, i).join("") + "…";
    }
    return s;
  }
  var COLOR_PALETTE = ["#8a8f98", "#4f8ef7", "#e05555", "#e8c33a", "#54c46a", "#a86ee0", "#38c7d8", "#e08a3a"];
  function condTagOf(model2, lk) {
    const condId = model2.getNum(lk, "mConditionId");
    const hasCond = model2.getNum(lk, "mExistCondition") === 1;
    if (!hasCond) return "";
    const tree = model2.conditions()[condId];
    if (!tree) return `c${condId}`;
    const sum = model2.conditionSummary(tree).replace(/^#\d+:\s*/, "");
    return sum === "(空条件)" ? `c${condId}` : `c${condId} ${sum}`;
  }
  function condLines(tag) {
    const head = tag.match(/^c\d+\s*/)?.[0] ?? "";
    const rest = tag.slice(head.length);
    const id = head.trim();
    if (!rest) return id ? [id] : [];
    const parts = rest.split(/ ([&|]) /);
    const lines = [id ? `${id} ${parts[0]}` : parts[0]];
    for (let i = 1; i + 1 < parts.length; i += 2) lines.push(`${parts[i]} ${parts[i + 1]}`);
    return lines;
  }
  function lineOffsets(spans) {
    const out = [];
    let acc = 0;
    for (const s of spans) {
      out.push(acc);
      acc += Math.max(1, s);
    }
    return out;
  }
  function rowNeed(text, lines) {
    let need = textW(text) + textW(lines[0] ?? "") + 30;
    for (let i = 1; i < lines.length; i++) need = Math.max(need, textW(lines[i]) + 24);
    return need;
  }
  function measureCard(model2, nd, id, initId) {
    const name = model2.str(nd, "mName") || `(id ${id})`;
    const act = model2.nodeActionNo(nd);
    const motion = model2.nodeMotionNo(nd);
    const links = model2.linksOf(nd);
    const isInit = id === initId;
    const outRows = links.map((lk, i) => {
      const dst = model2.getNum(lk, "mDestinationNodeId");
      const cond = condTagOf(model2, lk);
      return { idx: i, text: model2.str(lk, "mName") || `→ ${dst}`, cond, condLines: condLines(cond), dst };
    });
    const inRows = [];
    for (const srcNode of model2.nodes()) {
      const srcId = model2.getNum(srcNode, "mId");
      model2.linksOf(srcNode).forEach((lk, lidx) => {
        if (model2.getNum(lk, "mDestinationNodeId") !== id) return;
        const cond = condTagOf(model2, lk);
        inRows.push({ src: srcId, lidx, text: model2.str(srcNode, "mName") || `← ${srcId}`, cond, condLines: condLines(cond) });
      });
    }
    const infoLines = [];
    if (isInit) infoLines.push("▶初始");
    if (act !== null) infoLines.push(`act ${act}`);
    if (motion) infoLines.push(`mot ${motion.motion}${motion.phase ? `/p${motion.phase}` : ""}`);
    infoLines.push(`#${id}`);
    const OUT_MIN = 96;
    const OUT_MAX = 330;
    const IN_MIN = 60;
    const IN_MAX = 240;
    const CARD_MAX = 640;
    const INFO_W = Math.max(56, ...infoLines.map((l) => textW(l) + 14));
    const outW = outRows.length || links.length ? Math.max(OUT_MIN, Math.min(OUT_MAX, Math.max(...outRows.map((r) => rowNeed(r.text, r.condLines))))) : 0;
    const inW = inRows.length ? Math.max(IN_MIN, Math.min(IN_MAX, Math.max(...inRows.map((r) => rowNeed(r.text, r.condLines))))) : 0;
    const nameW = textW(name) + 22;
    const W = Math.min(CARD_MAX, Math.max(216, nameW, inW + INFO_W + outW + 38));
    const outLines = outRows.reduce((a, r) => a + Math.max(1, r.condLines.length), 0);
    const inLines = inRows.reduce((a, r) => a + Math.max(1, r.condLines.length), 0);
    const H = HEADER_H + Math.max(outLines, inLines, 3) * ROW_H + 12;
    return {
      w: W,
      h: H,
      colorIdx: model2.getNum(nd, "mColorType") % COLOR_PALETTE.length,
      name,
      isInit,
      infoLines,
      rows: outRows,
      inRows,
      inColW: inW,
      outColW: outW
    };
  }

  // src/graph.ts
  var COLOR_NAMES = ["灰", "蓝", "红", "黄", "绿", "紫", "青", "橙"];
  var GraphView = class {
    constructor(svg, cb) {
      this.model = null;
      this.edgesOnTop = true;
      this.view = { x: 60, y: 60, z: 1 };
      this.positions = /* @__PURE__ */ new Map();
      this.highlightIds = /* @__PURE__ */ new Set();
      this.selectedNodeId = null;
      this.selectedLink = null;
      /** multi-selection (band select / ctrl-click); includes selectedNodeId */
      this.selectedIds = /* @__PURE__ */ new Set();
      this.drag = null;
      this.lastMouse = { x: 0, y: 0 };
      this.bandRect = null;
      /** last rendered card sizes, for band hit-testing without re-measuring */
      this.cardMetrics = /* @__PURE__ */ new Map();
      /** the reorder-handle row the pointer is over (revealed above the edges) */
      this.hoverReveal = null;
      this.svg = svg;
      this.cb = cb;
      const ns = "http://www.w3.org/2000/svg";
      const defs = document.createElementNS(ns, "defs");
      defs.innerHTML = `<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#9aa4b2"/></marker><marker id="arrowSel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ff5252"/></marker><marker id="arrowIn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ff5252"/></marker><marker id="arrowOut" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#54c46a"/></marker>`;
      svg.appendChild(defs);
      this.world = document.createElementNS(ns, "g");
      this.edgeLayer = document.createElementNS(ns, "g");
      this.nodeLayer = document.createElementNS(ns, "g");
      this.world.appendChild(this.nodeLayer);
      this.world.appendChild(this.edgeLayer);
      svg.appendChild(this.world);
      this.bandRect = document.createElementNS(ns, "rect");
      this.bandRect.setAttribute("class", "bandRect");
      this.bandRect.setAttribute("visibility", "hidden");
      this.world.appendChild(this.bandRect);
      svg.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });
      svg.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const target = e.target;
        const edge = target.closest("[data-edge]");
        const nodeG = target.closest("[data-node-id]");
        const screen = { x: e.clientX, y: e.clientY };
        const world = this.screenToWorld(e.clientX, e.clientY);
        if (edge) {
          const [nid, li] = (edge.dataset["edge"] ?? "").split(",").map(Number);
          this.selectLink(nid, li);
          this.cb.onSelectLink(nid, li);
          this.cb.onContextMenu({ kind: "link", nodeId: nid, linkIndex: li, screen, world });
        } else if (nodeG) {
          const nid = Number(nodeG.dataset["nodeId"]);
          if (this.selectedIds.has(nid) && this.selectedIds.size > 1) {
            this.cb.onContextMenu({ kind: "node", nodeId: nid, multiIds: [...this.selectedIds], screen, world });
          } else {
            this.selectNode(nid);
            this.cb.onSelectNode(nid);
            this.cb.onContextMenu({ kind: "node", nodeId: nid, screen, world });
          }
        } else {
          this.cb.onContextMenu({ kind: "canvas", screen, world });
        }
      });
      svg.addEventListener("auxclick", (e) => {
        if (e.button === 1) e.preventDefault();
      });
      svg.addEventListener("pointerdown", (e) => this.onPointerDown(e));
      window.addEventListener("pointermove", (e) => this.onPointerMove(e));
      window.addEventListener("pointerup", () => this.onPointerUp());
      svg.addEventListener("dblclick", (e) => {
        if (e.target === this.svg) this.cb.onCreateNodeAt(this.screenToWorld(e.clientX, e.clientY));
      });
    }
    /** draw edges above (true) or below (false) the node cards */
    setEdgesOnTop(v) {
      this.edgesOnTop = v;
      const world = this.world;
      if (v) {
        this.world.appendChild(this.nodeLayer);
        this.world.appendChild(this.edgeLayer);
      } else {
        this.world.appendChild(this.edgeLayer);
        this.world.appendChild(this.nodeLayer);
      }
      if (this.bandRect) this.world.appendChild(this.bandRect);
      document.dispatchEvent(new CustomEvent("fsmstudio:edgez", { detail: v }));
    }
    setModel(model2) {
      this.model = model2;
      this.positions.clear();
      this.selectedNodeId = null;
      this.selectedLink = null;
      this.selectedIds.clear();
      this.restorePositions();
    }
    // ----- coordinates -----
    screenToWorld(sx, sy) {
      const rect = this.svg.getBoundingClientRect();
      return {
        x: (sx - rect.left - this.view.x) / this.view.z,
        y: (sy - rect.top - this.view.y) / this.view.z
      };
    }
    applyView() {
      this.world.setAttribute("transform", `translate(${this.view.x},${this.view.y}) scale(${this.view.z})`);
      document.dispatchEvent(new CustomEvent("fsmstudio:zoom", { detail: Math.round(this.view.z * 100) }));
    }
    fit() {
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
    centerOn(p) {
      const rect = this.svg.getBoundingClientRect();
      this.view.x = rect.width / 2 - p.x * this.view.z;
      this.view.y = rect.height / 2 - p.y * this.view.z;
      this.applyView();
    }
    setZoom(z) {
      const rect = this.svg.getBoundingClientRect();
      const cx = rect.width / 2, cy = rect.height / 2;
      const wx = (cx - this.view.x) / this.view.z, wy = (cy - this.view.y) / this.view.z;
      this.view.z = Math.min(3, Math.max(0.08, z));
      this.view.x = cx - wx * this.view.z;
      this.view.y = cy - wy * this.view.z;
      this.applyView();
    }
    onWheel(e) {
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
    onPointerDown(e) {
      this.lastMouse = { x: e.clientX, y: e.clientY };
      if (e.button === 1) {
        e.preventDefault();
        this.drag = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: this.view.x, oy: this.view.y };
        return;
      }
      if (e.button !== 0) return;
      const target = e.target;
      const p = this.screenToWorld(e.clientX, e.clientY);
      if (this.hoverReveal) {
        const h = this.hitReorderHandle(p);
        if (h && h.nodeId === this.hoverReveal.nodeId && h.linkIndex === this.hoverReveal.linkIndex) {
          this.hoverReveal = null;
          this.svg.querySelectorAll("g[data-reorder].show").forEach((el) => el.classList.remove("show"));
          this.cb.onReorderLink(h.nodeId, h.linkIndex, h.dir);
          return;
        }
      }
      this.hoverReveal = null;
      this.svg.querySelectorAll("g[data-reorder].show").forEach((el) => el.classList.remove("show"));
      const reorder = target.closest("[data-reorder]");
      if (reorder) {
        const [nid, li] = (reorder.dataset["reorder"] ?? "").split(",").map(Number);
        const dir = Number(reorder.dataset["dir"]);
        this.cb.onReorderLink(nid, li, dir);
        return;
      }
      const edge = target.closest("[data-edge]");
      const nodeG = target.closest("[data-node-id]");
      if (edge) {
        const [nid, li] = (edge.dataset["edge"] ?? "").split(",").map(Number);
        const pos = this.positions.get(nid) ?? { x: 0, y: 0 };
        if (this.selectedIds.has(nid) && this.selectedIds.size > 1) {
          this.drag = { kind: "node", nodeId: nid, dx: p.x - pos.x, dy: p.y - pos.y, orig: { ...pos }, moved: false, group: this.groupStart() };
          return;
        }
        this.selectedIds.clear();
        this.selectLink(nid, li);
        this.drag = {
          kind: "node",
          nodeId: nid,
          dx: p.x - pos.x,
          dy: p.y - pos.y,
          orig: { ...pos },
          moved: false,
          pendingLink: { nodeId: nid, linkIndex: li }
        };
        return;
      }
      if (nodeG) {
        const nid = Number(nodeG.dataset["nodeId"]);
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
          this.drag = { kind: "node", nodeId: nid, dx: p.x - pos.x, dy: p.y - pos.y, orig: { ...pos }, moved: false, group: this.groupStart() };
          return;
        }
        this.drag = { kind: "node", nodeId: nid, dx: p.x - pos.x, dy: p.y - pos.y, orig: { ...pos }, moved: false };
        this.selectNode(nid);
        this.cb.onSelectNode(nid);
        return;
      }
      if (e.target === this.svg) {
        const hadSel = this.selectedNodeId !== null || this.selectedLink !== null || this.selectedIds.size > 0;
        this.selectedNodeId = null;
        this.selectedLink = null;
        this.selectedIds.clear();
        if (hadSel) this.cb.onSelectionCleared();
        this.drag = { kind: "band", start: p, cur: p, moved: false };
        this.updateBandRect();
      }
    }
    groupStart() {
      const map = /* @__PURE__ */ new Map();
      for (const id of this.selectedIds) {
        const pos = this.positions.get(id);
        if (pos) map.set(id, { ...pos });
      }
      return map;
    }
    /** reorder-handle hit test in world coords: the ↑/↓ strip just right of a
     *  card's out-link rows. Returns null outside any handle (incl. boundary
     *  rows whose handle is hidden). */
    hitReorderHandle(w2) {
      if (!this.model) return null;
      for (const nd of this.model.nodes()) {
        const id = this.model.getNum(nd, "mId");
        const pos = this.positions.get(id);
        const m2 = this.cardMetrics.get(id);
        if (!pos || !m2 || m2.outColW === 0) continue;
        const dx = w2.x - pos.x, dy = w2.y - pos.y;
        if (dx < m2.w + 4 || dx > m2.w + 32) continue;
        const spans = m2.rows.map((r) => Math.max(1, r.condLines.length));
        const offsets = lineOffsets(spans);
        let row2 = -1;
        for (let k = 0; k < spans.length; k++) {
          const top = HEADER_H + ROW_TOP + offsets[k] * ROW_H;
          if (dy >= top && dy <= top + spans[k] * ROW_H - 2) {
            row2 = k;
            break;
          }
        }
        if (row2 < 0) continue;
        const linkCount = this.model.linksOf(nd).length;
        const dir = dx < m2.w + 17 ? -1 : 1;
        if (row2 >= linkCount) continue;
        if (dir < 0 && row2 === 0) continue;
        if (dir > 0 && row2 >= linkCount - 1) continue;
        return { nodeId: id, linkIndex: row2, dir };
      }
      return null;
    }
    /** reveal the reorder handles under the pointer even though edge paths
     *  render above them (geometry-based, so z-order can't hide them) */
    updateHoverReveal(e) {
      const t = e.target;
      let next = null;
      if (t && this.svg.contains(t) && !this.drag) {
        const h = this.hitReorderHandle(this.screenToWorld(e.clientX, e.clientY));
        if (h) next = { nodeId: h.nodeId, linkIndex: h.linkIndex };
      }
      if (this.hoverReveal?.nodeId === next?.nodeId && this.hoverReveal?.linkIndex === next?.linkIndex) return;
      this.hoverReveal = next;
      this.svg.querySelectorAll("g[data-reorder].show").forEach((el) => el.classList.remove("show"));
      if (next) {
        this.svg.querySelectorAll(`g[data-reorder="${next.nodeId},${next.linkIndex}"]`).forEach((el) => el.classList.add("show"));
      }
    }
    onPointerMove(e) {
      if (!this.drag) {
        this.updateHoverReveal(e);
        return;
      }
      if (this.drag.kind === "pan") {
        this.view.x = this.drag.ox + (e.clientX - this.drag.sx);
        this.view.y = this.drag.oy + (e.clientY - this.drag.sy);
        this.applyView();
      } else if (this.drag.kind === "band") {
        const p = this.screenToWorld(e.clientX, e.clientY);
        const movedPx = Math.hypot(e.clientX - this.lastMouse.x, e.clientY - this.lastMouse.y);
        if (!this.drag.moved && movedPx < 4) return;
        this.drag.moved = true;
        this.drag.cur = p;
        this.updateBandRect();
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
    onPointerUp() {
      if (this.drag?.kind === "node") {
        if (this.drag.moved) {
          this.savePositions();
        } else if (this.drag.pendingLink) {
          this.cb.onSelectLink(this.drag.pendingLink.nodeId, this.drag.pendingLink.linkIndex);
        }
      } else if (this.drag?.kind === "band") {
        this.bandRect?.setAttribute("visibility", "hidden");
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
    updateBandRect() {
      if (!this.bandRect || !this.drag || this.drag.kind !== "band") return;
      const x = Math.min(this.drag.start.x, this.drag.cur.x);
      const y = Math.min(this.drag.start.y, this.drag.cur.y);
      this.bandRect.setAttribute("x", String(x));
      this.bandRect.setAttribute("y", String(y));
      this.bandRect.setAttribute("width", String(Math.abs(this.drag.cur.x - this.drag.start.x)));
      this.bandRect.setAttribute("height", String(Math.abs(this.drag.cur.y - this.drag.start.y)));
      this.bandRect.setAttribute("visibility", "visible");
    }
    /** ids of nodes whose card intersects the band (world coords) */
    bandHit(a, b) {
      const hit = /* @__PURE__ */ new Set();
      if (!this.model) return hit;
      const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
      const y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
      for (const nd of this.model.nodes()) {
        const id = this.model.getNum(nd, "mId");
        const pos = this.positions.get(id);
        const m2 = this.cardMetrics.get(id);
        if (!pos) continue;
        const w2 = m2?.w ?? 216, h = m2?.h ?? 64;
        if (pos.x < x1 && pos.x + w2 > x0 && pos.y < y1 && pos.y + h > y0) hit.add(id);
      }
      return hit;
    }
    selectNode(nodeId) {
      this.selectedNodeId = nodeId;
      this.selectedLink = null;
      this.selectedIds = /* @__PURE__ */ new Set([nodeId]);
      this.render();
    }
    selectLink(nodeId, linkIndex) {
      this.selectedLink = { nodeId, linkIndex };
      this.selectedNodeId = null;
      this.selectedIds = /* @__PURE__ */ new Set([nodeId]);
      this.render();
    }
    clearSelection() {
      this.selectedNodeId = null;
      this.selectedLink = null;
      this.selectedIds.clear();
      this.render();
    }
    // ----- layout -----
    autoLayout() {
      if (!this.model) return;
      const model2 = this.model;
      const nodes = model2.nodes();
      const ids = nodes.map((nd) => model2.getNum(nd, "mId"));
      const idSet = new Set(ids);
      const outLinks = /* @__PURE__ */ new Map();
      const inLinks = /* @__PURE__ */ new Map();
      for (const id of ids) {
        outLinks.set(id, []);
        inLinks.set(id, []);
      }
      for (const nd of nodes) {
        const id = model2.getNum(nd, "mId");
        for (const lk of model2.linksOf(nd)) {
          const dst = model2.getNum(lk, "mDestinationNodeId");
          if (idSet.has(dst)) {
            outLinks.get(id).push(dst);
            inLinks.get(dst).push(id);
          }
        }
      }
      const bandOf = /* @__PURE__ */ new Map();
      const depthInBand = /* @__PURE__ */ new Map();
      const bands = [];
      for (const seed of ids) {
        if (bandOf.has(seed)) continue;
        const bandIdx = bands.length;
        bands.push(seed);
        const queue = [seed];
        bandOf.set(seed, bandIdx);
        depthInBand.set(seed, 0);
        while (queue.length) {
          const cur = queue.shift();
          for (const nxt of outLinks.get(cur) ?? []) {
            if (!bandOf.has(nxt)) {
              bandOf.set(nxt, bandIdx);
              depthInBand.set(nxt, depthInBand.get(cur) + 1);
              queue.push(nxt);
            }
          }
        }
      }
      const bandLayers = bands.map(() => []);
      for (const id of ids) {
        const b = bandOf.get(id);
        const d = depthInBand.get(id);
        while (bandLayers[b].length <= d) bandLayers[b].push([]);
        bandLayers[b][d].push(id);
      }
      for (const layers of bandLayers) {
        for (let sweep = 0; sweep < 4; sweep++) {
          for (let li = 1; li < layers.length; li++) {
            const prev = layers[li - 1];
            this.sortLayer(layers[li], (id) => avg((inLinks.get(id) ?? []).filter((p) => prev.includes(p)).map((p) => prev.indexOf(p) + 1)));
          }
          for (let li = layers.length - 2; li >= 0; li--) {
            const next = layers[li + 1];
            this.sortLayer(layers[li], (id) => avg((outLinks.get(id) ?? []).filter((p) => next.includes(p)).map((p) => next.indexOf(p) + 1)));
          }
        }
      }
      const initId = model2.initialStateId();
      const metrics = /* @__PURE__ */ new Map();
      for (const nd of nodes) {
        const id = model2.getNum(nd, "mId");
        metrics.set(id, measureCard(model2, nd, id, initId));
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
          const columns = [[]];
          let colH = 0;
          for (const id of layer) {
            const mm = metrics.get(id);
            if (colH > 0 && colH + mm.h > TARGET_H) {
              columns.push([]);
              colH = 0;
            }
            columns[columns.length - 1].push({ id, m: mm });
            colH += mm.h + 14;
          }
          let colX = layerX;
          let layerH = 0;
          for (const col of columns) {
            let y = bandY;
            let colMaxW = 0;
            for (const { id, m: m2 } of col) {
              this.positions.set(id, { x: colX, y });
              y += m2.h + 14;
              colMaxW = Math.max(colMaxW, m2.w);
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
    sortLayer(layer, key) {
      const keyed = layer.map((id) => ({ id, k: key(id) }));
      keyed.sort((a, b) => a.k - b.k);
      keyed.forEach((e, i) => {
        layer[i] = e.id;
      });
    }
    // ----- persistence -----
    posKey() {
      return `fsmstudio.pos.${this.model?.fileName ?? "unsaved"}`;
    }
    restorePositions() {
      try {
        const raw = localStorage.getItem(this.posKey());
        if (raw) this.positions = new Map(Object.entries(JSON.parse(raw)).map(([k, v]) => [Number(k), v]));
      } catch {
      }
    }
    savePositions() {
      try {
        localStorage.setItem(this.posKey(), JSON.stringify(Object.fromEntries(this.positions)));
      } catch {
      }
    }
    // ----- project files -----
    /** current layout for project files (.fsmp.json) */
    getLayout() {
      return {
        positions: Object.fromEntries(this.positions),
        view: { ...this.view },
        edgesOnTop: this.edgesOnTop
      };
    }
    /** apply a project layout. Only positions of node ids that exist in the
     *  current model are taken; the rest keep their current spot. Returns how
     *  many saved entries matched. */
    applyLayout(layout) {
      if (!this.model) return { matched: 0, total: 0 };
      const ids = new Set(this.model.nodes().map((nd) => this.model.getNum(nd, "mId")));
      let matched = 0;
      const entries = Object.entries(layout.positions ?? {});
      for (const [k, p] of entries) {
        const id = Number(k);
        if (ids.has(id) && p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
          this.positions.set(id, { x: Math.round(p.x), y: Math.round(p.y) });
          matched++;
        }
      }
      if (layout.view && Number.isFinite(layout.view.x) && Number.isFinite(layout.view.y) && Number.isFinite(layout.view.z)) {
        this.view = { ...layout.view };
        this.applyView();
      }
      if (typeof layout.edgesOnTop === "boolean") this.setEdgesOnTop(layout.edgesOnTop);
      this.savePositions();
      this.render();
      return { matched, total: entries.length };
    }
    // ----- rendering -----
    nodePos(id) {
      return this.positions.get(id) ?? { x: 40, y: 40 };
    }
    render() {
      if (!this.model) {
        this.edgeLayer.innerHTML = "";
        this.nodeLayer.innerHTML = "";
        return;
      }
      const ns = "http://www.w3.org/2000/svg";
      const model2 = this.model;
      const initId = model2.initialStateId();
      const cards = /* @__PURE__ */ new Map();
      for (const nd of model2.nodes()) {
        const id = model2.getNum(nd, "mId");
        cards.set(id, measureCard(model2, nd, id, initId));
      }
      this.cardMetrics = cards;
      const spansOf = (rows) => rows.map((r) => r.condLines.length);
      const rowMidY = (spans, i) => {
        let start = 0;
        for (let k = 0; k < i; k++) start += Math.max(1, spans[k]);
        return HEADER_H + ROW_TOP + (start + Math.max(1, spans[i]) / 2) * ROW_H;
      };
      this.edgeLayer.innerHTML = "";
      for (const nd of model2.nodes()) {
        const id = model2.getNum(nd, "mId");
        const a = this.nodePos(id), sa = cards.get(id);
        model2.linksOf(nd).forEach((lk, idx) => {
          const dst = model2.getNum(lk, "mDestinationNodeId");
          const b = this.nodePos(dst), sb = cards.get(dst);
          const isSel = this.selectedLink?.nodeId === id && this.selectedLink?.linkIndex === idx;
          const inSel = !isSel && this.selectedIds.has(dst);
          const outSel = !isSel && !inSel && this.selectedIds.has(id);
          const path = document.createElementNS(ns, "path");
          path.dataset["edge"] = `${id},${idx}`;
          const sx = a.x + sa.w;
          const sy = a.y + rowMidY(spansOf(sa.rows), idx);
          let ty = sb ? sb.h / 2 : 28;
          let tx = b.x;
          if (sb) {
            const ir = sb.inRows.findIndex((r) => r.src === id && r.lidx === idx);
            if (ir >= 0) ty = b.y + rowMidY(spansOf(sb.inRows), ir);
          }
          let d;
          if (id === dst) {
            d = `M ${sx},${sy} C ${sx + 56},${sy - 40} ${sx + 96},${sy - 40} ${sx + 40},${sy}`;
          } else {
            const dx = Math.max(30, Math.abs(tx - sx) * 0.45);
            const sgn = tx >= sx ? 1 : -1;
            d = `M ${sx},${sy} C ${sx + dx * sgn},${sy} ${tx - dx * sgn},${ty} ${tx},${ty}`;
          }
          path.setAttribute("d", d);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke", isSel ? "#ff5252" : inSel ? "#ff5252" : outSel ? "#54c46a" : "#8b95a3");
          path.setAttribute("stroke-opacity", isSel || inSel || outSel ? "0.95" : this.edgesOnTop ? "0.5" : "0.42");
          path.setAttribute("stroke-width", isSel ? "2.4" : inSel || outSel ? "1.9" : "1.3");
          path.setAttribute("marker-end", isSel ? "url(#arrowSel)" : inSel ? "url(#arrowIn)" : outSel ? "url(#arrowOut)" : "url(#arrow)");
          this.edgeLayer.appendChild(path);
        });
      }
      this.nodeLayer.innerHTML = "";
      for (const nd of model2.nodes()) {
        const id = model2.getNum(nd, "mId");
        const pos = this.nodePos(id);
        const g = document.createElementNS(ns, "g");
        g.dataset["nodeId"] = String(id);
        g.setAttribute("transform", `translate(${pos.x},${pos.y})`);
        const dim = this.highlightIds.size > 0 && !this.highlightIds.has(id);
        g.style.opacity = dim ? "0.18" : "1";
        const m2 = cards.get(id);
        const W = m2.w;
        const H = m2.h;
        const HEADER = HEADER_H;
        const bodyRect = document.createElementNS(ns, "rect");
        bodyRect.setAttribute("width", String(W));
        bodyRect.setAttribute("height", String(H));
        bodyRect.setAttribute("rx", "8");
        bodyRect.setAttribute("class", "nodeCard" + (this.selectedNodeId === id ? " sel" : this.selectedIds.has(id) ? " multisel" : "") + (m2.isInit ? " init" : ""));
        g.appendChild(bodyRect);
        const header = document.createElementNS(ns, "path");
        header.setAttribute("d", `M 0,8 a 8,8 0 0 1 8,-8 L ${W - 8},0 a 8,8 0 0 1 8,8 L ${W},${HEADER} L 0,${HEADER} Z`);
        header.setAttribute("fill", COLOR_PALETTE[m2.colorIdx]);
        header.setAttribute("class", "nodeHeader" + (this.selectedNodeId === id ? " sel" : ""));
        g.appendChild(header);
        const nameT = document.createElementNS(ns, "text");
        nameT.setAttribute("x", "9");
        nameT.setAttribute("y", "17");
        nameT.setAttribute("class", "nodeHeaderText");
        nameT.textContent = clip(m2.name, W - 30);
        g.appendChild(nameT);
        if (m2.isInit) {
          const badge = document.createElementNS(ns, "text");
          badge.setAttribute("x", String(W - 8));
          badge.setAttribute("y", "17");
          badge.setAttribute("class", "nodeHeaderText");
          badge.setAttribute("text-anchor", "end");
          badge.textContent = "▶";
          g.appendChild(badge);
        }
        const listX = W - m2.outColW - 6;
        const inX = 8;
        const infoX = 8 + m2.inColW + 8;
        const inBase = lineOffsets(m2.inRows.map((r) => r.condLines.length));
        m2.inRows.forEach((r, ri) => {
          const span = Math.max(1, r.condLines.length);
          const top = HEADER + ROW_TOP + inBase[ri] * ROW_H;
          const rg = document.createElementNS(ns, "g");
          rg.dataset["edge"] = `${r.src},${r.lidx}`;
          rg.setAttribute("class", "edgeRow");
          const hit = document.createElementNS(ns, "rect");
          hit.setAttribute("x", String(inX - 3));
          hit.setAttribute("y", String(top));
          hit.setAttribute("width", String(m2.inColW));
          hit.setAttribute("height", String(span * ROW_H));
          hit.setAttribute("rx", "3");
          hit.setAttribute("class", "edgeRowHit");
          rg.appendChild(hit);
          const t = document.createElementNS(ns, "text");
          t.setAttribute("x", String(inX));
          t.setAttribute("y", String(top + 13));
          t.setAttribute("class", "edgeRowText inRowText");
          t.textContent = clip(r.text, Math.max(34, m2.inColW - textW(r.condLines[0] ?? "") - 14));
          rg.appendChild(t);
          r.condLines.forEach((line, lj) => {
            const ct = document.createElementNS(ns, "text");
            ct.setAttribute("x", String(inX + m2.inColW - 2));
            ct.setAttribute("y", String(top + 13 + lj * ROW_H));
            ct.setAttribute("class", "edgeRowCond");
            ct.setAttribute("text-anchor", "end");
            ct.textContent = clip(line, m2.inColW - 8);
            rg.appendChild(ct);
          });
          const title = document.createElementNS(ns, "title");
          title.textContent = `来自 ${r.src}${r.cond ? `
${r.cond}` : ""}`;
          rg.appendChild(title);
          g.appendChild(rg);
        });
        m2.infoLines.forEach((line, li) => {
          const t = document.createElementNS(ns, "text");
          t.setAttribute("x", String(infoX));
          t.setAttribute("y", String(HEADER + 16 + li * 15));
          const cls = line.startsWith("act") ? "nodeAct" : line.startsWith("mot") ? "nodeMot" : "nodeSub";
          t.setAttribute("class", cls);
          t.textContent = line;
          g.appendChild(t);
        });
        const outBase = lineOffsets(m2.rows.map((r) => r.condLines.length));
        m2.rows.forEach((r) => {
          const span = Math.max(1, r.condLines.length);
          const top = HEADER + ROW_TOP + outBase[r.idx] * ROW_H;
          const rg = document.createElementNS(ns, "g");
          rg.dataset["edge"] = `${id},${r.idx}`;
          rg.setAttribute("class", "edgeRow" + (this.selectedLink?.nodeId === id && this.selectedLink?.linkIndex === r.idx ? " sel" : ""));
          const hit = document.createElementNS(ns, "rect");
          hit.setAttribute("x", String(listX - 4));
          hit.setAttribute("y", String(top));
          hit.setAttribute("width", String(m2.outColW));
          hit.setAttribute("height", String(span * ROW_H));
          hit.setAttribute("rx", "3");
          hit.setAttribute("class", "edgeRowHit");
          rg.appendChild(hit);
          const label = document.createElementNS(ns, "text");
          label.setAttribute("x", String(listX));
          label.setAttribute("y", String(top + 13));
          label.setAttribute("class", "edgeRowText");
          const rowW = m2.outColW;
          let firstLine = r.condLines[0] ?? "";
          let labelMax = rowW - textW(firstLine) - 10;
          if (firstLine && labelMax < 40) {
            firstLine = firstLine.split(" ")[0];
            labelMax = rowW - textW(firstLine) - 10;
          }
          label.textContent = clip(r.text, Math.max(30, labelMax));
          rg.appendChild(label);
          if (firstLine) {
            const condLines2 = [firstLine, ...r.condLines.slice(1)];
            condLines2.forEach((line, lj) => {
              const condT = document.createElementNS(ns, "text");
              condT.setAttribute("x", String(W - 6));
              condT.setAttribute("y", String(top + 13 + lj * ROW_H));
              condT.setAttribute("class", "edgeRowCond");
              condT.setAttribute("text-anchor", "end");
              condT.textContent = clip(line, rowW - 12);
              rg.appendChild(condT);
            });
          } else {
            const arrow = document.createElementNS(ns, "text");
            arrow.setAttribute("x", String(W - 8));
            arrow.setAttribute("y", String(top + 13));
            arrow.setAttribute("class", "edgeRowArrow");
            arrow.setAttribute("text-anchor", "end");
            arrow.textContent = "→";
            rg.appendChild(arrow);
          }
          const title = document.createElementNS(ns, "title");
          title.textContent = `→ ${r.dst}${r.cond ? `  [${r.cond}]` : ""}`;
          rg.appendChild(title);
          const linkCount = model2.linksOf(nd).length;
          const reorder = (dir, gx) => {
            const btn2 = document.createElementNS(ns, "g");
            btn2.dataset["reorder"] = `${id},${r.idx}`;
            btn2.dataset["dir"] = String(dir);
            btn2.setAttribute("class", "rowReorder");
            const hitR = document.createElementNS(ns, "rect");
            hitR.setAttribute("x", String(gx - 2));
            hitR.setAttribute("y", String(top));
            hitR.setAttribute("width", "14");
            hitR.setAttribute("height", String(span * ROW_H - 2));
            hitR.setAttribute("rx", "3");
            hitR.setAttribute("class", "rowReorderHit");
            btn2.appendChild(hitR);
            const arrow = document.createElementNS(ns, "text");
            arrow.setAttribute("x", String(gx + 5));
            arrow.setAttribute("y", String(top + 13));
            arrow.setAttribute("text-anchor", "middle");
            arrow.setAttribute("class", "rowReorderArrow");
            arrow.textContent = dir < 0 ? "↑" : "↓";
            btn2.appendChild(arrow);
            btn2.setAttribute("visibility", dir < 0 ? r.idx === 0 ? "hidden" : "visible" : r.idx === linkCount - 1 ? "hidden" : "visible");
            rg.appendChild(btn2);
          };
          reorder(-1, W + 6);
          reorder(1, W + 19);
          g.appendChild(rg);
        });
        this.nodeLayer.appendChild(g);
      }
    }
  };
  function avg(xs) {
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 1e9;
  }

  // src/inspector.ts
  var OPERATORS = [
    [0, "None（直通）"],
    [1, "IsTrue"],
    [2, "IsFalse"],
    [3, "Equal"],
    [4, "NotEqual"],
    [5, "LessThan"],
    [6, "LessThanOrEqual"],
    [7, "GreaterThan"],
    [8, "GreaterThanOrEqual"],
    [9, "BitAnd"],
    [10, "BitOr"],
    [16, "And"],
    [17, "Or"]
  ];
  var COMMON_PROPS = [
    "R",
    "回避",
    "オーラレベル白以上",
    "オーラレベル黄以上",
    "オーラレベル赤以上",
    "練気ゲージ判定(見切り)",
    "練気ゲージ判定(必殺)",
    "居合斬り",
    "見切り回避成功後の攻撃ヒット"
  ];
  function renderInspector(host, root) {
    root.innerHTML = "";
    const m2 = host.model;
    if (!m2) {
      root.innerHTML = '<div class="inspEmpty">打开 .fsm 或 .xml 文件后开始编辑。<br><br>支持 XFsm 的二进制与 XML 两种格式，保存为游戏可用的 .fsm。</div>';
      return;
    }
    const sel = host.selection;
    switch (sel.kind) {
      case "none":
        renderRootHint(m2, root);
        break;
      case "root":
        renderRoot(m2, host, root);
        break;
      case "node":
        renderNode(m2, host, root, sel.nodeId);
        break;
      case "multi":
        renderMulti(m2, host, root, sel.nodeIds);
        break;
      case "link":
        renderLink(m2, host, root, sel.nodeId, sel.linkIndex);
        break;
      case "condition":
        renderConditionEditor(m2, host, root, sel.condIndex);
        break;
    }
  }
  function section(root, title) {
    const box = document.createElement("div");
    box.className = "inspSection";
    const h = document.createElement("h3");
    h.textContent = title;
    box.appendChild(h);
    root.appendChild(box);
    return box;
  }
  function row(box, label) {
    const r = document.createElement("div");
    r.className = "row";
    const lab = document.createElement("label");
    lab.textContent = label;
    r.appendChild(lab);
    box.appendChild(r);
    return r;
  }
  function wireEditing(input, m2, host, apply, liveValue) {
    let armed = true;
    const begin = () => {
      if (armed) {
        m2.snapshot();
        armed = false;
      }
    };
    input.addEventListener("input", () => {
      if (liveValue && !liveValue()) return;
      begin();
      apply();
      host.requestLiveRefresh();
    });
    input.addEventListener("change", () => {
      begin();
      apply();
      host.requestRender();
    });
  }
  function numInput(r, m2, host, value, apply, opts = {}) {
    const input = document.createElement("input");
    input.type = "number";
    input.value = String(value);
    input.step = String(opts.step ?? 1);
    if (opts.wide) input.className = "wide";
    wireEditing(
      input,
      m2,
      host,
      () => apply(Math.trunc(Number(input.value) || 0)),
      () => input.value.trim() !== "" && !Number.isNaN(Number(input.value))
    );
    r.appendChild(input);
    return input;
  }
  function textInput(r, m2, host, value, apply, datalist) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    wireEditing(input, m2, host, () => apply(input.value));
    if (datalist) {
      const dl = document.createElement("datalist");
      dl.id = `dl-${Math.random().toString(36).slice(2)}`;
      for (const s of datalist) {
        const o = document.createElement("option");
        o.value = s;
        dl.appendChild(o);
      }
      input.setAttribute("list", dl.id);
      r.appendChild(dl);
    }
    r.appendChild(input);
    return input;
  }
  function checkbox(r, value, onChange) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = value;
    input.addEventListener("change", () => onChange(input.checked));
    r.appendChild(input);
    return input;
  }
  function button(r, label, onClick, cls = "") {
    const b = document.createElement("button");
    b.textContent = label;
    b.className = cls;
    b.addEventListener("click", onClick);
    r.appendChild(b);
    return b;
  }
  function colorPalette(current, onPick) {
    const pal = document.createElement("div");
    pal.className = "colorPalette";
    COLOR_PALETTE.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch" + (i === current ? " cur" : "");
      b.style.background = c;
      b.title = `${COLOR_NAMES[i]}（mColorType=${i}）`;
      b.addEventListener("click", () => onPick(i));
      pal.appendChild(b);
    });
    return pal;
  }
  function renderRootHint(m2, root) {
    const box = section(root, `FSM 总览 — ${m2.doc.rootName}`);
    const info = document.createElement("div");
    info.className = "hintBox";
    const problems = m2.validate();
    info.innerHTML = `<p>节点 <b>${m2.nodes().length}</b> · 链接 <b>${m2.nodes().reduce((a, nd) => a + m2.linksOf(nd).length, 0)}</b> · 条件 <b>${m2.conditions().length}</b></p>` + (problems.length ? `<p class="bad">校验问题:<br>${problems.map((p) => `· ${escapeHtml(p)}`).join("<br>")}</p>` : '<p class="ok">校验通过，无悬空引用。</p>') + '<p class="dim">点击节点 / 连线查看属性；双击空白处新建节点。</p>';
    box.appendChild(info);
    button(box, "查看 FSM 根属性", () => window.selectRoot(), "linkish");
  }
  function renderRoot(m2, host, root) {
    const r = m2.doc.root;
    const box = section(root, "FSM 根属性 (rAIFSM)");
    let rowEl = row(box, "mOwnerObjectName");
    textInput(rowEl, m2, host, m2.str(r, "mOwnerObjectName"), (v) => {
      m2.setField(r, "mOwnerObjectName", v);
      m2.doc.rootName = v;
    });
    rowEl = row(box, "mQuality");
    numInput(rowEl, m2, host, m2.getNum(r, "mQuality"), (v) => m2.setField(r, "mQuality", v));
    rowEl = row(box, "mFSMAttribute");
    numInput(rowEl, m2, host, m2.getNum(r, "mFSMAttribute"), (v) => m2.setField(r, "mFSMAttribute", v));
    rowEl = row(box, "初始状态节点");
    const select = document.createElement("select");
    for (const nd of m2.nodes()) {
      const o = document.createElement("option");
      o.value = String(m2.getNum(nd, "mId"));
      o.textContent = `${m2.getNum(nd, "mId")} — ${m2.str(nd, "mName")}`;
      select.appendChild(o);
    }
    select.value = String(m2.initialStateId());
    select.addEventListener("change", () => {
      m2.snapshot();
      m2.setField(m2.rootCluster(), "mInitialStateId", Number(select.value));
      host.requestRender();
    });
    rowEl.appendChild(select);
  }
  function renderMulti(m2, host, root, nodeIds) {
    const box = section(root, `已选中 ${nodeIds.length} 个节点`);
    const info = document.createElement("div");
    info.className = "hintBox";
    const rows = nodeIds.map((id) => {
      const nd = m2.nodeById(id);
      return `<div>· ${id} — ${escapeHtml(nd ? m2.str(nd, "mName") || "(未命名)" : "(已删除)")}</div>`;
    }).join("");
    info.innerHTML = `<p>在画布上拖动任一选中卡片即可<b>整体移动</b>；按 Delete 删除全部选中节点。</p><p class="dim">${rows}</p>`;
    box.appendChild(info);
    const cr = row(box, "统一颜色");
    cr.appendChild(colorPalette(-1, (i) => {
      m2.snapshot();
      for (const id of nodeIds) {
        const nd = m2.nodeById(id);
        if (nd) m2.setField(nd, "mColorType", i);
      }
      host.requestRender();
    }));
    button(box, "删除所选节点", () => {
      if (!confirm(`删除选中的 ${nodeIds.length} 个节点？指向它们的链接也会一并删除。`)) return;
      m2.snapshot();
      for (const id of nodeIds) m2.deleteNode(id);
      host.setSelection({ kind: "none" });
      host.requestRender();
    }, "danger");
  }
  function renderNode(m2, host, root, nodeId) {
    const node = m2.nodeById(nodeId);
    if (!node) {
      root.innerHTML = '<div class="inspEmpty">节点已被删除</div>';
      return;
    }
    const title = section(root, `节点 ${nodeId} — ${m2.str(node, "mName") || "(未命名)"}`);
    let r = row(title, "名称 mName");
    textInput(r, m2, host, m2.str(node, "mName"), (v) => m2.setField(node, "mName", v));
    const motion = m2.nodeMotionNo(node);
    r = row(title, "ActionNo（动作号）");
    numInput(r, m2, host, m2.nodeActionNo(node) ?? -1, (v) => m2.setNodeActionNo(node, v), { wide: true });
    r = row(title, "MotionNo（动作号）");
    numInput(r, m2, host, motion?.motion ?? -1, (v) => m2.setNodeMotionNo(node, v, motion?.phase ?? -1), { wide: true });
    r = row(title, "MotionNo_Phase1");
    numInput(r, m2, host, motion?.phase ?? -1, (v) => m2.setNodeMotionNo(node, motion?.motion ?? 0, v));
    r = row(title, "mUniqueId");
    const ro = document.createElement("span");
    ro.textContent = String(m2.getNum(node, "mUniqueId"));
    ro.className = "dim";
    r.appendChild(ro);
    r = row(title, "颜色");
    r.appendChild(colorPalette(m2.getNum(node, "mColorType") % COLOR_PALETTE.length, (i) => {
      m2.snapshot();
      m2.setField(node, "mColorType", i);
      host.requestRender();
    }));
    r = row(title, "mColorType");
    numInput(r, m2, host, m2.getNum(node, "mColorType"), (v) => m2.setField(node, "mColorType", v));
    r = row(title, "mSetting");
    numInput(r, m2, host, m2.getNum(node, "mSetting"), (v) => m2.setField(node, "mSetting", v));
    r = row(title, "mUserAttribute");
    numInput(r, m2, host, m2.getNum(node, "mUserAttribute"), (v) => m2.setField(node, "mUserAttribute", v));
    r = row(title, "全局条件转换");
    checkbox(r, m2.getNum(node, "mExistConditionTrainsitionFromAll") === 1, (v) => {
      m2.snapshot();
      m2.setField(node, "mExistConditionTrainsitionFromAll", v ? 1 : 0);
      host.requestRender();
    });
    const condOpts = m2.conditions().map((c, i) => [i, m2.conditionSummary(c)]);
    const condSelect = conditionSelect(condOpts, m2.getNum(node, "mConditionTrainsitionFromAllId"));
    condSelect.addEventListener("change", () => {
      m2.snapshot();
      m2.setField(node, "mConditionTrainsitionFromAllId", Number(condSelect.value));
      host.requestRender();
    });
    r.appendChild(condSelect);
    const linkCount = m2.linksOf(node).length;
    const linkBox = section(root, `出链接 (${linkCount})`);
    const orderHint = document.createElement("div");
    orderHint.className = "dim small";
    orderHint.textContent = "顺序 = 判定优先级：靠前的链接先匹配（如 R+○ 要放在 R 前面）。用 ↑↓ 调整。";
    linkBox.appendChild(orderHint);
    m2.linksOf(node).forEach((lk, idx) => {
      const lb = document.createElement("div");
      lb.className = "linkItem" + (isLinkSelected(host, nodeId, idx) ? " sel" : "");
      const destSel = document.createElement("select");
      for (const nd of m2.nodes()) {
        const o = document.createElement("option");
        o.value = String(m2.getNum(nd, "mId"));
        o.textContent = `${m2.getNum(nd, "mId")} — ${m2.str(nd, "mName")}`;
        destSel.appendChild(o);
      }
      destSel.value = String(m2.getNum(lk, "mDestinationNodeId"));
      destSel.addEventListener("change", () => {
        m2.snapshot();
        m2.setField(lk, "mDestinationNodeId", Number(destSel.value));
        host.requestRender();
      });
      lb.appendChild(destSel);
      const condSel2 = conditionSelect(condOpts, m2.getNum(lk, "mConditionId"), m2.getNum(lk, "mExistCondition") !== 1);
      condSel2.addEventListener("change", () => {
        m2.snapshot();
        if (condSel2.value === "") m2.setField(lk, "mExistCondition", 0);
        else {
          m2.setField(lk, "mExistCondition", 1);
          m2.setField(lk, "mConditionId", Number(condSel2.value));
        }
        host.requestRender();
      });
      lb.appendChild(condSel2);
      textInput(lb, m2, host, m2.str(lk, "mName"), (v) => m2.setField(lk, "mName", v));
      const btns = document.createElement("span");
      btns.className = "btns";
      button(btns, "↑", () => host.reorderLink(nodeId, idx, -1), "mini").disabled = idx === 0;
      button(btns, "↓", () => host.reorderLink(nodeId, idx, 1), "mini").disabled = idx === linkCount - 1;
      button(btns, "→", () => {
        host.selectNode(m2.getNum(lk, "mDestinationNodeId"));
      }, "linkish");
      button(btns, "删", () => {
        m2.snapshot();
        m2.deleteLink(node, idx);
        host.requestRender();
      }, "danger");
      lb.appendChild(btns);
      linkBox.appendChild(lb);
    });
    const addRow = document.createElement("div");
    addRow.className = "row";
    button(addRow, "＋ 添加链接", () => {
      m2.snapshot();
      const firstId = m2.nodes()[0] ? m2.getNum(m2.nodes()[0], "mId") : 0;
      m2.addLink(node, firstId, null);
      host.requestRender();
    }, "primary");
    linkBox.appendChild(addRow);
    const dz = section(root, "危险操作");
    button(dz, "删除此节点", () => {
      if (!confirm(`删除节点 ${nodeId}（${m2.str(node, "mName")}）及其所有链接？`)) return;
      m2.snapshot();
      m2.deleteNode(nodeId);
      host.setSelection({ kind: "none" });
      host.requestRender();
    }, "danger");
  }
  function isLinkSelected(host, nodeId, idx) {
    return host.selection.kind === "link" && host.selection.nodeId === nodeId && host.selection.linkIndex === idx;
  }
  function conditionSelect(opts, current, includeNone = true) {
    const sel = document.createElement("select");
    if (includeNone) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "（无条件）";
      sel.appendChild(o);
    }
    opts.forEach(([i, summary]) => {
      const o = document.createElement("option");
      o.value = String(i);
      o.textContent = truncate(summary, 42);
      sel.appendChild(o);
    });
    sel.value = includeNone && current === 0 ? "" : String(current);
    return sel;
  }
  function renderLink(m2, host, root, nodeId, linkIndex) {
    const node = m2.nodeById(nodeId);
    const link = node ? m2.linksOf(node)[linkIndex] : void 0;
    if (!node || !link) {
      root.innerHTML = '<div class="inspEmpty">链接已被删除</div>';
      return;
    }
    const box = section(root, `链接: ${nodeId} → ${m2.getNum(link, "mDestinationNodeId")}`);
    let r = row(box, "目标节点");
    const destSel = document.createElement("select");
    for (const nd of m2.nodes()) {
      const o = document.createElement("option");
      o.value = String(m2.getNum(nd, "mId"));
      o.textContent = `${m2.getNum(nd, "mId")} — ${m2.str(nd, "mName")}`;
      destSel.appendChild(o);
    }
    destSel.value = String(m2.getNum(link, "mDestinationNodeId"));
    destSel.addEventListener("change", () => {
      m2.snapshot();
      m2.setField(link, "mDestinationNodeId", Number(destSel.value));
      host.requestRender();
    });
    r.appendChild(destSel);
    r = row(box, "条件");
    const condOpts = m2.conditions().map((c, i) => [i, m2.conditionSummary(c)]);
    const sel2 = conditionSelect(condOpts, m2.getNum(link, "mConditionId"), m2.getNum(link, "mExistCondition") !== 1);
    sel2.addEventListener("change", () => {
      m2.snapshot();
      if (sel2.value === "") {
        m2.setField(link, "mExistCondition", 0);
      } else {
        m2.setField(link, "mExistCondition", 1);
        m2.setField(link, "mConditionId", Number(sel2.value));
      }
      host.requestRender();
    });
    r.appendChild(sel2);
    button(r, "＋新建组合条件", () => {
      m2.snapshot();
      const created = m2.addCondition();
      const root2 = created.tree.__vals__["mpRootNode"];
      if (isInstance(root2)) {
        m2.setField(root2, "mOperator", 16);
        const child = m2.makeVariableNode("", ownerGuess(m2));
        const kids = m2.memberList(root2, "mpChildList");
        kids.push(child);
        m2.setList(root2, "mpChildList", kids);
      }
      m2.setField(link, "mExistCondition", 1);
      m2.setField(link, "mConditionId", created.index);
      host.requestRender();
    }, "mini");
    r = row(box, "链接名");
    textInput(r, m2, host, m2.str(link, "mName"), (v) => m2.setField(link, "mName", v));
    const condId = m2.getNum(link, "mConditionId");
    if (m2.getNum(link, "mExistCondition") === 1 && m2.conditions()[condId]) {
      const embed = document.createElement("div");
      embed.className = "linkCondEmbed";
      box.appendChild(embed);
      renderConditionEditor(m2, host, embed, condId, { backToLink: { nodeId, linkIndex } });
    }
    const dz = section(root, "操作");
    const reorderRow = document.createElement("div");
    reorderRow.className = "row";
    const linkTotal = m2.linksOf(node).length;
    button(reorderRow, "↑ 上移（更早判定）", () => host.reorderLink(nodeId, linkIndex, -1), "mini").disabled = linkIndex === 0;
    button(reorderRow, "↓ 下移（更晚判定）", () => host.reorderLink(nodeId, linkIndex, 1), "mini").disabled = linkIndex >= linkTotal - 1;
    dz.appendChild(reorderRow);
    const orderNote = document.createElement("div");
    orderNote.className = "dim small";
    orderNote.textContent = `本节点第 ${linkIndex + 1}/${linkTotal} 条链接。游戏从上到下判定，先匹配先生效。`;
    dz.appendChild(orderNote);
    button(dz, "删除此链接", () => {
      m2.snapshot();
      m2.deleteLink(node, linkIndex);
      host.setSelection({ kind: "node", nodeId });
      host.requestRender();
    }, "danger");
  }
  function renderConditionEditor(m2, host, root, condIndex, opts = {}) {
    const tree = m2.conditions()[condIndex];
    if (!tree) {
      root.innerHTML = '<div class="inspEmpty">条件已被删除</div>';
      return;
    }
    const box = section(root, `条件 #${condIndex}`);
    let r = row(box, "条件号 (mName.mId)");
    numInput(
      r,
      m2,
      host,
      m2.getNum(tree.__vals__["mName"], "mId"),
      (v) => m2.setField(tree.__vals__["mName"], "mId", v)
    );
    r = row(box, "引用次数");
    const usage = document.createElement("span");
    usage.textContent = `${m2.conditionUsage(condIndex)} 处`;
    usage.className = "dim";
    r.appendChild(usage);
    const rootNode = tree.__vals__["mpRootNode"];
    if (isInstance(rootNode) && m2.defName(rootNode.__class__).endsWith("OperationNode")) {
      const listBox = section(root, "条件组合（列表）");
      const rOp = row(listBox, "组合方式");
      const opSel = document.createElement("select");
      for (const [v, label] of OPERATORS) {
        if (v !== 0 && v !== 16 && v !== 17 && v < 1) continue;
        const o = document.createElement("option");
        o.value = String(v);
        o.textContent = v === 0 ? "单个条件（直通）" : v === 16 ? "同时满足（AND）" : "任一满足（OR）";
        opSel.appendChild(o);
      }
      opSel.value = String(m2.getNum(rootNode, "mOperator"));
      opSel.addEventListener("change", () => {
        m2.snapshot();
        m2.setField(rootNode, "mOperator", Number(opSel.value));
        host.requestRender();
      });
      rOp.appendChild(opSel);
      const kids = m2.memberList(rootNode, "mpChildList");
      kids.forEach((child, ci) => {
        const isVar = m2.defName(child.__class__).endsWith("VariableNode");
        const cr = document.createElement("div");
        cr.className = "condCombineRow";
        const tag = document.createElement("span");
        tag.className = "condTag";
        tag.textContent = isVar ? "变量" : "嵌套组";
        cr.appendChild(tag);
        if (isVar) {
          const vi = child.__vals__["mVariable"];
          if (isInstance(vi)) {
            const propIn = document.createElement("input");
            propIn.type = "text";
            propIn.value = m2.str(vi, "mPropertyName");
            propIn.placeholder = "属性名（如 R）";
            wireEditing(propIn, m2, host, () => m2.setField(vi, "mPropertyName", propIn.value));
            const dlId = "dl-combine-" + condIndex;
            propIn.setAttribute("list", dlId);
            if (!document.getElementById(dlId)) {
              const dl = document.createElement("datalist");
              dl.id = dlId;
              for (const pName of [.../* @__PURE__ */ new Set([...COMMON_PROPS, ...m2.collectPropertyNames()])]) {
                const o = document.createElement("option");
                o.value = pName;
                dl.appendChild(o);
              }
              listBox.appendChild(dl);
            }
            cr.appendChild(propIn);
            const ownerIn = document.createElement("input");
            ownerIn.type = "text";
            ownerIn.value = m2.str(vi, "mOwnerName");
            ownerIn.placeholder = "Owner";
            wireEditing(ownerIn, m2, host, () => m2.setField(vi, "mOwnerName", ownerIn.value));
            cr.appendChild(ownerIn);
            const idxIn = document.createElement("input");
            idxIn.type = "number";
            idxIn.value = String(m2.getNum(child, "mIndex"));
            idxIn.title = "mIndex";
            wireEditing(
              idxIn,
              m2,
              host,
              () => m2.setField(child, "mIndex", Math.trunc(Number(idxIn.value) || 0)),
              () => idxIn.value.trim() !== "" && !Number.isNaN(Number(idxIn.value))
            );
            cr.appendChild(idxIn);
          }
        } else {
          const note = document.createElement("span");
          note.className = "dim small";
          note.textContent = m2.conditionSummaryOf(child);
          cr.appendChild(note);
        }
        const btns = document.createElement("span");
        btns.className = "btns";
        button(btns, "↑", () => {
          if (ci === 0) return;
          m2.snapshot();
          const arr = m2.memberList(rootNode, "mpChildList");
          [arr[ci - 1], arr[ci]] = [arr[ci], arr[ci - 1]];
          m2.setList(rootNode, "mpChildList", arr);
          host.requestRender();
        }, "mini");
        button(btns, "↓", () => {
          m2.snapshot();
          const arr = m2.memberList(rootNode, "mpChildList");
          if (ci >= arr.length - 1) return;
          [arr[ci + 1], arr[ci]] = [arr[ci], arr[ci + 1]];
          m2.setList(rootNode, "mpChildList", arr);
          host.requestRender();
        }, "mini");
        button(btns, "删", () => {
          m2.snapshot();
          m2.setList(rootNode, "mpChildList", m2.memberList(rootNode, "mpChildList").filter((_, i) => i !== ci));
          host.requestRender();
        }, "mini danger");
        cr.appendChild(btns);
        listBox.appendChild(cr);
      });
      const addRow = document.createElement("div");
      addRow.className = "rowCond";
      button(addRow, "＋ 变量条件", () => {
        m2.snapshot();
        const arr = m2.memberList(rootNode, "mpChildList");
        arr.push(m2.makeVariableNode("", ownerGuess(m2)));
        m2.setList(rootNode, "mpChildList", arr);
        host.requestRender();
      }, "mini");
      button(addRow, "＋ 嵌套逻辑组", () => {
        m2.snapshot();
        const arr = m2.memberList(rootNode, "mpChildList");
        arr.push(m2.makeOperationNode(0));
        m2.setList(rootNode, "mpChildList", arr);
        host.requestRender();
      }, "mini");
      listBox.appendChild(addRow);
    }
    const treeBox = section(root, "条件树（完整视图）");
    if (isInstance(rootNode)) {
      renderCondNode(m2, host, treeBox, rootNode, condIndex, 0);
    }
    const dz = section(root, "操作");
    button(dz, "删除此条件（自动清理引用）", () => {
      if (!confirm(`删除条件 #${condIndex}？引用它的链接将变为无条件。`)) return;
      m2.snapshot();
      m2.deleteCondition(condIndex);
      if (opts.backToLink) host.setSelection({ kind: "link", nodeId: opts.backToLink.nodeId, linkIndex: opts.backToLink.linkIndex });
      else host.setSelection({ kind: "none" });
      host.requestRender();
    }, "danger");
  }
  function renderCondNode(m2, host, box, node, condIndex, depth) {
    const defName = m2.defName(node.__class__);
    const wrap2 = document.createElement("div");
    wrap2.className = `condNode depth${Math.min(depth, 5)}`;
    const head = document.createElement("div");
    head.className = "condHead";
    if (defName.endsWith("OperationNode")) {
      const op = document.createElement("select");
      for (const [v, label] of OPERATORS) {
        const o = document.createElement("option");
        o.value = String(v);
        o.textContent = label;
        op.appendChild(o);
      }
      op.value = String(m2.getNum(node, "mOperator"));
      op.addEventListener("change", () => {
        m2.snapshot();
        m2.setField(node, "mOperator", Number(op.value));
        host.requestRender();
      });
      head.appendChild(op);
    } else if (defName.endsWith("VariableNode")) {
      const tag = document.createElement("span");
      tag.className = "condTag";
      tag.textContent = "变量";
      head.appendChild(tag);
    } else {
      const tag = document.createElement("span");
      tag.className = "condTag";
      tag.textContent = defName;
      head.appendChild(tag);
    }
    wrap2.appendChild(head);
    if (defName.endsWith("VariableNode")) {
      const vi = node.__vals__["mVariable"];
      if (isInstance(vi)) {
        let r2 = row(wrap2, "属性名");
        textInput(
          r2,
          m2,
          host,
          m2.str(vi, "mPropertyName"),
          (v) => m2.setField(vi, "mPropertyName", v),
          [.../* @__PURE__ */ new Set([...COMMON_PROPS, ...m2.collectPropertyNames()])]
        );
        r2 = row(wrap2, "Owner");
        textInput(r2, m2, host, m2.str(vi, "mOwnerName"), (v) => m2.setField(vi, "mOwnerName", v));
        r2 = row(wrap2, "IsSingletonOwner");
        checkbox(r2, m2.getNum(vi, "mIsSingletonOwner") === 1, (v) => {
          m2.snapshot();
          m2.setField(vi, "mIsSingletonOwner", v ? 1 : 0);
        });
      }
      let r = row(wrap2, "mIndex");
      numInput(r, m2, host, m2.getNum(node, "mIndex"), (v) => m2.setField(node, "mIndex", v));
      r = row(wrap2, "IsBitNo");
      checkbox(r, m2.getNum(node, "mIsBitNo") === 1, (v) => {
        m2.snapshot();
        m2.setField(node, "mIsBitNo", v ? 1 : 0);
      });
      r = row(wrap2, "IsArray");
      checkbox(r, m2.getNum(node, "mIsArray") === 1, (v) => {
        m2.snapshot();
        m2.setField(node, "mIsArray", v ? 1 : 0);
      });
      r = row(wrap2, "IsDynamicIndex");
      checkbox(r, m2.getNum(node, "mIsDynamicIndex") === 1, (v) => {
        m2.snapshot();
        m2.setField(node, "mIsDynamicIndex", v ? 1 : 0);
      });
      r = row(wrap2, "UseEnumIndex");
      checkbox(r, m2.getNum(node, "mUseEnumIndex") === 1, (v) => {
        m2.snapshot();
        m2.setField(node, "mUseEnumIndex", v ? 1 : 0);
      });
    }
    if (defName.endsWith("OperationNode") || defName.endsWith("VariableNode")) {
      const kids = m2.memberList(node, "mpChildList");
      kids.forEach((child, ci) => {
        const childWrap = document.createElement("div");
        childWrap.className = "condChild";
        const bar = document.createElement("div");
        bar.className = "condChildBar";
        button(bar, "×", () => {
          m2.snapshot();
          m2.setList(node, "mpChildList", m2.memberList(node, "mpChildList").filter((_, i) => i !== ci));
          host.requestRender();
        }, "danger mini");
        childWrap.appendChild(bar);
        renderCondNode(m2, host, childWrap, child, condIndex, depth + 1);
        wrap2.appendChild(childWrap);
      });
      if (defName.endsWith("OperationNode")) {
        const addRow = document.createElement("div");
        addRow.className = "rowCond";
        button(addRow, "＋ 子节点", (e) => {
          const menu2 = e.currentTarget.nextElementSibling;
          if (menu2) menu2.classList.toggle("hidden");
        }, "mini");
        const menu = document.createElement("span");
        menu.className = "hidden";
        button(menu, "逻辑组", () => {
          m2.snapshot();
          pushChild(m2, node, m2.makeOperationNode(0));
          host.requestRender();
        }, "mini");
        button(menu, "变量条件", () => {
          m2.snapshot();
          pushChild(m2, node, m2.makeVariableNode("", ownerGuess(m2)));
          host.requestRender();
        }, "mini");
        addRow.appendChild(menu);
        wrap2.appendChild(addRow);
      }
    }
    box.appendChild(wrap2);
  }
  function pushChild(m2, node, child) {
    const cur = m2.memberList(node, "mpChildList");
    cur.push(child);
    m2.setList(node, "mpChildList", cur);
  }
  function ownerGuess(m2) {
    return m2.doc.rootName || "cFSMPl_W03";
  }
  function truncate(s, n) {
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // src/app.ts
  var model = null;
  var selection = { kind: "none" };
  var fileHandle = null;
  var projectHandle = null;
  var search = "";
  var $ = (id) => document.getElementById(id);
  function escapeHtml2(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function btn(id) {
    return document.getElementById(id);
  }
  function closeContextMenu() {
    document.querySelectorAll(".ctxMenu").forEach((m2) => m2.remove());
  }
  function buildMenuDom(items) {
    const menu = document.createElement("div");
    menu.className = "ctxMenu";
    for (const item of items) {
      if (item.label === "---") {
        const sep = document.createElement("div");
        sep.className = "ctxSep";
        menu.appendChild(sep);
        continue;
      }
      const row2 = document.createElement("div");
      row2.className = "ctxItem" + (item.danger ? " danger" : "") + (item.children ? " hasSub" : "");
      if (item.swatch) {
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.style.background = item.swatch;
        row2.appendChild(dot);
      }
      const labelSpan = document.createElement("span");
      labelSpan.textContent = item.label;
      row2.appendChild(labelSpan);
      if (item.children) {
        const sub = buildMenuDom(item.children);
        row2.appendChild(sub);
      } else if (item.action) {
        row2.addEventListener("click", () => {
          closeContextMenu();
          item.action();
        });
      }
      menu.appendChild(row2);
    }
    return menu;
  }
  function openContextMenu(items, x, y) {
    closeContextMenu();
    if (!items.length) return;
    const menu = buildMenuDom(items);
    menu.style.left = "0px";
    menu.style.top = "0px";
    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();
    menu.style.left = `${Math.min(x, window.innerWidth - rect.width - 8)}px`;
    menu.style.top = `${Math.min(y, window.innerHeight - rect.height - 8)}px`;
  }
  document.addEventListener("pointerdown", (e) => {
    const t = e.target;
    if (!t.closest(".ctxMenu")) closeContextMenu();
  }, true);
  window.addEventListener("blur", closeContextMenu);
  function colorMenuItems(ids) {
    return COLOR_PALETTE.map((c, i) => ({
      label: `${COLOR_NAMES[i] ?? `类型 ${i}`} (${i})`,
      swatch: c,
      action: () => {
        const m2 = model;
        if (!m2) return;
        m2.snapshot();
        for (const id of ids) {
          const nd = m2.nodeById(id);
          if (nd) m2.setField(nd, "mColorType", i);
        }
        renderAll();
      }
    }));
  }
  function nodeMenuItems(nodeId, world, multiIds) {
    const m2 = model;
    if (!m2) return [];
    const ids = multiIds && multiIds.length > 1 ? multiIds : [nodeId];
    const multi = ids.length > 1;
    const targetItems = () => m2.nodes().map((nd) => {
      const tid = m2.getNum(nd, "mId");
      return {
        label: `${tid} — ${m2.str(nd, "mName") || "(未命名)"}`,
        action: () => {
          m2.snapshot();
          m2.addLink(m2.nodeById(nodeId), tid, null);
          selection = { kind: "link", nodeId, linkIndex: m2.linksOf(m2.nodeById(nodeId)).length - 1 };
          renderAll();
        }
      };
    });
    return [
      ...multi ? [] : [{ label: "添加链接到…", children: targetItems() }],
      {
        label: multi ? `节点颜色（对选中的 ${ids.length} 个）` : "节点颜色",
        children: colorMenuItems(ids)
      },
      { label: "---" },
      {
        label: "在此新建 Action 节点",
        action: () => createNode("action", { x: world.x + 30, y: world.y })
      },
      {
        label: "在此新建 Motion 节点",
        action: () => createNode("motion", { x: world.x + 30, y: world.y })
      },
      {
        label: "在此新建空节点",
        action: () => createNode("plain", { x: world.x + 30, y: world.y })
      },
      { label: "---" },
      {
        label: multi ? `删除选中的 ${ids.length} 个节点` : "删除此节点",
        danger: true,
        action: () => {
          if (!confirm(multi ? `删除选中的 ${ids.length} 个节点？指向它们的链接也会一并删除。` : `删除节点 ${nodeId}？指向它的链接也会一并删除。`)) return;
          m2.snapshot();
          for (const id of ids) m2.deleteNode(id);
          selection = { kind: "none" };
          graph.clearSelection();
          renderAll();
        }
      }
    ];
  }
  function createNode(kind, world) {
    if (!model) return;
    model.snapshot();
    const name = kind === "action" ? "新Action节点" : kind === "motion" ? "新Motion节点" : "新节点";
    const nd = model.newNode(name, kind);
    const id = model.getNum(nd, "mId");
    if (world) graph.positions.set(id, world);
    selection = { kind: "node", nodeId: id };
    graph.selectNode(id);
    renderAll();
  }
  function hasFsApi() {
    return typeof window.showOpenFilePicker === "function";
  }
  function openPicker(o) {
    return window.showOpenFilePicker(o);
  }
  function savePicker(o) {
    return window.showSaveFilePicker(o);
  }
  async function pickOpen() {
    if (hasFsApi()) {
      try {
        const [handle] = await openPicker({
          types: [{ description: "MHW FSM", accept: { "application/octet-stream": [".fsm"], "text/xml": [".xml"] } }]
        });
        const file = await handle.getFile();
        return { bytes: new Uint8Array(await file.arrayBuffer()), name: file.name, handle };
      } catch (e) {
        if (e.name === "AbortError") return null;
      }
    }
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".fsm,.xml";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        resolve({ bytes: new Uint8Array(await file.arrayBuffer()), name: file.name, handle: null });
      };
      input.click();
    });
  }
  async function pickSave(name, kind, data) {
    const blobPart = typeof data === "string" ? data : data.slice().buffer;
    if (hasFsApi()) {
      try {
        const handle = await savePicker({
          suggestedName: name,
          types: [kind === "fsm" ? { description: "MHW FSM", accept: { "application/octet-stream": [".fsm"] } } : kind === "xml" ? { description: "MtSerializer XML", accept: { "text/xml": [".xml"] } } : { description: "FSM Studio 项目", accept: { "application/json": [".json"] } }]
        });
        const w2 = await handle.createWritable();
        await w2.write(new Blob([blobPart]));
        await w2.close();
        return handle;
      } catch (e) {
        if (e.name === "AbortError") return null;
      }
    }
    const blob = new Blob([blobPart], { type: "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5e3);
    return null;
  }
  async function pickProject() {
    if (hasFsApi()) {
      try {
        const [handle] = await openPicker({
          types: [{ description: "FSM Studio 项目", accept: { "application/json": [".json"] } }]
        });
        const file = await handle.getFile();
        return { text: await file.text(), handle };
      } catch (e) {
        if (e.name === "AbortError") return null;
      }
    }
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        resolve({ text: await file.text(), handle: null });
      };
      input.click();
    });
  }
  async function saveToHandle(handle, data) {
    const w2 = await handle.createWritable();
    await w2.write(typeof data === "string" ? new Blob([data]) : new Blob([data.slice().buffer]));
    await w2.close();
  }
  var graph = new GraphView($("canvas"), {
    onSelectNode(id) {
      selection = { kind: "node", nodeId: id };
      renderSide();
      updateInspector();
    },
    onSelectLink(nodeId, linkIndex) {
      selection = { kind: "link", nodeId, linkIndex };
      renderSide();
      updateInspector();
    },
    onCreateNodeAt(world) {
      createNode("action", world);
    },
    onSelectionCleared() {
      selection = { kind: "none" };
      renderSide();
      updateInspector();
    },
    onMultiSelect(ids) {
      selection = ids.length > 1 ? { kind: "multi", nodeIds: ids } : ids.length === 1 ? { kind: "node", nodeId: ids[0] } : { kind: "none" };
      renderSide();
      updateInspector();
    },
    onReorderLink(nodeId, linkIndex, dir) {
      reorderLink(nodeId, linkIndex, dir);
    },
    onContextMenu(ctx) {
      if (!model) return;
      if (ctx.kind === "node" && ctx.nodeId !== void 0) {
        openContextMenu(nodeMenuItems(ctx.nodeId, ctx.world, ctx.multiIds), ctx.screen.x, ctx.screen.y);
      } else if (ctx.kind === "link" && ctx.nodeId !== void 0 && ctx.linkIndex !== void 0) {
        const link = model.linksOf(model.nodeById(ctx.nodeId))[ctx.linkIndex];
        const hasCond = link ? model.getNum(link, "mExistCondition") === 1 : false;
        const linkTotal = model.linksOf(model.nodeById(ctx.nodeId)).length;
        openContextMenu([
          ...ctx.linkIndex > 0 ? [{ label: "↑ 上移（更早判定）", action: () => reorderLink(ctx.nodeId, ctx.linkIndex, -1) }] : [],
          ...ctx.linkIndex < linkTotal - 1 ? [{ label: "↓ 下移（更晚判定）", action: () => reorderLink(ctx.nodeId, ctx.linkIndex, 1) }] : [],
          // condition-less links only: create one and edit it inline in the link panel
          ...!hasCond ? [{
            label: "新建组合条件…",
            action: () => {
              model.snapshot();
              const created = model.addCondition();
              model.setField(link, "mExistCondition", 1);
              model.setField(link, "mConditionId", created.index);
              renderAll();
            }
          }] : [],
          { label: "---" },
          {
            label: "删除此链接",
            danger: true,
            action: () => {
              model.snapshot();
              model.deleteLink(model.nodeById(ctx.nodeId), ctx.linkIndex);
              selection = { kind: "node", nodeId: ctx.nodeId };
              renderAll();
            }
          }
        ], ctx.screen.x, ctx.screen.y);
      } else {
        openContextMenu([
          { label: "新建 Action 节点", action: () => createNode("action", ctx.world) },
          { label: "新建 Motion 节点", action: () => createNode("motion", ctx.world) },
          { label: "新建空节点", action: () => createNode("plain", ctx.world) },
          { label: "---" },
          {
            label: "新建条件",
            action: () => {
              model.snapshot();
              const created = model.addCondition();
              selection = { kind: "condition", condIndex: created.index };
              $("tabConds").click();
              renderAll();
            }
          },
          { label: "---" },
          { label: "适应视图", action: () => graph.fit() }
        ], ctx.screen.x, ctx.screen.y);
      }
    }
  });
  function reorderLink(nodeId, linkIndex, dir) {
    const m2 = model;
    if (!m2) return;
    const node = m2.nodeById(nodeId);
    if (!node) return;
    const to = linkIndex + dir;
    if (to < 0 || to >= m2.linksOf(node).length) return;
    m2.snapshot();
    m2.moveLink(node, linkIndex, to);
    if (selection.kind === "link" && selection.nodeId === nodeId) {
      if (selection.linkIndex === linkIndex) selection = { kind: "link", nodeId, linkIndex: to };
      else if (selection.linkIndex === to) selection = { kind: "link", nodeId, linkIndex };
    }
    renderAll();
  }
  function ensureChangeHook() {
    model.onChange = () => renderAll();
  }
  function renderAll() {
    $("fileLabel").textContent = model ? `${model.fileName || "(未保存)"} [${model.format === "binary" ? "fsm" : "xml"}]` : "未打开文件";
    $("dirtyBadge").textContent = model?.dirty ? "● 未保存" : "";
    btn("btnSave").disabled = !model;
    btn("btnSaveAs").disabled = !model;
    btn("btnExportXml").disabled = !model;
    btn("btnProjOpen").disabled = !model;
    btn("btnProjSave").disabled = !model;
    btn("btnUndo").disabled = !model?.canUndo();
    btn("btnRedo").disabled = !model?.canRedo();
    applySearch();
    graph.render();
    renderSide();
    updateInspector();
    renderStatus();
  }
  function updateInspector() {
    renderInspector(
      {
        model,
        selection,
        setSelection: (sel) => {
          selection = sel;
        },
        requestRender: () => renderAll(),
        // live-typing refresh: graph + sidebar + dirty badge only — rebuilding
        // the inspector here would steal focus from the field being typed in
        requestLiveRefresh: () => {
          if (!model) return;
          $("dirtyBadge").textContent = model.dirty ? "● 未保存" : "";
          graph.render();
          renderSide();
        },
        reorderLink,
        selectNode: (id) => {
          graph.selectNode(id);
          selection = { kind: "node", nodeId: id };
          renderSide();
          updateInspector();
        }
      },
      $("inspector")
    );
  }
  function renderStatus() {
    if (!model) {
      $("statusText").textContent = "就绪";
      return;
    }
    const nodes = model.nodes().length;
    const links = model.nodes().reduce((a, nd) => a + model.linksOf(nd).length, 0);
    const problems = model.validate();
    $("statusText").textContent = `节点 ${nodes} · 链接 ${links} · 条件 ${model.conditions().length}` + (problems.length ? ` · ⚠ ${problems.length} 个校验问题` : " · 校验通过");
  }
  function renderSide() {
    const list = $("nodeList");
    list.innerHTML = "";
    const m2 = model;
    if (!m2) return;
    const tab = $("tabNodes").classList.contains("active") ? "nodes" : "conds";
    if (tab === "nodes") {
      const multiSel = selection.kind === "multi" ? new Set(selection.nodeIds) : null;
      for (const nd of m2.nodes()) {
        const id = m2.getNum(nd, "mId");
        const name = m2.str(nd, "mName");
        if (search && !`${id} ${name} ${m2.nodeActionNo(nd) ?? ""}`.toLowerCase().includes(search)) continue;
        const r = document.createElement("div");
        r.className = "nodeRow" + (selection.kind === "node" && selection.nodeId === id || multiSel?.has(id) ? " sel" : "");
        r.innerHTML = `<span class="nid">${id}</span><span class="nname">${escapeHtml2(name) || "<i>未命名</i>"}</span><span class="nact">${m2.nodeActionNo(nd) ?? "·"}</span><span class="ncnt">${m2.linksOf(nd).length}</span>`;
        r.addEventListener("click", () => {
          selection = { kind: "node", nodeId: id };
          graph.selectNode(id);
          graph.centerOn(graph.nodePos(id));
          renderSide();
          updateInspector();
        });
        r.addEventListener("contextmenu", (ev) => {
          ev.preventDefault();
          openContextMenu(nodeMenuItems(id, graph.nodePos(id)), ev.clientX, ev.clientY);
        });
        list.appendChild(r);
      }
    } else {
      const add = document.createElement("div");
      add.className = "nodeRow head";
      add.innerHTML = '<span class="nid">#</span><span class="nname">条件摘要</span><span class="nact">引用</span><span class="ncnt"></span>';
      list.appendChild(add);
      m2.conditions().forEach((c, i) => {
        const summary = m2.conditionSummary(c);
        if (search && summary.toLowerCase().includes(search) === false && String(i).includes(search) === false) return;
        const r = document.createElement("div");
        r.className = "nodeRow" + (selection.kind === "condition" && selection.condIndex === i ? " sel" : "");
        r.innerHTML = `<span class="nid">${i}</span><span class="nname">${escapeHtml2(summary.replace(/^#\d+:\s*/, ""))}</span><span class="nact">${m2.conditionUsage(i)}</span><span class="ncnt"></span>`;
        r.addEventListener("click", () => {
          selection = { kind: "condition", condIndex: i };
          renderSide();
          updateInspector();
        });
        r.addEventListener("contextmenu", (ev) => {
          ev.preventDefault();
          openContextMenu([
            {
              label: `删除条件 #${i}`,
              danger: true,
              action: () => {
                if (!confirm(`删除条件 #${i}？引用它的链接将变为无条件。`)) return;
                model.snapshot();
                model.deleteCondition(i);
                selection = { kind: "none" };
                renderAll();
              }
            }
          ], ev.clientX, ev.clientY);
        });
        list.appendChild(r);
      });
    }
  }
  function applySearch() {
    if (!model || !search) {
      graph.highlightIds.clear();
      return;
    }
    graph.highlightIds.clear();
    for (const nd of model.nodes()) {
      const id = model.getNum(nd, "mId");
      if (`${id} ${model.str(nd, "mName")} ${model.nodeActionNo(nd) ?? ""}`.toLowerCase().includes(search)) {
        graph.highlightIds.add(id);
      }
    }
  }
  async function doOpen() {
    const picked = await pickOpen();
    if (!picked) return;
    const { bytes, name, handle } = picked;
    try {
      if (/\.xml$/i.test(name)) {
        model = FsmModel.fromXml(new TextDecoder("utf-8").decode(bytes), name);
      } else {
        model = FsmModel.fromBinary(bytes, name);
      }
      fileHandle = handle;
      selection = { kind: "none" };
      ensureChangeHook();
      graph.setModel(model);
      graph.autoLayout();
      renderAll();
    } catch (e) {
      alert(`打开失败: ${e.message}`);
    }
  }
  async function doSave(saveAs) {
    if (!model) return;
    const baseName = model.fileName || "untitled.fsm";
    const isXml = model.format === "xml";
    const data = isXml ? model.toXml() : model.toBinary();
    const outName = saveAs || !fileHandle ? baseName.replace(/\.(fsm|xml)$/i, isXml ? ".xml" : ".fsm") : baseName;
    if (fileHandle && !saveAs) {
      await saveToHandle(fileHandle, data);
    } else {
      const handle = await pickSave(outName, isXml ? "xml" : "fsm", data);
      if (handle) {
        fileHandle = handle;
        model.fileName = handle.name;
      }
    }
    model.dirty = false;
    renderAll();
  }
  async function doExportXml() {
    if (!model) return;
    const outName = model.fileName.replace(/\.(fsm|xml)$/i, "") + ".xml";
    await pickSave(outName, "xml", model.toXml());
  }
  var PROJECT_TYPE = "fsm-studio-project";
  function projectJson() {
    const layout = graph.getLayout();
    const proj = {
      type: PROJECT_TYPE,
      version: 1,
      source: model?.fileName ?? "",
      format: model?.format ?? "binary",
      savedAt: (/* @__PURE__ */ new Date()).toISOString(),
      ...layout
    };
    return JSON.stringify(proj, null, 2);
  }
  function applyProject(data) {
    if (!model) return "请先打开 .fsm / .xml 文件";
    const proj = data;
    if (!proj || typeof proj !== "object" || proj.type !== PROJECT_TYPE) return "不是 FSM Studio 项目文件";
    const { matched, total } = graph.applyLayout(proj);
    btn("btnEdgeZ").classList.toggle("active", graph.edgesOnTop);
    localStorage.setItem("fsmstudio.edgesOnTop", graph.edgesOnTop ? "1" : "0");
    renderAll();
    const note = matched < total ? `（项目里有 ${total - matched} 个位置与当前 FSM 不匹配，已跳过）` : "";
    return `项目已应用：${matched} 个节点位置${note}`;
  }
  async function doSaveProject() {
    if (!model) return;
    const base = (model.fileName || "untitled.fsm").replace(/\.(fsm|xml)$/i, "");
    if (projectHandle) {
      try {
        await saveToHandle(projectHandle, projectJson());
        $("statusText").textContent = `项目已保存：${projectHandle.name}`;
        return;
      } catch {
      }
    }
    const handle = await pickSave(base + ".fsmp.json", "json", projectJson());
    if (handle) {
      projectHandle = handle;
      $("statusText").textContent = `项目已保存：${handle.name}`;
    }
  }
  async function doOpenProject() {
    if (!model) return;
    const picked = await pickProject();
    if (!picked) return;
    let data;
    try {
      data = JSON.parse(picked.text);
    } catch (e) {
      alert(`打开项目失败: ${e.message}`);
      return;
    }
    const result = applyProject(data);
    if (picked.handle) projectHandle = picked.handle;
    $("statusText").textContent = result;
  }
  $("btnOpen").addEventListener("click", () => void doOpen());
  $("btnSave").addEventListener("click", () => void doSave(false));
  $("btnSaveAs").addEventListener("click", () => void doSave(true));
  $("btnExportXml").addEventListener("click", () => void doExportXml());
  $("btnProjOpen").addEventListener("click", () => void doOpenProject());
  $("btnProjSave").addEventListener("click", () => void doSaveProject());
  $("btnUndo").addEventListener("click", () => model?.undo());
  $("btnRedo").addEventListener("click", () => model?.redo());
  $("btnLayout").addEventListener("click", () => graph.autoLayout());
  {
    const saved = localStorage.getItem("fsmstudio.edgesOnTop");
    const on = saved === null ? true : saved === "1";
    graph.edgesOnTop = on;
    btn("btnEdgeZ").classList.toggle("active", on);
    requestAnimationFrame(() => graph.setEdgesOnTop(on));
  }
  $("btnEdgeZ").addEventListener("click", () => {
    const on = !graph.edgesOnTop;
    graph.setEdgesOnTop(on);
    btn("btnEdgeZ").classList.toggle("active", on);
    localStorage.setItem("fsmstudio.edgesOnTop", on ? "1" : "0");
  });
  $("btnFit").addEventListener("click", () => graph.fit());
  $("btnNewAction").addEventListener("click", () => createNode("action"));
  $("btnNewMotion").addEventListener("click", () => createNode("motion"));
  $("btnNewPlain").addEventListener("click", () => createNode("plain"));
  $("search").addEventListener("input", () => {
    search = $("search").value.trim().toLowerCase();
    renderAll();
  });
  $("tabNodes").addEventListener("click", () => {
    $("tabNodes").classList.add("active");
    $("tabConds").classList.remove("active");
    renderSide();
  });
  $("tabConds").addEventListener("click", () => {
    $("tabConds").classList.add("active");
    $("tabNodes").classList.remove("active");
    renderSide();
  });
  window.selectRoot = () => {
    selection = { kind: "root" };
    renderSide();
    updateInspector();
  };
  document.addEventListener("keydown", (e) => {
    if (e.target?.tagName === "INPUT" || e.target?.tagName === "SELECT" || e.target?.tagName === "TEXTAREA") {
      if (e.key === "Escape") e.target.blur();
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (e.shiftKey) void doSaveProject();
      else void doSave(false);
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      model?.undo();
      return;
    }
    if (e.ctrlKey && (e.key.toLowerCase() === "y" || e.shiftKey && e.key.toLowerCase() === "z")) {
      e.preventDefault();
      model?.redo();
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "f") {
      e.preventDefault();
      $("search").focus();
      return;
    }
    if ((e.key === "Delete" || e.key === "Backspace") && selection.kind === "multi") {
      e.preventDefault();
      const ids = [...selection.nodeIds];
      if (!confirm(`删除选中的 ${ids.length} 个节点？指向它们的链接也会一并删除。`)) return;
      model?.snapshot();
      for (const id of ids) model?.deleteNode(id);
      selection = { kind: "none" };
      graph.clearSelection();
      renderAll();
      return;
    }
    if (e.key === "f") graph.fit();
    if (e.key === "Escape") {
      selection = { kind: "none" };
      graph.clearSelection();
      renderSide();
      updateInspector();
    }
  });
  document.addEventListener("fsmstudio:zoom", (e) => {
    $("zoomLabel").textContent = `${e.detail}%`;
  });
  var dragDepth = 0;
  var wrap = document.body;
  wrap.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dragDepth++;
    $("dropOverlay").classList.add("show");
  });
  wrap.addEventListener("dragover", (e) => {
    e.preventDefault();
  });
  wrap.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) $("dropOverlay").classList.remove("show");
  });
  wrap.addEventListener("dragend", () => {
    dragDepth = 0;
    $("dropOverlay").classList.remove("show");
  });
  wrap.addEventListener("drop", async (e) => {
    e.preventDefault();
    dragDepth = 0;
    $("dropOverlay").classList.remove("show");
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (/\.json$/i.test(file.name)) {
      try {
        const data = JSON.parse(new TextDecoder("utf-8").decode(bytes));
        const result = applyProject(data);
        $("statusText").textContent = `${file.name}: ${result}`;
      } catch (err) {
        alert(`打开项目失败: ${err.message}`);
      }
      return;
    }
    try {
      if (/\.xml$/i.test(file.name)) model = FsmModel.fromXml(new TextDecoder("utf-8").decode(bytes), file.name);
      else model = FsmModel.fromBinary(bytes, file.name);
      fileHandle = null;
      projectHandle = null;
      selection = { kind: "none" };
      ensureChangeHook();
      graph.setModel(model);
      graph.autoLayout();
      renderAll();
    } catch (err) {
      alert(`打开失败: ${err.message}`);
    }
  });
  window.addEventListener("beforeunload", (e) => {
    if (model?.dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  function setupResizer(handleId, panelId, dir) {
    const handle = document.getElementById(handleId);
    const panel = document.getElementById(panelId);
    if (!handle || !panel) return;
    const key = `fsmstudio.width.${panelId}`;
    const clamp = (w2) => Math.min(620, Math.max(170, w2));
    const saved = localStorage.getItem(key);
    if (saved) panel.style.flexBasis = `${clamp(Number(saved))}px`;
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      try {
        handle.setPointerCapture(e.pointerId);
      } catch {
      }
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      const startX = e.clientX;
      const startW = panel.getBoundingClientRect().width;
      const onMove = (ev) => {
        const delta = dir === "r" ? ev.clientX - startX : startX - ev.clientX;
        panel.style.flexBasis = `${clamp(startW + delta)}px`;
      };
      const onUp = (ev) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        void ev;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        localStorage.setItem(key, String(parseInt(panel.style.flexBasis, 10)));
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
  }
  setupResizer("sbResize", "sidebar", "r");
  setupResizer("inspResize", "inspectorWrap", "l");
  updateInspector();
  renderStatus();
  var w = window;
  w["FSM_STUDIO_GRAPH"] = graph;
  w["FSM_STUDIO_LOAD"] = (name, b64) => {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    try {
      if (/\.xml$/i.test(name)) model = FsmModel.fromXml(new TextDecoder("utf-8").decode(bin), name);
      else model = FsmModel.fromBinary(bin, name);
      fileHandle = null;
      selection = { kind: "none" };
      ensureChangeHook();
      graph.setModel(model);
      graph.autoLayout();
      renderAll();
      return "ok";
    } catch (e) {
      return `error: ${e.message}`;
    }
  };
  w["FSM_STUDIO_STATE"] = () => ({
    open: !!model,
    name: model?.fileName ?? null,
    nodes: model?.nodes().length ?? 0,
    conditions: model?.conditions().length ?? 0,
    links: model ? model.nodes().reduce((a, nd) => a + model.linksOf(nd).length, 0) : 0,
    dirty: model?.dirty ?? false,
    selection: selection.kind,
    validate: model?.validate() ?? []
  });
  w["FSM_STUDIO_SELECT"] = (kind, a, b) => {
    if (kind === "node") {
      selection = { kind: "node", nodeId: a };
      graph.selectNode(a);
    } else if (kind === "link") {
      selection = { kind: "link", nodeId: a, linkIndex: b };
      graph.selectLink(a, b);
    } else if (kind === "cond") selection = { kind: "condition", condIndex: a };
    else if (kind === "root") selection = { kind: "root" };
    renderSide();
    updateInspector();
  };
  w["FSM_STUDIO_EXPORT"] = () => {
    if (!model) return "";
    const bytes = model.format === "xml" ? new TextEncoder().encode(model.toXml()) : model.toBinary();
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s);
  };
  w["FSM_STUDIO_PROJECT"] = {
    json: () => projectJson(),
    apply: (text) => {
      try {
        return applyProject(JSON.parse(text));
      } catch (e) {
        return `error: ${e.message}`;
      }
    }
  };
})();
