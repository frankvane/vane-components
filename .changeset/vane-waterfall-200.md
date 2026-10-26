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
- **布局 props 变化后的重排修好了**：`columns` / `gap` / `padding` / `alignmentMode` 变化会立即重排；重排之后项级 `ResizeObserver` 再触发也不会用**首帧闭包**把结果盖回旧值（此前把列数从 3 拖到 5，排完又被 3 列覆盖，现象像「控件没接上」）。
- **布局期间到达的请求不再被丢弃**：改为「等这次收尾后补跑一次」，且按参数签名判重（同参数不补跑，`onLayoutComplete` 不会重复触发）。
- `layoutInfo` / `itemPositions` 的镜像改为在布局完成瞬间写入，插件在 `onLayoutComplete` 里读到的永远是刚算出来的那份（此前可能拿到上一帧的值，极端情况是空 `Map`）。
- `GapPlugin` 的 `responsive.sm` 只在小屏（`< 768`）生效，不再被当作兜底档把桌面端显式传入的 `columnGap` / `rowGap` 顶掉。
- 3 个配方：`presets/photo-feed` / `presets/product-feed` / `presets/dashboard`。
- 演示站重建为「插件工坊（26 插件勾选实时装配）+ 场景库（13 个真实版式，一卡两份源码，页面内几何体检）+ 逐项示例（34 页，一插件一页，参数可拖、装配代码跟着变）」。
- 演示站加第三道闸门 `audit:controls`：逐页把每个滑杆推到两端比较逐项指纹，抓「控件没接上」这类几何合法但功能失效的缺陷。
- **虚拟化滚动后的同列重叠修好了**：项先按 `estimateHeight` 落位，挂载后量到真高却不会触发重排（`ResizeObserver` 里判断的是「测量值有没有变」，而 ref 回调已经写过），于是估值高度一直用下去 —— 实测滚动到 30%/60%/95% 处各有 9–13 处重叠。现在改为比较「当前 position.height 与实测高度是否一致」，并用 `heightRepairRef` 记住补过的高度（插件改写项高时不会来回震荡）。修后三处位置重叠均为 0。
- **`ReducedMotionPlugin` 真的能清掉过渡、也能还原**：此前只在 `transformProps` 里写 `itemStyle.transition`，被 `TransitionPlugin` 在 `onItemMount` / `onLayout` 里写的内联样式覆盖回来（读数说「已清掉」，元素上还是 0.24s）。现在改为压 `transition-duration`（而不是写 `transition: none`）并记住原值 —— 写简写会把对方的过渡整条覆盖掉，撤销偏好后无从还原。
- 示例页 `24-url-sync` 修通：`keys` 写的是 props 上不存在的 `query`、过滤用了 Core 并不消费的 `filterFn`、`urlsync:init` 无人消费 —— 现在 `keys: ["searchQuery"]` + `SearchPlugin` + 挂载时读 `location.search` 回填，输入即写 URL、刷新即回填。
- `scripts/audit-demos.mjs` 的两处盲区：只读 `transform` 定位（`useTransform: false` 时会误报「容器里没有已布局项」），现在回退到 `offsetLeft/offsetTop`；`scripts/audit-controls.mjs` 的还原检查对虚拟化页忽略 `scrollHeight`（实测高度替换估值会让总高合法变大）。
- **虚拟化新增自适应估值**（`virtualize.adaptiveEstimate`，默认 `true`）：`estimateHeight` 退为「冷启动兜底」，样本够 8 个后改用实测高度的中位数（`estimateQuantile`，默认 0.5）。理由：总高是所有项高度之和，中位数让总高误差最小；实测 1000 项数据集总高 95337px vs 实际 94700px（+0.7%），而 P90 会虚长到 117225px（+24%）。关掉它则严格用 `estimateHeight`。
- **虚拟化「量到真高就立刻重排」**：项级 `ResizeObserver` 发现位置高度与实测不符时改走 `requestAnimationFrame` 合并的立即重排，不再等布局防抖（此前重叠要等 `debounceDelay` 才修，滚动中肉眼可见）。实测快速滚动 20 屏可见重叠 0 帧；拖动滚动条瞬移时最多 1–3 帧、≤60px（估值式虚拟化的固有取舍，停手即收敛）。
- **`DragReorderPlugin` 支持触屏**：鼠标仍走原生 HTML5 拖拽；触摸设备上 `draggable` 根本不触发（旧版因此在手机上完全失效），现在补了 pointer 路径 —— 长按 `touchHoldMs`（默认 180ms）进入拖拽，用 `elementFromPoint` 找落点。`doc.json` 同步收录新参数。
- **`ClickAnalytics` / `HeatmapAnalytics` 新增 `getStats()`**：把内存里的按项计数吐成扁平结构（`{ total, byIndex }` / `{ totalViews, totalClicks, items }`），方便接自己的上报通道。演示站两个页面加了「导出 JSON」按钮，把数据形状直接展示出来。
- `ReducedMotionPlugin` 监听 `matchMedia` 的 `change`：运行中改系统设置即时生效，不必刷新页面（定位方式 `useTransform` 要等下一次重渲染才切过来）。
