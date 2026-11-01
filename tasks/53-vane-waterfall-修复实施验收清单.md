# vane-waterfall 修复实施验收清单

> 依据：`tasks/44-vane-waterfall-核心功能评审.html`（0 P0 / 6 P1 / 11 P2，修复顺序 T01–T07）。
> 范围：仅修改 `packages/vane-waterfall/`，未触碰 `packages/plugin-core`、其它包、根配置与 `tasks/44` 报告。
> 结论：**17 / 17 项已修复**（6 P1 + 11 P2），无需 plugin-core 支持的阻塞项。

## 1. 概述

本轮按报告给出的证据逐项落地修复，主线是三条：

1. **布局不再会冻结**：`calculateLayout` 整体包进 `try/catch/finally`，无论宿主回调
   （`onBeforeLayout` / `onLayout` / `onLayoutComplete`）是否抛错，`isCalculatingLayoutRef`
   都会复位，并按 `pendingRelayoutRef` 补跑一次；HOC 侧再用 `safeCall` / `safeAwait`
   隔离宿主回调，插件链也不会被单个回调的异常打断。
2. **布局缓存与测量缓存口径一致**：测量结果从「按 index」改成「按 `keyExtractor` 的稳定 key」，
   数据集替换时按存活 key 裁剪，全部换了就重置估值；Core 侧另加数据集指纹
   （长度 + 每项 key），HOC 侧对 `transformProps` 结果做 `useMemo`，数据插件产出新数组时不再全量重排。
3. **首屏与锚定补齐边角**：布局完成后主动做一次触底判定（首屏不足一屏也能触发）；
   布局前记录「首个可见项」锚点，布局后把补偿量在提交后的 layout effect 里写回 `scrollTop`；
   零高度项默认按 `minItemHeight = 48` 占位，不再被 `opacity:0` 静默丢弃。

其余 P2 按插件逐个收口：分页参数归一与越界钳制、无限加载按实例加锁、
回收池挤出项同步隐藏、Gap 按容器宽度选档、持久化 schema 与恢复时机、URL 首次注入、
书签单监听、分组缓存与吸顶当前组、埋点按稳定 key、A11y roving tabindex、
HOC 的依赖/引用稳定性与项单元 memo。

## 2. 逐项验收表

### 2.1 P1（6 项）

| 编号 | 级别 | 问题 | 修复方案 | 改动位置（file:line） | 回归测试用例 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| WF-P1-1 | P1 | `onBeforeLayout` / `onLayout` / `onLayoutComplete` 抛错后 `isCalculatingLayoutRef` 永不复位，后续布局全部被早退拦截 | 布局主体包进 `try/catch/finally`；`finally` 复位标志并在 `pendingRelayoutRef` 为真时用最新闭包补跑；HOC 用 `safeCall` / `safeAwait` 包裹所有宿主回调 | `src/components/WaterfallPlugin/WaterfallCore.tsx:540-669`；`src/components/WaterfallPlugin/withPlugins.tsx:75-108` | `test/core-robustness.test.tsx`：`onBeforeLayout 抛错：本次跳过，下一次请求仍能正常布局`、`onLayoutComplete 抛错：布局结果照常提交，后续重排继续` | 已修复 |
| WF-P1-2 | P1 | 数据集替换只清 `heightRepairRef`，`measuredHeightsRef` 仍按 index 保留，离屏新项沿用旧高度 | 测量缓存改为 `Map<稳定 key, height>`；数据集变化时按「当前仍存在的 key」裁剪，全部换了就重置 `estimateRef`；`relayout` 也同步清测量缓存与估值 | `WaterfallCore.tsx:364`、`:413-420`、`:901-926`、`:1058-1067` | `core-robustness.test.tsx`：`换数据后，离屏新项不再沿用旧项的高度` | 已修复 |
| WF-P1-3 | P1 | 数据插件每次渲染都产出新 `items` 数组，Core 判定数据集变化 → 反复全量重排 | Core 增加数据集指纹（长度 + 每项 key）短路；HOC 对 `transformProps` 结果做 `useMemo`（props 身份 + 插件链身份 + `transformVersion`），插件显式失效走 `props:invalidate` | `WaterfallCore.tsx:422-430`、`:901-906`；`withPlugins.tsx:462-466`、`:326-330` | `core-robustness.test.tsx`：`换数组引用但 key 不变时不触发重排` | 已修复 |
| WF-P1-4 | P1 | 触底判定只在 `scroll` 事件里执行，首屏内容不足一屏时永远不会触发 | 抽出 `maybeReachBottom()`，布局完成后调用 `scheduleReachBottomCheck()`（`setTimeout 0` 合并 + `scrollTop\|scrollHeight\|clientHeight` 签名去重）；`handleScroll` 复用同一函数 | `WaterfallCore.tsx:508-538`、`:655-656`、`:779-793` | `core-robustness.test.tsx`：`内容高度小于容器高度时，挂载布局完成后触发 onReachBottom` | 已修复 |
| WF-P1-5 | P1 | 测量回写（项变高/变矮）后没有滚动锚定，视口内容整体跳动 | 布局前 `captureScrollAnchor` 记录首个可见项与视口内偏移；布局后计算 delta 存入 ref，在提交后的无依赖 `useLayoutEffect` 中写 `scrollTop` | `WaterfallCore.tsx:393`、`:472-500`、`:560-561`、`:645-653`、`:691-699` | `core-robustness.test.tsx`：`视口上方项变高时补偿 scrollTop，首个可见项留在原位` | 已修复 |
| WF-P1-6 | P1 | 首测高度为 0 的项被跳过，且项单元以 `opacity:0` 隐藏，整项不可见 | `layout.ts` 的 `resolveHeight` 增加 `minItemHeight` 兜底（不传时默认 0，保持既有快照兼容）；Core 默认传 48；只有「完全没有位置」的项才保留 `opacity:0` 兜底 | `src/components/WaterfallPlugin/layout.ts:75`、`:91-100`、`:110`、`:161`；`WaterfallCore.tsx:96`、`:329-330`、`:610`、`:273-288` | `core-robustness.test.tsx`：`首测高度为 0 的项仍占位（minItemHeight 默认 48）`、`显式 minItemHeight=0 时退回旧行为（跳过不占位）` | 已修复 |

