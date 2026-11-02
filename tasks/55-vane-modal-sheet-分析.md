# 55 · vane-modal-sheet 分析

> 按 vane-package-builder 标准流程（P1→P2→P3）。user 已拍板方向：参照 [react-modal-sheet](https://github.com/Temzasse/react-modal-sheet) 的能力面（snap points / 拖拽 / detent / 键盘避让），但**全面 vane 化**为插件家族。
> 已纠偏两点：① 命名为 `vane-modal-sheet`（modal 非 model）；② react-modal-sheet 依赖 `motion`（原 framer-motion）作 peer，与 vane「peer 只有 react/react-dom + plugin-core」铁律冲突 → **零第三方运行时依赖**，原生 Pointer Events + CSS transform + rAF 补间。
> 插件规模：**实际交付 21 个**（A 视觉 7 + B 行为 9 + C 反馈 5）；D 领域 5 与 E 跨包组合 6 为**未交付候选**。

## 1. 目标与边界

- 做一个**插件式 React 底部弹层组件**：内核（ModalSheetCore）独占 snap 状态机 + 拖拽几何，视觉/行为/领域语义全交插件。
- **三层分离（本包架构核心）**：
  1. **Core = 几何唯一决策者**（对标 waterfall）：持有 snap 状态机、Pointer Events 拖拽引擎、`resolveSnap` 纯函数、`progress` 时基 getter；插件绝不直接改 transform。
  2. **视觉槽插件 = DOM slot**（遮罩/把手/头尾/内容），React 节点挂进内核容器。
  3. **行为钩子插件 = 纯生命周期/属性变换**（键盘避让/锁滚/焦点圈定/历史关闭…），从不碰几何。
  4. **领域内容插件 = transformData + 槽**（列表选择/动作面板/确认框/分享/筛选），数据驱动渲染。
- **家族协同是最大卖点**：sheet 本身是插件宿主，容器内可再嵌 `withSkuPlugins` / `withCommentPlugins` 等领域组件（§5-E 跨包组合候选）。
- 冻结线：对外导出符号（ModalSheetCore / `withModalSheetPlugins` / 类型 / 子路径插件）、`package.json` exports、README 首屏、demo 外壳四件套——改法走 sync，不动手写产物。

## 2. 领域模型（Props / Context / 决策引擎）

```ts
type SheetDetent = 'default' | 'content' | 'full'; // 全高 / 按内容高 / 占满视口

interface ModalSheetProps {
  isOpen: boolean; onClose: () => void;
  snapPoints?: number[];        // 升序；0–1 = 视口比例，>1 = 像素
  initialSnap?: number;         // 初始档索引
  detent?: SheetDetent;
  dragVelocityThreshold?: number; // 默认 500（px/s）
  dragCloseThreshold?: number;    // 默认 0.6（拖出比例）
  tweenDuration?: number;         // 补间时长 ms，默认 240
  prefersReducedMotion?: boolean; // 跳过补间
  // 模板标准
  containerStyle?: CSSProperties; className?: string;
  containerRefExternal?: Ref<HTMLDivElement>;
  onMount?(): void; onUnmount?(): void;
}

// context 时基值一律 getter（对齐 react-modal-sheet 的 yProgress 联动玩法，零 motion）
interface ModalSheetContext {
  readonly progress: number;      // 0–1 打开进度（拖拽中实时）
  readonly currentSnap: number;   // 当前档索引
  readonly height: number;        // 当前 sheet 高度 px
  snapTo(index: number): void; close(): void;
  getDragProps(): DragProps;      // 拖拽面 spread（onPointerDown 等）
  readonly props: ModalSheetProps; // transformProps 之后那份
  forceUpdate(): void;
}

// 松手后去哪——纯函数决策引擎（类比 vane-coupon eligibility，happy-dom 无布局也能全量单测）
type SnapDecision = { type: 'snap'; index: number } | { type: 'close' };
resolveSnap({ y, velocity, snapPoints, velocityThreshold, closeThreshold }): SnapDecision;
```

**领域语义边界**（对应 SKILL「缺货/禁用」类）：
- `snapPoints` 必须升序；`[0, .5, 1]` 三档是标准形态；`detent:'content'` 时以内容实测高为最高档。
- 速度超阈值（快速下滑）**或**拖出超 `dragCloseThreshold` → close，两者任一命中即关。
- 键盘弹出期（KeyboardAvoidPlugin）拖拽临时禁用 + 自动 snap 至最高档。
- `isOpen:false` 默认卸载；KeepMountedPlugin 改为保活（复用滚动位置，动画需要时用）。

## 3. 入口划分（ADR-6：根不桶导出插件）

- `.` = `index.ts`：聚合 `ModalSheetCore` + `withModalSheetPlugins` + 契约类型。
- `./entries/core` = `entries/core.ts`：只要内核（Core + withModalSheetPlugins），无插件。
- `./entries/plugins` = `entries/plugins.ts`：插件全家桶。
- `./custom-plugins/<Name>Plugin`：每插件独立子路径（构建与 sync-exports 共用 discover-entries）。

## 4. 内核（ModalSheetCore）—— 非插件

- **Portal**：`createPortal` 到 body（`containerRefExternal` 可指定宿主）。
- **snap 状态机**：`closed → opening（补间）→ open@snap[i] → dragging（transition:none + 速度逐帧采样）→ resolveSnap → 吸附最近档 | close`。
- **拖拽引擎**：Pointer Events 统一鼠标/触摸/笔，`setPointerCapture`；拖拽期直写 `transform: translate3d`，松手切回 CSS transition 补间（`prefersReducedMotion` 直接跳）。
- **拖拽面注册**：内核暴露 `getDragProps()`，DragHandle/Header 插件 spread 即成拖拽面；消费方自定义拖拽面同样可接。
- `forwardRef` + `useImperativeHandle`（snapTo / getProgress / getCurrentSnap / getContainer / forceUpdate）。
- 自检 ≤150 行：渲染 + 生命周期 + 几何，可变需求全交插件。

## 5. 插件清单与插槽（21 个已交付 + 未交付候选）

**A 结构视觉槽（priority 10–49，renderBackdrop / renderHandle / renderHeader / renderFooter）：**

| # | 插件 | priority | 槽位 | 职责 |
|---|------|----------|------|------|
| 1 | BackdropPlugin | 10 | renderBackdrop | 遮罩，透明度 = f(progress)，点击关闭 |
| 2 | DragHandlePlugin | 20 | renderHandle | 拖拽指示条 + `getDragProps()` 拖拽面 |
| 3 | SnapDotsPlugin | 24 | renderHandle | 档位指示点，当前档高亮，点击 `snapTo(i)` |
| 4 | HeaderPlugin | 30 | renderHeader | 标题 + 关闭按钮，兼拖拽面 |
| 5 | StepFlowPlugin | 32 | renderHeader+Footer | 步骤条 + 上一步/下一步（分步表单） |
| 6 | SearchBarPlugin | 34 | renderHeader | 搜索框（受控 value + 过滤回调，截图场景） |
| 7 | FooterPlugin | 40 | renderFooter | 吸底操作区（主/次按钮，加载态） |

**B 行为与环境（priority 50–66，钩子派 transformProps / onMount / onSnap…）：**

| # | 插件 | priority | 职责 |
|---|------|----------|------|
| 8 | KeyboardAvoidPlugin | 50 | VirtualKeyboard API + visualViewport 兜底，键盘弹出 snap 至最高档 |
| 9 | ScrollLockPlugin | 52 | body 锁滚 + 恢复滚动位置 |
| 10 | FocusTrapPlugin | 54 | role=dialog / aria-modal / 焦点圈定与归还 |
| 11 | EscClosePlugin | 56 | Esc 关闭，多层 sheet 只关最顶层 |
| 12 | NestedScrollPlugin | 58 | 内容滚动到顶才允许拖拽（disableDrag 函数式场景） |
| 13 | SafeAreaPlugin | 60 | `env(safe-area-inset-*)` 刘海/手势条适配 |
| 14 | ResponsivePlugin | 62 | 断点策略：小屏 bottom sheet / 大屏侧滑或居中 |
| 15 | KeepMountedPlugin | 64 | 挂载策略：关闭即卸载（默认）vs 保活 |
| 16 | HistoryPlugin | 66 | Android 返回手势 / 路由 history 关闭（popstate） |

**C 联动与反馈（priority 80–88，读 progress getter / 生命周期）：**

| # | 插件 | priority | 职责 |
|---|------|----------|------|
| 17 | ModalEffectPlugin | 80 | iOS 根缩放 + 圆角随 progress 联动（Apple Maps 效果） |
| 18 | HapticsPlugin | 82 | 吸附/关闭时 `navigator.vibrate` 触感 |
| 19 | AnnouncerPlugin | 84 | aria-live 播报档位变化（「已展开一半」） |
| 20 | LoadingStatePlugin | 86 | 骨架/加载态，期间拖拽锁定 |
| 21 | EmptyStatePlugin | 88 | 空态占位 + 引导动作 |

**D 领域内容（priority 90–98，transformData + 槽）—— 未交付 / 待排期：**

下表 5 个均为**未交付 / 待排期**候选，`src/custom-plugins/` 下不存在对应目录：

| # | 插件 | priority | 职责 |
|---|------|----------|------|
| 22 | ListSelectPlugin | 90 | 头像 + 双行列表，单/多选，配 SearchBar 过滤（截图场景） |
| 23 | ActionSheetPlugin | 92 | iOS 风动作面板（按钮组 + 取消，destructive 红） |
| 24 | ConfirmPlugin | 94 | 确认对话框（文案 + 双按钮，danger 变体） |
| 25 | SharePanelPlugin | 96 | 分享渠道网格 + 复制链接 |
| 26 | FilterPanelPlugin | 98 | 筛选 chips + 重置/应用（与 FooterPlugin 联动） |

**E 跨包组合候选池 —— 未交付 / 待排期（单独排期，牵跨包联调）：** CartSheet（嵌 vane-sku）/ CommentSheet（嵌 vane-comment）/ ImageBrowser（嵌 vane-lazy-image + file-preview）/ CouponSelector（嵌 vane-coupon）/ SignInSheet（嵌 vane-sign-in）/ ProfileCardSheet（嵌 vane-profile）。以上 6 项均**未交付 / 待排期**。

**插槽**：`renderBackdrop` / `renderHandle` / `renderHeader` / `renderFooter` / `renderOverlay` + 核心钩子 `transformProps` / `transformData` / `onSnap` / `onOpen` / `onClose` / `onMount` / `onUnmount`。同槽多插件按 `config.order` 升序 → `priority` 降序；单插件抛错由 `PluginErrorBoundary` 隔离。priority 分带防撞车：10s 遮罩 / 20s 把手 / 30–40s 头尾 / 50–60s 行为 / 80s 反馈 / 90s 领域。

## 6. 交付批次

| 批次 | 内容 | 数量 |
|---|---|---|
| MVP（P1 首发，已交付） | A 全部 7 个 + KeyboardAvoid / ScrollLock / FocusTrap | **10** |
| 二批（已交付） | B 剩余 6 个 + C 全部 5 个 | 11 |
| 三批 | D 领域 5 个 | 5 **未交付** |
| 四批（独立排期） | E 跨包组合（每项牵跨包联调） | 6 **未交付候选** |

**合计已交付 21**（10 + 11）。MVP 判据：「裸 Core + 视觉件 + 三大行为件」开箱可用；二批补齐环境适应与无障碍；三批 D 领域内容**未交付**；四批 E 跨包组合**未交付候选**。

## 7. 依赖派系

**peer 外部化派**（镜像 vane-sign-in / vane-danmaku）：`vane-plugin-core` 放 `peerDependencies`（`workspace:*`），发前临时改 `*`。react/react-dom 仅 peer。**运行时零第三方依赖**（无 motion/framer-motion）。

## 8. 体积预算

- 根入口 `sizeBudgetKb: 15`（Core + withModalSheetPlugins + 共享类型；纯手写引擎精简）。
- `coreSizeBudgetKb: 12`（`dist/entries/core.js`）。
- 子路径各 `3KB`（含同目录 doc.json 元数据）。
- 超了要么真减（根不桶导出、插件走子路径），要么改口径 + `sizeBudgetNote`，不许静默调大。

## 9. demo 场景（demo.config.tsx + 逐项示例层）

- 基础联系人选择（ListSelect + SearchBar，即参照截图场景）
- 多档 snap + SnapDots 指示（三档拖拽）
- detent: content（按内容高）
- 无遮罩 unstyled（自定义皮肤）
- 键盘避让表单（输入框弹出键盘）
- iOS modal effect（根缩放 + 圆角联动）
- FocusTrap + Announcer（无障碍演示）
- 命令式 snapTo + progress 联动（ref 演示）
- ActionSheet / Confirm（三批）
- SharePanel / FilterPanel（三批）
- 插件工坊（已交付插件开关 + 实时装配代码）

## 10. 验收门禁

- P1：tsc 0 / eslint 0 / check-packages 绿（**先 `vite build --mode lib` 再 check**）/ check-structure --strict 0。
- P2：build:demo 成功 / selftest PASS n/n / 对比度 0 处不达标。
- P3：docs 四件 + changeset + 双远端 HEAD 一致 + 用户确认发 npm + registry 可查。

## 11. 风险与约定

- 事件钩子改闭包状态必须 `context.forceUpdate()`；时基值（progress / currentSnap / height）一律 getter，不做快照。
- 装配工厂 `withModalSheetPlugins(plugins)` 模块顶层调用；用例内按需重建。
- **领域 HOC 铁律**：withModalSheetPlugins 的 children 只兜 renderOverlay，绝不过内核 composeSlots（同名槽撞车 → 双渲染重影）。
- **拖拽测试主战场 = `resolveSnap` 纯函数 + 状态机断言**；happy-dom 无布局引擎，几何断言先探测可用性否则 `layout-skip`。
- Pointer Events 为基线（现代浏览器全支持），**不做**老 Safari touch 事件兜底。
- iOS 滚动穿透/橡皮筋 → ScrollLock + NestedScroll 插件职责，内核不处理。
- demo 去 StrictMode；自测用 dispatchEvent + tick（pointer events 可模拟），不用 `React.act`。
- 样式：当前为**内联样式 + CSS 变量（`--vane-modal-sheet-*`）**，无独立 `dist/style.css` 产物（`sideEffects: false`）；容器自带 `color`+`background`（ADR-13）；拖拽指示条 UI 元件 ≥3:1；不用 opacity 压字。
- KeyboardAvoid 优先 VirtualKeyboard API，老浏览器 visualViewport 兜底；两者都无则 no-op。
