---
"vane-waterfall": major
---

vane-waterfall 2.0.0：插件系统内核更换为 `@vane/plugin-core`，钩子面从 48 收到 20

**破坏性变更**

- **插件系统换成内核**：自建 `PluginBus` / `PluginManager` 与旧 `withPlugins` 全部删除（约 1600 行），改用 `@vane/plugin-core` 的 `usePluginRuntime` / `composeSlots` / `PluginErrorBoundary`。`Plugin` / `PluginContext` 类型从 `@vane/plugin-core` 取（本包 re-export）。
- **领域钩子面 48 → 20**：只保留有真实执行点的钩子。被删的 31 个（`filterItem` / `sortItems` / `searchItem` / `renderContainer` / `renderEmpty` / `renderLoadingMore` / `transformItem` / `calculateVisibleRange` …）在 1.x 从来没有执行者，写进去不生效。
- **`renderItemWrapper` 签名统一为 `(context, node, index)`**：1.x 里 A11y（node 在前）与 DragReorder（index 在前）顺序相反，两个同开会错位。
- **虚拟化下沉 Core**：`VirtualWaterfallPlugin` 删除，改为 `virtualize` prop（只裁渲染不裁测量；未渲染项按 `estimateHeight` 占位）。`RecyclePlugin` 保留但与 `virtualize` 互斥。
- **`onMount` 返回值统一当清理函数**：1.x 的装配层从不执行它，订阅会泄漏。
- **`reachBottomOffset` 提为 props**（默认 100）：1.x 写死 100，`InfiniteScrollPlugin({ threshold: 300 })` 配多大都没用。
- **包形态改多入口**：根入口只导出核心 + 装配 + 类型（10.5KB gzip），插件走 `vane-waterfall/custom-plugins/XxxPlugin`，配方走 `vane-waterfall/presets/X`；另提供 `vane-waterfall/core`、`vane-waterfall/plugins` 两个语义别名；`exports` 共 34 个子路径。
- **`priority` 语义同向**（大 = 先执行），未做 `1000 - x` 反转——照抄 `vane-lazy-image` 的适配代码会直接引入 bug。

**新增 / 修复**

- 新增 `PinItemPlugin` 的真实实现（1.x 是空转插件：逻辑压在从未被执行的 `calculateItemPosition` 上）。
- `GroupingPlugin` 改为挂载即算（1.x 只在 `onPropsChange` 里算，首屏拿不到分组）并 `emit("grouping:change")`。
- `DragReorderPlugin` 补 `onReorder(from, to, item)` 真回调（1.x 只往 `sharedData` 写 from/to，页面拿不到结果）。
- `AutoColumnPlugin` / `ResponsiveColumnsPlugin` 改走 D1-A 布局钩子 `calculateColumns`，拿到的是**容器**宽度而不是 `window.innerWidth`。
- `ClickAnalytics` / `HeatmapAnalytics` / `StickyHeader` 的 `showOverlay` 默认改为 `false`。
- 布局抽成纯函数 `computeLayout` / `computeVisibleRange` 并对外导出，配 8 组数字快照做等价性断言。
- 3 个配方：`presets/photo-feed` / `presets/product-feed` / `presets/dashboard`。
- 演示站重建为「插件工坊（26 插件勾选实时装配）+ 场景库（13 个真实版式，一卡两份源码，页面内几何体检）」。
