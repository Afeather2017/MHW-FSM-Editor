import struct

class XFSWriter:
    """Re-serialize a parsed XFS tree. defs block is copied verbatim from source."""
    def __init__(self, xfs, original_data):
        self.x = xfs
        self.orig = original_data
        self.defs = xfs.defs
        self.buf = bytearray()
        self.ordinal = 0

    def u8(self, v): self.buf += struct.pack('<B', v)
    def u16(self, v): self.buf += struct.pack('<H', v)
    def u32(self, v): self.buf += struct.pack('<I', v)
    def u64(self, v): self.buf += struct.pack('<Q', v)
    def f32(self, v): self.buf += struct.pack('<f', v)
    def f64(self, v): self.buf += struct.pack('<d', v)
    def cstr(self, s):
        self.buf += s.encode('utf-8') + b'\0'

    def build(self):
        x = self.x
        # header (q8 patched after)
        self.buf = bytearray()
        self.buf += x.sig
        self.u16(x.v1); self.u16(x.v2)
        self.q8_pos = len(self.buf)
        self.u64(0)  # placeholder
        self.u32(x.def_count); self.u32(x.block_len)
        # defs block verbatim
        inst_base = 0x18 + x.block_len
        self.buf += self.orig[0x18:inst_base]
        # root entry (always a class, not null)
        self.write_entry(x.root)
        # patch q8
        struct.pack_into('<Q', self.buf, self.q8_pos, self.ordinal)
        return bytes(self.buf)

    def write_entry(self, obj):
        if obj.get('__null__'):
            self.u16(obj['__id__']); self.u16(0)
            return
        var = self.ordinal; self.ordinal += 1
        # body first into temp to know size
        saved = self.buf
        self.buf = bytearray()
        self.write_members(obj)
        body = bytes(self.buf)
        self.buf = saved
        self.u16(obj['__class__'] * 2 + 1); self.u16(var)
        self.u64(len(body) + 8)
        self.buf += body

    def write_members(self, obj):
        dfn = self.defs[obj['__class__']]
        for m in dfn['members']:
            n, t = m['name'], m['type']
            v = obj.get(n)
            if v is None:
                self.u32(0)
            elif isinstance(v, list) and t in (1, 2):
                self.u32(len(v))
                for e in v: self.write_value(t, e)
            elif t in (1, 2):
                self.u32(1); self.write_value(t, v)
            else:
                if isinstance(v, list):
                    self.u32(len(v))
                    for e in v: self.write_scalar(t, e)
                else:
                    self.u32(1); self.write_scalar(t, v)

    def write_value(self, t, v):
        # class entry (inline or ref, types 1/2)
        self.write_entry(v)

    def write_scalar(self, t, v):
        if t == 14: self.cstr(v); return
        if t == 3: self.u8(1 if v else 0); return
        if t == 4: self.u8(v); return
        if t == 5: self.u16(v); return
        if t == 6: self.u32(v); return
        if t == 7: self.u64(v); return
        if t == 8: self.u8(v & 0xFF if v < 0 else v); return
        if t == 9: self.u16(v & 0xFFFF); return
        if t == 10: self.u32(v & 0xFFFFFFFF); return
        if t == 11: self.u64(v & 0xFFFFFFFFFFFFFFFF); return
        if t == 12: self.f32(v); return
        if t == 13: self.f64(v); return
        if t == 15:
            for b in v: self.u8(b)
            return
        if t == 16: self.u64(v); return
        if t in (20, 21, 22):
            for f in v: self.f32(f)
            return
        raise ValueError(f"unknown type {t}")

if __name__ == '__main__':
    import sys, xfs_parse as X
    path = sys.argv[1]
    orig = open(path,'rb').read()
    x = X.XFS(orig)
    out = XFSWriter(x, orig).build()
    print(f"orig {len(orig)} bytes, rebuilt {len(out)} bytes")
    if out == orig:
        print("BYTE-IDENTICAL ROUND-TRIP ✓")
    else:
        # find first diff
        n = min(len(out), len(orig))
        for i in range(n):
            if out[i] != orig[i]:
                print(f"first diff @0x{i:x}: orig {orig[i:i+16].hex()} vs new {out[i:i+16].hex()}")
                break
        open(path + '.rebuilt', 'wb').write(out)
