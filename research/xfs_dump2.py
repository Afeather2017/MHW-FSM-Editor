import struct, sys
data = open(r"E:\SteamLibrary\steamapps\common\Monster Hunter World\nativePC\hm\wp\wp03\wp03_action.fsm",'rb').read()
def hd(off, n, label):
    print(f"== {label} (0x{off:x}..0x{off+n:x})")
    for i in range(0, n, 16):
        c = data[off+i:off+i+16]
        h = ' '.join(f'{b:02x}' for b in c)
        a = ''.join(chr(b) if 32<=b<127 else '.' for b in c)
        q = struct.unpack('<Q', data[off+i:off+i+8])[0] if len(c)>=8 else 0
        print(f"  {off+i:06x}: {h:<48} |{a}|   q={q:#x}")
hd(0x60, 0x50, "T-table tail + after")
hd(0x260, 0xA0, "T[1]=0x268 region")
hd(0x1280, 0x90, "strings start")
hd(0xE00, 0x90, "T[12]=0xE08 region")
