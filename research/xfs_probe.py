import struct, sys

path = sys.argv[1]
data = open(path, 'rb').read()
print(f"file size: {len(data)} (0x{len(data):x})")
sig = data[0:4]
ver, typ = struct.unpack_from('<HH', data, 4)
print(f"sig={sig} ver=0x{ver:04x} type=0x{typ:04x}")
u64_8, = struct.unpack_from('<Q', data, 8)
print(f"u64@8 = {u64_8}")
cnt, ln = struct.unpack_from('<II', data, 0x10)
print(f"u32@0x10 (count?) = {cnt}, u32@0x14 (len?) = {ln} (0x{ln:x})")
# dump first 12 u64 after 0x18
offs = struct.unpack_from('<12Q', data, 0x18)
for i,o in enumerate(offs): print(f"  off[{i}] = 0x{o:x}")
print()
# per script: defs at 0x18: each ClassDefinition = ptr u64 (queued), then members...
# Try: read count = 15 defs starting 0x18? dump raw qwords 0x18..0xB0 done above.
# Let's look at what's at 0x1518 (the len? region) and around first offsets
def hexdump(off, n=64):
    for i in range(0, n, 16):
        chunk = data[off+i:off+i+16]
        hexs = ' '.join(f'{b:02x}' for b in chunk)
        ascii_ = ''.join(chr(b) if 32<=b<127 else '.' for b in chunk)
        print(f"  {off+i:06x}: {hexs:<48} {ascii_}")

for o in [0x78, 0x268, 0x1518]:
    print(f"== 0x{o:x}:")
    hexdump(o, 64)