### 2.2 P2（11 项）

| 编号 | 级别 | 问题 | 修复方案 | 改动位置（file:line） | 回归测试用例 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| WF-P2-1 | P2 | 插件上下文 `items` / `itemCount` 取原始 props，与数据插件渲染集合不一致 | 上下文改为读「渲染集合」（`transformedPropsRef`），新增 `rawItems` 保留原始集合；字段全部走 getter | `withPlugins.tsx:186-224`、`:257-291`；`plugins/types.ts:103-107` | `test/plugin-fixes.test.tsx`：`items 是渲染集合、rawItems 是原始集合；hasMore/isLoading 可由 props 覆盖` | 已修复 |
| WF-P2-2 | P2 | `visibleItems` 恒空、`hasMore` 恒 true、`isLoading` 恒 false 且不可写；InfiniteScroll 的 `loading` 闭包被多实例共用 | Core 的 `useImperativeHandle` 暴露 `getVisibleItems`；HOC 的 `hasMore` / `isLoading` getter 优先取 props、其次插件 state；InfiniteScroll 用 `WeakMap<实例, boolean>` 按容器隔离并发锁 | `WaterfallCore.tsx:177`、`:1117`；`withPlugins.tsx:202-218`、`:268-284`；`src/custom-plugins/InfiniteScrollPlugin/create.ts:35-67` | `plugin-fixes.test.tsx`：`同一实例加载中不重复触发，不同实例互不影响`、`hasMore=false 时不再触发 onLoadMore`；`visibleItems` 由 P2-1 用例断言 | 已修复 |
| WF-P2-3 | P2 | Pagination 与 InfiniteScroll 无互斥校验；页码越界时 `slice` 出空数组静默空列表 | HOC 检测同时存在时 `console.warn` 说明互斥；Pagination 对 `pageIndex` / `pageSize` 做 `Number.isFinite` + `floor` + 下限归一，越界钳到最后一页并告警 | `withPlugins.tsx:468-479`；`src/custom-plugins/PaginationPlugin/create.ts:25-43` | `plugin-fixes.test.tsx`：`页码越界时钳到最后一页，不再静默变成空列表`、`非法页码（NaN / 负数 / 小数）归一为合法页`、`Pagination 与 InfiniteScroll 同时启用时给出互斥告警` | 已修复 |
| WF-P2-4 | P2 | Recycle 的 `ensurePoolLimit` 只把项从 Set 里删掉，被挤出项仍保持可见，池子上限形同虚设 | 挤出时通过 `getItemRef` 同步设置 `visibility:hidden` | `src/custom-plugins/RecyclePlugin/create.ts:19-29` | `plugin-fixes.test.tsx`：`被挤出池子的项一起隐藏，不只是从集合里删掉` | 已修复 |
| WF-P2-5 | P2 | GapPlugin 用 `window.innerWidth` 选响应式档位，容器比窗口窄时选错档 | 新增按容器 `clientWidth` 的 `pickResponsive` + `syncWidth`，在 `onMount` / `onResize` 同步；档位变化时 `bus.emit("props:invalidate")` 让 HOC 重算 `transformProps` | `src/custom-plugins/GapPlugin/create.ts:26-61`、`:68-91` | `plugin-fixes.test.tsx`：`容器 780px、窗口 1400px 时取 md 档而不是 xl` | 已修复 |
| WF-P2-6 | P2 | StatePersistence 恢复时机过早（`onMount` 就 `scrollTo`）且无 schema；URLSync 只写不读、首次默认值覆盖 URL；Bookmark 在 window 与 document 双注册 | StatePersistence 增加 `version: 1` 快照信封，读到无 version 的旧数据直接丢弃；滚动位置改到 `onLayoutComplete` 且每实例只恢复一次；URLSync 首次把 URL 参数注入 props，props 与 URL 一致时不重写；Bookmark 仅保留 window capture 监听 | `src/custom-plugins/StatePersistencePlugin/create.ts:20-133`；`src/custom-plugins/URLSyncPlugin/create.ts:15-122`；`src/custom-plugins/BookmarkPlugin/create.tsx:67-72` | `plugin-fixes.test.tsx`：`只读取带 schema 的快照，旧格式直接丢弃`、`滚动位置在首次布局完成后恢复，onMount 不提前 scrollTo`、`卸载写入的快照带 version`、`首次渲染把 URL 参数注入 props（此前只写不读）`、`首次 props 默认值与 URL 一致时不重写 URL（避免冲掉深链参数）`、`一次按键只保存一次（window/document 双注册已去除）` | 已修复 |
| WF-P2-7 | P2 | Grouping 每次布局都 O(n) 重算并广播；StickyHeader 恒显示第一个分组 | Grouping 按 `items` 引用缓存，并用 `sameGroups` 比较，仅变化时 emit；同时写入 `GROUP_INDEX`；StickyHeader 按 `visibleRange.start` 对应的组显示，取不到才回退第一组 | `src/custom-plugins/GroupingPlugin/create.tsx:13-66`；`src/custom-plugins/StickyHeaderPlugin/create.tsx:22-32` | `plugin-fixes.test.tsx`：`items 引用不变时不重复重算 / emit，替换数据才 emit`、`吸顶条显示当前可见项所属分组，而不是恒为第一组` | 已修复 |
| WF-P2-8 | P2 | ClickAnalytics / HeatmapAnalytics 按 index 计数（排序/分页后串号）；`initialCountDone` 不复位，换数据后首屏曝光不再计 | 两个插件改用 `keyExtractor` 的稳定 key（取不到回退 `#index`），`syncDataset` 在数据集替换时清空统计并复位首屏曝光标记；`getStats()` 增加 `key` 字段，点击事件 payload 增加 `key` | `src/custom-plugins/ClickAnalyticsPlugin/create.tsx:30-99`；`src/custom-plugins/HeatmapAnalyticsPlugin/create.tsx:36-123` | `plugin-fixes.test.tsx`：`ClickAnalytics：同一项在不同位置点击仍记在同一 key 上`、`HeatmapAnalytics：换数据后首屏曝光重新计数（initialCountDone 复位）` | 已修复 |
| WF-P2-9 | P2 | A11y 给每项 `tabIndex=0` 且 `outline:none`，Tab 穿行成本高且焦点不可见；`aria-setsize` 与渲染集合不一致 | 改为 roving tabindex（每个实例只允许当前项为 0，其余 -1，点击后迁移停靠点）；移除 `outline:none`；`aria-setsize` 取 `context.itemCount` | `src/custom-plugins/A11yPlugin/create.tsx:33-80` | `plugin-fixes.test.tsx`：`只有当前项可 Tab 聚焦，点击后停靠点迁移；setsize 与渲染集合一致` | 已修复 |
| WF-P2-10 | P2 | `layoutHooks` 只依赖 `namesKey`（同名换配置仍用旧闭包）；渲染期写 `ctxRef`；`positions` 只比较 size；`itemRefCallbacksRef` 只增不删 | 依赖改为 `[orderedPlugins]`；`ctxRef` 移到无依赖 `useLayoutEffect`；`syncFromCore` 逐项比较 `x/y/width/height/column`；项 ref 收到 `null` 时同步删除回调缓存 | `withPlugins.tsx:321-324`、`:411-412`、`:429-449`；`WaterfallCore.tsx:1003-1006` | 无独立用例（结构项）：`layoutHooks` 依赖与 `ctxRef` 时序由 `renderItemWrapper` / 布局链路间接覆盖；位置逐项比较由 P1-5 的锚定断言与 `core-ref.test.tsx` 的 `relayout` 用例覆盖 | 已修复 |
| WF-P2-11 | P2 | 内联 `padding` 每次渲染都生成新对象触发全量重排；滚动同时更新两处 state；项内容无 memo | `padding` 拆成 4 个原始数值 + `useMemo` 归一；`updateViewportInfo` 改用 rAF 合并且值未变返回旧引用；新增 `WaterfallItem = React.memo(...)`，HOC 的 `renderItemWithWrappers` / `wrapperPlugins` 保持稳定身份 | `WaterfallCore.tsx:262-302`、`:329-340`、`:734-745`；`withPlugins.tsx:527-549` | `plugin-fixes.test.tsx`：`同一 items / renderItem 重渲染不重复调用 renderItem`；padding / rAF 合并为纯结构优化，由上述用例与 `core-resize.test.tsx` 间接覆盖 | 已修复 |

