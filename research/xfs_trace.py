import struct, sys
path = r"E:\SteamLibrary\steamapps\common\Monster Hunter World\nativePC\hm\wp\wp03\wp03_action.fsm"
data = open(path,'rb').read()
print("last 48 bytes:", ' '.join(f'{b:02x}' for b in data[-48:]))
print("len:", len(data), "hex:", hex(len(data)))
