import struct, sys, re
path = sys.argv[1] if len(sys.argv)>1 else r"E:\SteamLibrary\steamapps\common\Monster Hunter World\nativePC\hm\wp\wp03\wp03_action.fsm"
data = open(path,'rb').read()
N=len(data)
print(f"size {N} (0x{N:x})")

# 1) non-zero spans (coarse, 16-byte granularity)
spans=[]; cur=None
for off in range(0, N, 16):
    nz = any(b!=0 for b in data[off:off+16])
    if nz and cur is None: cur=off
    if not nz and cur is not None: spans.append((cur,off)); cur=None
if cur is not None: spans.append((cur,N))
print("== non-zero spans (16B granularity), spans>32B ==")
for a,b in spans:
    if b-a>32 or a<0x100: print(f"  0x{a:06x} - 0x{b:06x}  ({b-a} bytes)")
    else: print(f"  0x{a:06x} - 0x{b:06x}  ({b-a} bytes)")

# 2) ascii strings >=5
print("== ascii strings (first 40) ==")
cnt=0
for m in re.finditer(rb'[\x20-\x7e]{5,}', data):
    s=m.group().decode()
    print(f"  0x{m.start():06x}: {s!r}")
    cnt+=1
    if cnt>=40: break

# 3) utf8 CJK strings
print("== utf8 CJK strings (first 15) ==")
cnt=0
for m in re.finditer(rb'(?:[\xe4-\xe9][\x80-\xbf][\x80-\xbf]){2,}', data):
    try: s=m.group().decode('utf-8')
    except: continue
    print(f"  0x{m.start():06x}: {s}")
    cnt+=1
    if cnt>=15: break
