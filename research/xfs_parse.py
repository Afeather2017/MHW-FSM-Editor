import struct, json, sys

def cstr_at(data, off):
    e = data.index(b'\0', off)
    return data[off:e].decode('utf-8')

class XFS:
    def __init__(self, data):
        self.data = data
        d = data
        self.sig = d[0:4]
        self.v1, self.v2 = struct.unpack_from('<HH', d, 4)
        self.q8, = struct.unpack_from('<Q', d, 8)
        self.def_count, self.block_len = struct.unpack_from('<II', d, 0x10)
        self.defs_base = 0x18
        self.dir = struct.unpack_from(f'<{self.def_count}Q', d, self.defs_base)
        self.defs = self.parse_defs()
        self.inst_base = self.defs_base + self.block_len
        self.pos = self.inst_base
        self.root = self.parse_class_entry()
        self.eof = self.pos == len(d)

    def parse_defs(self):
        d = self.data; defs = []
        for off in self.dir:
            p = off + 0x18
            hash_, count = struct.unpack_from('<QQ', d, p)
            p += 16
            members = []
            for i in range(count):
                nptr, = struct.unpack_from('<Q', d, p)
                t, unk, sz = struct.unpack_from('<BBB', d, p+8)
                name = cstr_at(d, self.defs_base + nptr) if nptr else None
                members.append({'name': name, 'type': t, 'unk': unk, 'size': sz})
                p += 0x50
            defs.append({'hash': hash_, 'off': off, 'members': members})
        return defs

    def u8(self):
        v = self.data[self.pos]; self.pos += 1; return v
    def u16(self):
        v, = struct.unpack_from('<H', self.data, self.pos); self.pos += 2; return v
    def u32(self):
        v, = struct.unpack_from('<I', self.data, self.pos); self.pos += 4; return v
    def u64(self):
        v, = struct.unpack_from('<Q', self.data, self.pos); self.pos += 8; return v

    def parse_class_entry(self):
        class_id = self.u16()
        var = self.u16()
        if class_id in (0xFFFE, 0xFFFF):
            return {'__null__': True, '__id__': class_id}
        body_size = self.u64()
        def_idx = class_id // 2
        if def_idx >= len(self.defs):
            raise ValueError(f"class id {class_id} out of range at 0x{self.pos:x}")
        obj = self.parse_members(self.defs[def_idx])
        return {'__class__': def_idx, '__id__': class_id, '__var__': var, **obj}

    def parse_members(self, dfn):
        obj = {}
        for m in dfn['members']:
            n = m['name']; t = m['type']
            cnt = self.u32()
            vals = []
            for _ in range(cnt):
                vals.append(self.parse_value(t))
            obj[n] = vals[0] if cnt == 1 else (vals if cnt else None)
        return obj

    def parse_value(self, t):
        if t in (1, 2):
            return self.parse_class_entry()
        if t == 14:
            e = self.data.index(b'\0', self.pos)
            s = self.data[self.pos:e].decode('utf-8'); self.pos = e + 1
            return s
        if t == 15:
            v = list(self.data[self.pos:self.pos+4]); self.pos += 4; return v
        if t == 16:
            return self.u64()
        if t in (20, 21, 22):
            n = 3 if t == 20 else 4
            v = struct.unpack_from(f'<{n}f', self.data, self.pos); self.pos += 4*n
            return list(v)
        SCALARS = {3:'B',4:'B',5:'H',6:'I',7:'Q',8:'b',9:'h',10:'i',11:'q',12:'f',13:'d'}
        if t in SCALARS:
            f = SCALARS[t]; sz = struct.calcsize('<'+f)
            v, = struct.unpack_from('<'+f, self.data, self.pos); self.pos += sz
            return v
        raise ValueError(f"unknown type {t}")

if __name__ == '__main__':
    path = sys.argv[1]
    x = XFS(open(path,'rb').read())
    print(f"v1=0x{self_v1:x}" if False else f"v1=0x{x.v1:x} v2=0x{x.v2:x} q8={x.q8}")
    print(f"inst_base=0x{x.inst_base:x}  consumed to EOF: {x.eof}")
    for i, dfn in enumerate(x.defs):
        ms = ', '.join(f"{m['name']}:{m['type']}" for m in dfn['members'])
        print(f"def[{i}] hash=0x{dfn['hash']:x} off=0x{dfn['off']:x} members: {ms}")
    r = x.root
    print("\nroot class def:", r['__class__'], "top keys:", [k for k in r.keys()][:10])
    print("mQuality:", r['mQuality'], " mOwnerObjectName:", r['mOwnerObjectName'], " mFSMAttribute:", r.get('mFSMAttribute'))
    rc = r['mpRootCluster']
    print("rootCluster class:", rc['__class__'], "node count:", len(rc['mpNodeList']))
    n0 = rc['mpNodeList'][0] if isinstance(rc['mpNodeList'], list) else rc['mpNodeList']
    print("node0:", json.dumps({k: v for k, v in n0.items() if k != 'mpLinkList'}, ensure_ascii=False, default=str)[:400])
    json.dump(x.root, open(path + '.xfs.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=str)
