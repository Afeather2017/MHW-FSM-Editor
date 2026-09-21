# FSM Studio — MHW 状态机编辑器（浏览器版 XFsm）

用浏览器直接编辑《怪物猎人：世界》的 `.fsm` 状态机文件，替代"必须开游戏才能用 XFsm 编辑"的流程。
TypeScript 实现，零运行时依赖，构建产物是单个静态 `dist/app.js`。

## 快速开始

```powershell
cd E:\MHW-arts\FSM-Studio
$env:Path = "E:\MHW-arts\node-v24.21.0-win-x64;$env:Path"
npm install          # 首次
npm run build        # 类型检查 + 打包 + 28 项格式测试
npm start            # http://localhost:8123
```

也可以直接双击 `index.html`（file:// 下 File System Access API 不可用时自动退化为"选择文件+下载保存"）。

## 工作流

1. **打开**：`.fsm`（二进制）或 `.xml`（XFsm 导出的 MtSerializer XML）都可以直接打开。
2. **图视图交互**：中键拖动 = 平移；滚轮 = 缩放；左键 = 选择（拖动节点改位置）；
   **左键从空白处拖动 = 框选**，框住的卡片全部选中，拖动其中任一张即可整体移动（Ctrl/Shift+点击可增减选区，Delete 删除全部选中节点）；右键 = 上下文菜单
   （新建 Action/Motion/空节点、添加链接到…、删除节点/链接、上移/下移链接、新建条件）。
   "边在顶层"开关控制连线画在卡片上方还是下方（默认顶层，避免看漏条件）。
3. **节点卡片**：彩色头（mColorType）+ 三列内容，尺寸随内容自适应：
   左列入边（来源节点+条件，可点击跳到该链接）、中列（▶初始 / act / mot / #id）、右列出边一行一条
   （链接名 + 条件标签，全部显示不折叠）。行级锚点：出边从所在行的右缘出发，入边接到目标卡对应行的左缘。
   **悬停出边行会在卡右侧浮现 ↑/↓ 手柄，点击即与相邻行交换顺序**。
4. **链接顺序 = 游戏判定优先级**：游戏从上到下逐条判定出链接，先匹配条件的那条生效。
   例如组合键 `R+○`（组合 1）必须排在 `R`（组合 2）上面，否则 `R` 会先吃掉输入、组合 1 永远触发不了。
   三处均可调整顺序：卡片行悬停 ↑/↓、链接右键菜单"上移/下移"、检查器里每条链接的 ↑/↓ 按钮。
5. **编辑**：
   - 侧栏两个页签列出全部节点与条件，支持搜索；侧栏/检查器宽度可拖拽调整（自动记忆）；
   - 检查器编辑节点（名称 / ActionNo / MotionNo+Phase / 颜色 / mSetting / 全局条件转换…）、
     链接（目标 / 条件 / 名称 / 顺序 ↑↓ / ＋新建组合条件）、条件；
   - 框选多个节点时检查器显示所选汇总，支持一键批量删除；
   - 条件编辑器提供"条件组合（列表）"：AND/OR + 变量行增删排序（如 `R` + `三角形` 组合），
     完整树视图支持嵌套逻辑组与全部节点类型字段；
   - `＋Action` / `＋Motion` / `＋空节点` 创建的节点分别带 `Action_W03` / `LinkMotion_W03` 流程（与 XFsm 一致）。
6. **保存**：`保存`/`另存为` 写回 `.fsm`（游戏可直接加载的二进制）；`导出 XML` 生成与 XFsm 导出同构的 XML。
   没有句柄时退化为浏览器下载。
7. 部署与以前一样：拷到 `nativePC/hm/wp/wp03/wp03_action.fsm`（或用现有 deploy 脚本）。

## 验证情况

- XFS 二进制：部署版 + vanilla 两个游戏写出的样本**字节级往返一致**（含类定义块从零再生）。
- 解析精确消费到 EOF；实例计数（头部 u64=实例总数）与序号规律 `id=defIdx*2+1 / var=顺序号` 全部对上。
- XML：`parse(write(parse))` 结构等价；输出样式与 XFsm 导出一致（节点/链接 mName 在最后、根省略 mLastEditType、
  EnumProp 补空 mName/mEnumName）。
- 编辑（增删节点/链接/条件、链接排序、ActionNo 设置、条件删除的引用重映射、undo）全部有回归测试：`npm test`。

```powershell
npm test             # 40 项断言，读真实样本文件（找不到游戏目录时自动用仓库内 fsm/ 样本）
```

## 格式备忘（XFS `.fsm`）

```
0x00 "XFS\0" | u16 0x13 | u16 0x0E05 | u64 实例总数
0x10 u32 defCount | u32 defsBlockLen
0x18 类定义块: defCount×u64(块内偏移) + 紧密排列的记录{hash,成员数,成员×0x50{namePtr,类型,flags,size,69×0}} + 成员名C字符串 + 8字节对齐
实例区: ClassEntry{u16 id=defIdx*2+1, u16 var=顺序号, u64 size=8+len, 成员×{u32 count, 值}}
        空引用 = {u16 0xFFFE, u16 0}；类型码: 1/2=类, 3=bool, 6=u32, 10=s32, 12=f32, 14=C字符串…
```

源码：`src/xfs.ts`（二进制读写）、`src/fsmxml.ts`（XML）、`src/model.ts`（编辑层）、
`src/deftable.ts`（15 个内建类定义，flags 字节与游戏写出一致）。
`research/` 保留格式破解期的 Python 验证脚本；格式参考 [Strackeror/MHW-Fsm](https://github.com/Strackeror/MHW-Fsm)。

## 已知限制

- 写出采用**规范形**（var 顺序号重排、实例计数重算）。游戏写出的文件本来就是规范形（两个样本字节级验证），
  只有别的工具产出的非规范文件重排后会与原字节不同——游戏加载不受影响。
- 打开**未知类**的 FSM（如任务 FSM）时按 XML/二进制结构合成定义；保存二进制时此类定义的 hash/flags 可能与
  游戏期望不符（武器/玩家 FSM 的全部 15 个类都是已知的，不受影响）。界面会在 warnings 里提示。
- `mUIPos` 编码未知，原样保留；编辑器内坐标是自己的布局，不回写。
- XML 保存为 XFsm 同构形状；EnumProp 的 mName/mEnumName 两个非语义字段按 XFsm 惯例补空串。
- 保存没有自动 .bak（File System Access API 拿不到父目录）；重要文件请先备份或用 git。
