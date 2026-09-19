// MT Framework DTI value type codes as embedded in XFS files.
export const enum MtType {
  None = 0,
  Class = 1,      // inline class instance
  ClassRef = 2,   // class reference (inline instance; 0xFFFE marker = null)
  Bool = 3,
  U8 = 4,
  U16 = 5,
  U32 = 6,
  U64 = 7,
  S8 = 8,
  S16 = 9,
  S32 = 10,
  S64 = 11,
  F32 = 12,
  F64 = 13,
  String = 14,    // NUL-terminated UTF-8
  RGBA = 15,
  Ptr = 16,       // raw u64 file offset (unparsed)
  Vec3 = 20,
  Vec4 = 21,
  Quat = 22,
}

export interface DefMember {
  name: string;
  type: MtType;
  flags: number; // byte copied verbatim from the file's def record
  size: number;  // byte copied verbatim from the file's def record
}

export interface ClassDef {
  name: string;
  hash: number;  // DTI class-name hash (game-specific, not CRC32; use table below)
  members: DefMember[];
}

const m = (name: string, type: MtType, flags = 0, size = 0): DefMember => ({ name, type, flags, size });

// Class definitions observed in MHW weapon/player FSM files (wp03 etc.).
// hashes + flags/sizes are byte-verified against game-written binaries.
export const BUILTIN_DEFS: ClassDef[] = [
  {
    name: 'rAIFSM', hash: 0x66b45610,
    members: [
      m('mQuality', MtType.U32, 145, 4),
      m('mOwnerObjectName', MtType.String, 0, 8),
      m('mpRootCluster', MtType.ClassRef, 0, 8),
      m('mpConditionTree', MtType.ClassRef, 0, 8),
      m('mFSMAttribute', MtType.U32, 0, 4),
      m('mLastEditType', MtType.U32, 0, 4),
    ],
  },
  {
    name: 'cAIFSMCluster', hash: 0x18868106,
    members: [
      m('mId', MtType.U32, 0, 4),
      m('mOwnerNodeUniqueId', MtType.U32, 0, 4),
      m('mInitialStateId', MtType.U32, 0, 4),
      m('mpNodeList', MtType.ClassRef, 160, 8),
    ],
  },
  {
    name: 'cAIFSMNode', hash: 0x5035d8fd,
    members: [
      m('mName', MtType.String, 0, 8),
      m('mId', MtType.U32, 0, 4),
      m('mUniqueId', MtType.U32, 0, 4),
      m('mOwnerId', MtType.U32, 0, 4),
      m('mpSubCluster', MtType.ClassRef, 0, 8),
      m('mpLinkList', MtType.ClassRef, 160, 8),
      m('mpProcessList', MtType.ClassRef, 160, 8),
      m('mUIPos', MtType.U32, 0, 4),
      m('mColorType', MtType.U8, 0, 1),
      m('mSetting', MtType.U32, 0, 4),
      m('mUserAttribute', MtType.U32, 0, 4),
      m('mExistConditionTrainsitionFromAll', MtType.Bool, 0, 1),
      m('mConditionTrainsitionFromAllId', MtType.U32, 0, 4),
    ],
  },
  {
    name: 'cAIFSMLink', hash: 0x63e6a949,
    members: [
      m('mName', MtType.String, 0, 8),
      m('mDestinationNodeId', MtType.U32, 0, 4),
      m('mExistCondition', MtType.Bool, 0, 1),
      m('mConditionId', MtType.U32, 0, 4),
    ],
  },
  {
    name: 'cAIFSMNodeProcess', hash: 0x609db540,
    members: [
      m('mContainerName', MtType.String, 0, 8),
      m('mCategoryName', MtType.String, 0, 8),
      m('mpParameter', MtType.ClassRef, 0, 8),
    ],
  },
  {
    name: 'nPlFSM::ActionSet_W03', hash: 0x4e5f1d2f,
    members: [m('ActionNo', MtType.Class, 4, 8)],
  },
  {
    name: 'MtEnum', hash: 0x7e61df92,
    members: [m('EnumValue', MtType.S32, 128, 4)],
  },
  {
    name: 'nPlFSM::LinkMotion_W03', hash: 0x19b8aa01,
    members: [
      m('MotionNo', MtType.S32, 0, 4),
      m('MotionNo_Phase1', MtType.S32, 0, 4),
    ],
  },
  {
    name: 'rAIConditionTree', hash: 0x785e6622,
    members: [
      m('mQuality', MtType.U32, 145, 4),
      m('mpTreeList', MtType.ClassRef, 160, 8),
    ],
  },
  {
    name: 'rAIConditionTree::TreeInfo', hash: 0x56bb1759,
    members: [
      m('mName', MtType.Class, 0, 8),
      m('mpRootNode', MtType.ClassRef, 0, 8),
    ],
  },
  {
    name: 'cAIDEnum', hash: 0x2c29825d,
    members: [m('mId', MtType.U32, 0, 4)],
  },
  {
    name: 'rAIConditionTree::OperationNode', hash: 0x1c328079,
    members: [
      m('mpChildList', MtType.ClassRef, 160, 8),
      m('mOperator', MtType.U32, 0, 4),
    ],
  },
  {
    name: 'rAIConditionTree::VariableNode', hash: 0x3d9510a8,
    members: [
      m('mpChildList', MtType.ClassRef, 160, 8),
      m('mVariable', MtType.Class, 0, 8),
      m('mIsBitNo', MtType.Bool, 0, 1),
      m('mIsArray', MtType.Bool, 0, 1),
      m('mIsDynamicIndex', MtType.Bool, 0, 1),
      m('mIndex', MtType.U32, 0, 4),
      m('mIndexVariable', MtType.Class, 0, 8),
      m('mUseEnumIndex', MtType.Bool, 0, 1),
      m('mIndexEnum', MtType.Class, 0, 8),
    ],
  },
  {
    name: 'rAIConditionTree::VariableNode::VariableInfo', hash: 0x3e1f9629,
    members: [
      m('mPropertyName', MtType.String, 0, 8),
      m('mOwnerName', MtType.String, 0, 8),
      m('mIsSingletonOwner', MtType.Bool, 0, 1),
    ],
  },
  {
    name: 'nAI::EnumProp', hash: 0x68328aac,
    members: [
      m('mNameCRC', MtType.U32, 1, 4),
      m('mEnumNameCRC', MtType.U32, 1, 4),
    ],
  },
];

