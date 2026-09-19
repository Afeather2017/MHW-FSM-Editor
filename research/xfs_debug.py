import struct, sys

path = r"E:\SteamLibrary\steamapps\common\Monster Hunter World\nativePC\hm\wp\wp03\wp03_action.fsm"
data = open(path,'rb').read()

cnt = struct.unpack_from('<I', data, 0x10)[0]
print("def count:", cnt)
base = 0x18
slots = [struct.unpack_from('<Q', data, base+8*i)[0] for i in range(min(cnt,20))]
print("slots:", [hex(s) for s in slots])

for i, s in enumerate(slots[:4]):
    h, = struct.unpack_from('<Q', data, s)
    c64, = struct.unpack_from('<Q', data, s+8)
    c32, = struct.unpack_from('<I', data, s+8)
    print(f"@0x{s:x}: u64@+0=0x{h:x}  u64@+8={c64} u32@+8={c32}")

# What if slots are not pointers but the layout is sequential bodies starting 0x18?
# Print structured guess: hash u64, then u64 count, then members of (name-ptr u64, type u8, unkn u8, size u8, 69 bytes)
print("\n=== sequential-body hypothesis from 0x78 (first plausible body) ===")
def dump_body(off):
    h, = struct.unpack_from('<Q', data, off)
    n, = struct.unpack_from('<Q', data, off+8)
    print(f"@0x{off:x} hash=0x{h:x} n={n}")
    p = off+16
    for i in range(min(n,8)):
        nameptr, t, u, sz = struct.unpack_from('<QBBB', data, p)
        print(f"   member{i} @0x{p:x} nameptr=0x{nameptr:x} type={t} unkn={u} size={sz}")
        p += 8+3+69
    return p
dump_body(0x78)