## 3. 验证记录

全部命令在 `e:\react-plugin-component` 下真实执行，结果如下。

| 序号 | 命令 | 实际结果 |
| --- | --- | --- |
| 1 | `pnpm --filter vane-waterfall test` | 通过：`Test Files 8 passed (8)`，`Tests 68 passed (68)`，Duration 17.28s（修复前为 6 文件 / 40 用例） |
| 2 | `pnpm --filter vane-waterfall typecheck` | 通过：`tsc --noEmit -p tsconfig.json` 无输出，退出码 0 |
| 3 | `pnpm --filter vane-waterfall lint` | 通过：`0 errors, 249 warnings`，退出码 0（警告为既有的 `@typescript-eslint/no-explicit-any`，分布在测试与插件文件中，无新增 error） |
| 4 | `pnpm --filter vane-waterfall build` | 通过：`vite build --mode lib` → `✓ built in 7.22s`；`[vite:dts] Declaration files built in 5836ms`；产出 `dist/chunks/WaterfallCore-*.js`（21.28 kB）、`dist/chunks/withPlugins-*.js`（21.51 kB）等 |

补充的定向验证（在跑全量前执行）：

- `vitest run test/core-robustness.test.tsx` → `8 passed`
- `vitest run test/plugin-fixes.test.tsx` → `20 passed`