// ActionSet class names differ per weapon FSM (nPlFSM::ActionSet_Wxx); add
// mappings as they are encountered. The hash is what the binary stores, so
// unknown names degrade gracefully to ActionSet(0xHASH) labels.
export const HASH_TO_NAME: Record<number, string> = {};
export const NAME_TO_HASH: Record<string, number> = {};
for (const d of BUILTIN_DEFS) {
  HASH_TO_NAME[d.hash] = d.name;
  NAME_TO_HASH[d.name] = d.hash;
}
// extra weapon param classes seen in the wild
for (const w of ['W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07', 'W08', 'W09', 'W10', 'W11', 'W12', 'W13', 'W14']) {
  const set = `nPlFSM::ActionSet_${w}`;
  const motion = `nPlFSM::LinkMotion_${w}`;
  NAME_TO_HASH[set] = NAME_TO_HASH[set] ?? 0; // hashes unknown unless seen in a binary
  NAME_TO_HASH[motion] = NAME_TO_HASH[motion] ?? 0;
}

export function defIndexByHash(defs: ClassDef[], hash: number): number {
  return defs.findIndex((d) => d.hash === hash);
}
export function defIndexByName(defs: ClassDef[], name: string): number {
  return defs.findIndex((d) => d.name === name);
}
export function defName(defs: ClassDef[], idx: number, fallback = true): string {
  const d = defs[idx];
  if (d) return d.name;
  return fallback ? `<class ${idx}>` : '';
}
