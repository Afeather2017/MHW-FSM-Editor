# tracing version: patch parse_members to log progress
import xfs_parse as X
import struct, sys

TRACE = True
orig_members = X.XFS.parse_members
def traced_members(self, dfn):
    obj = {}
    for m in dfn['members']:
        save = self.pos
        try:
            cnt = self.u32()
        except Exception as e:
            print(f"  ERR reading count at 0x{save:x}"); raise
        if TRACE and cnt > 40 or (cnt == 0):
            pass
        vals = []
        try:
            for _ in range(cnt):
                vals.append(self.parse_value(m['type']))
        except Exception as e:
            print(f"  FAIL member {m['name']} type={m['type']} cnt={cnt} @0x{save:x}: {e}")
            raise
        obj[m['name']] = vals[0] if cnt == 1 else (vals if cnt else None)
    return obj
X.XFS.parse_members = traced_members
X.XFS.parse_class_entry_orig = X.XFS.parse_class_entry
def traced_entry(self):
    save = self.pos
    cid = self.u32()
    var = self.u16()
    bsz = self.u64()
    print(f"ENTRY @0x{save:x} id={cid} def={cid//2} var={var} size={bsz}")
    def_idx = cid // 2
    obj = traced_members(self, self.defs[def_idx])
    return {'__class__': def_idx, '__id__': cid, **obj}
X.XFS.parse_class_entry = traced_entry

path = sys.argv[1]
x = X.XFS(open(path,'rb').read())
print("OK parsed to EOF:", x.pos == len(open(path,'rb').read().__len__() and len(open(path,'rb').read())) or x.pos)