## 4. 破坏性变更与行为变化

公开 API 未删改；以下为默认值 / 语义变化，接入方需要知悉：

1. **`WaterfallCore` 新增 `minItemHeight`（默认 48）**：首测高度为 0 的项现在占 48px 高度，
   总高与后续项位置会随之变化。要完全退回旧行为请显式传 `minItemHeight={0}`。
2. **`WaterfallCore` 新增 `scrollAnchor`（默认 `true`）**：布局后可能补偿 `scrollTop`，
   首个可见项保持在原视口位置。需要严格保持宿主滚动位置时传 `false`。
3. **PaginationPlugin 页码越界**：由「静默空列表」改为「钳到最后一页 + `console.warn`」；
   `pageIndex` 的 NaN / 负数 / 小数会被归一为合法页。
4. **GapPlugin 响应式按容器宽度**：容器比窗口窄时档位会变化；`sm` 档只在 `< 768px` 生效
   （此前只要配置了 `sm` 就无条件兜底，桌面端也会套窄屏间距）。
5. **StatePersistencePlugin 快照格式**：写入 `{ version: 1, state: {...} }`；
   旧格式（无 `version`）读到即丢弃，历史快照不再恢复。
6. **A11yPlugin 焦点模型**：`tabIndex` 改为 roving（仅当前项 0，其余 -1），移除 `outline:none`。
7. **ClickAnalytics / HeatmapAnalytics**：统计键改为 `keyExtractor` 稳定 key，
   `getStats()` 结果与 `analytics:click` payload 增加 `key` 字段；数据集替换时统计清零。
8. **插件上下文的 `items` 语义**：改为数据插件改写后的渲染集合，原始集合改用新增的 `rawItems`。
9. **URLSyncPlugin**：首次渲染会把 URL 参数注入 props（此前只写不读）；
   首次 props 与 URL 一致时不再重写 URL。
