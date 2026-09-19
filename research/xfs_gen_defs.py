# Verify that the class-definition block of an XFS file can be regenerated
# from the hardcoded def table alone (needed for XML -> binary conversion).
import struct
import json

import xfs_parse as X

path = r"E:\SteamLibrary\steamapps\common\Monster Hunter World\nativePC\hm\wp\wp03\wp03_action.fsm"
orig = open(path, "rb").read()
x = X.XFS(orig)
inst_base = 0x18 + x.block_len

table = []
for dfn in x.defs:
    table.append({
        "hash": dfn["hash"],
        "members": [
            {"name": m["name"], "type": m["type"], "flags": m["unk"], "size": m["size"]}
            for m in dfn["members"]
        ],
    })

DIRN = len(table)
pos = DIRN * 8  # block-relative; directory ends where first def hash starts
dir_vals = []
hash_off = []
for dfn in table:
    dir_vals.append(pos)
    hash_off.append(pos)
    pos += 16 + 0x50 * len(dfn["members"])

str_off = {}
blob = bytearray()
for dfn in table:
    for m in dfn["members"]:
        if m["name"] and m["name"] not in str_off:
            str_off[m["name"]] = pos + len(blob)
            blob += m["name"].encode("utf-8") + bytes([0])

block = bytearray(pos)
struct.pack_into("<%dQ" % DIRN, block, 0, *dir_vals)
for i, dfn in enumerate(table):
    hp = hash_off[i]
    struct.pack_into("<QQ", block, hp, dfn["hash"], len(dfn["members"]))
    mp = hp + 16
    for m in dfn["members"]:
        nptr = str_off[m["name"]] if m["name"] else 0
        struct.pack_into("<Q", block, mp, nptr)
        block[mp + 8] = m["type"]
        block[mp + 9] = m["flags"]
        block[mp + 10] = m["size"]
        mp += 0x50
block += blob
block += bytes((-len(block)) % 8)

orig_block = orig[0x18:inst_base]
print("gen", len(block), "vs orig", len(orig_block))
print("DEFS BLOCK BYTE-IDENTICAL:", bytes(block) == orig_block)
json.dump(table, open("def_table.json", "w", encoding="utf-8"), indent=1)
print("def table saved,", len(table), "classes")
