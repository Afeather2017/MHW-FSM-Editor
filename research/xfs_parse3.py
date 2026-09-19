import xfs_parse as X
import struct, sys

log = []
orig = X.XFS.parse_members
def traced_members(self, dfn):
    obj = {}
    for m in dfn['members']:
        save = self.pos
        cnt = self.u32()
        vals = []
        try:
            for _ in range(cnt):
                vals.append(self.parse_value(m['type']))
        except Exception as e:
            log.append(f"FAIL member {m['name']} type={m['type']} cnt={cnt} @0x{save:x}")
            raise
        if cnt not in (1,):
            log.append(f"member {m['name']} cnt={cnt} @0x{save:x}")
        obj[m['name']] = vals[0] if cnt == 1 else (vals if cnt else None)
    return obj
X.XFS.parse_members = traced_members

def traced_entry(self):
    save = self.pos
    cid = self.u32(); var = self.u16(); bsz = self.u64()
    log.append(f"ENTRY @0x{save:x} id={cid} def={cid//2}")
    obj = traced_members(self, self.defs[cid//2])
    return {'__class__': cid//2, '__id__': cid, **obj}
X.XFS.parse_class_entry = traced_entry

path = sys.argv[1]
try:
    x = X.XFS(open(path,'rb').read())
    print("OK pos:", hex(x.pos))
except Exception as e:
    print("FAILED:", e)
    for l in log[-12:]: print(" ", l)
