import xfs_parse as X
path = r"E:\SteamLibrary\steamapps\common\Monster Hunter World\nativePC\hm\wp\wp03\wp03_action.fsm"
x = X.XFS(open(path,'rb').read())

# collect var ordinals
vars_ = []
def walk(o):
    if isinstance(o, dict):
        if '__var__' in o: vars_.append(o['__var__'])
        for v in o.values(): walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
walk(x.root)
print(f"entries with var: {len(vars_)}, min={min(vars_)}, max={max(vars_)}, q8={x.q8}")
print("sequential:", vars_ == list(range(len(vars_))))
# null markers
nulls = []
def walk2(o):
    if isinstance(o, dict):
        if o.get('__null__'): nulls.append(o['__id__'])
        for v in o.values(): walk2(v)
    elif isinstance(o, list):
        for v in o: walk2(v)
walk2(x.root)
print("null markers:", {v: nulls.count(v) for v in set(nulls)})
# node/link/cond counts
rc = x.root['mpRootCluster']
nodes = rc['mpNodeList']
print("nodes:", len(nodes), "conditions:", len(x.root['mpConditionTree']['mpTreeList']))