10. **InfiniteScrollPlugin / BookmarkPlugin**：并发锁按实例隔离、按键只注册一次，
    均为行为修正，配置签名不变。

## 5. 遗留问题与风险

- **占位与估值的交互**：零高度项先按 48px 占位，真实高度量到后会补一次重排；这是预期行为，
  但在大量零高度项的场景下可能多一次布局。
- **滚动锚定的边界**：锚点取「布局前首个可见项」。若同帧内连续多次布局（例如宽度变化叠加
  数据集替换），补偿量会累加；已用 `pendingScrollAdjustRef` 累积并在 layout effect 一次写入，
  极端快速滚动下仍可能出现 1–2px 的视觉抖动。
- **触底去重**：`scheduleReachBottomCheck` 用 `scrollTop|scrollHeight|clientHeight` 签名去重，
  宿主在 `onReachBottom` 中不追加数据时不会重复触发（符合预期，但依赖页面自行维护 `hasMore`）。
- **`transformProps` 缓存键**：以 props 对象引用为键。宿主若原地修改 props 对象（不推荐）
  不会触发重算；插件需要强制重算时应 `bus.emit("props:invalidate")`（GapPlugin 已示范）。
- **Analytics 回退键**：宿主未提供 `keyExtractor` 时仍回退到 `#index`，此时排序/分页后
  统计仍可能与项错位（已与旧行为一致，仅为兜底）。
- **P2-10 的 ref 回调回收**：依赖 React 在移除时以 `null` 调用 ref；若元素被复用而未触发
  `null`，缓存仍会多留一项（影响仅限内存，不改变布局）。

## 6. 未覆盖范围

- 未修改 `packages/plugin-core`、其它 workspace 包、根配置、`tasks/44` 报告；未执行任何 git 命令。
- 26 个官方插件中，本轮只改动 12 个：Pagination、InfiniteScroll、Gap、Recycle、
  StatePersistence、URLSync、Bookmark、Grouping、StickyHeader、ClickAnalytics、
  HeatmapAnalytics、A11y。其余插件（DragReorder、Throttle、Debounce、AutoColumn、
  ResponsiveColumns、FixedHeight、PinItem、Filter、Sort、Search、LazyImage 等）未改动。
- P2-10 的 `layoutHooks` 依赖与 `ctxRef` 时序、P2-11 的 padding memo 与滚动 rAF 合并属于
  结构性改动，没有单独的「旧实现必失败」断言；由 P1-3 / P2-1 / P2-11 用例及原有 40 个用例
  间接覆盖。
- 未做真实浏览器视觉验证：测试环境为 happy-dom（无布局引擎），测量与位置通过属性桩模拟，
  覆盖的是「是否按契约测量 / 计算 / 回写」，不覆盖 CSS 真实渲染结果。

## 7. 改动文件清单

源码：

- `packages/vane-waterfall/src/components/WaterfallPlugin/WaterfallCore.tsx`
- `packages/vane-waterfall/src/components/WaterfallPlugin/layout.ts`
- `packages/vane-waterfall/src/components/WaterfallPlugin/withPlugins.tsx`
- `packages/vane-waterfall/src/components/WaterfallPlugin/plugins/types.ts`
- `packages/vane-waterfall/src/custom-plugins/PaginationPlugin/create.ts`
- `packages/vane-waterfall/src/custom-plugins/InfiniteScrollPlugin/create.ts`
- `packages/vane-waterfall/src/custom-plugins/GapPlugin/create.ts`
- `packages/vane-waterfall/src/custom-plugins/RecyclePlugin/create.ts`
- `packages/vane-waterfall/src/custom-plugins/StatePersistencePlugin/create.ts`
- `packages/vane-waterfall/src/custom-plugins/URLSyncPlugin/create.ts`
- `packages/vane-waterfall/src/custom-plugins/BookmarkPlugin/create.tsx`
- `packages/vane-waterfall/src/custom-plugins/GroupingPlugin/create.tsx`
- `packages/vane-waterfall/src/custom-plugins/StickyHeaderPlugin/create.tsx`
- `packages/vane-waterfall/src/custom-plugins/ClickAnalyticsPlugin/create.tsx`
- `packages/vane-waterfall/src/custom-plugins/HeatmapAnalyticsPlugin/create.tsx`
- `packages/vane-waterfall/src/custom-plugins/A11yPlugin/create.tsx`

测试：

- `packages/vane-waterfall/test/core-robustness.test.tsx`（新增，8 用例）
- `packages/vane-waterfall/test/plugin-fixes.test.tsx`（新增，20 用例）
