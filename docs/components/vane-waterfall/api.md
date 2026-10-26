# API

三层：**Core 的 props / ref** → **装配层 `withPlugins`** → **插件拿到的 context 与 20 个钩子**。

## WaterfallCoreProps

### 数据

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `T[]` | `[]` | 数据源。插件可通过 `transformProps` 改写（Filter / Sort / Pagination 就是这么做） |
| `renderItem` | `(item, index) => ReactNode` | 必填 | 渲染单项内容。插件可用 `renderItemWrapper` 再包一层 |
| `keyExtractor` | `(item, index) => Key` | `index` | 项 key |

### 布局

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `columns` | `number` | `3` | 列数；会被 `calculateColumns` 钩子覆盖 |
| `gap` | `number` | `16` | 行/列间距简写 |
| `rowGap` / `columnGap` | `number` | 取 `gap` | 分别覆盖 |
| `alignmentMode` | `"shortest" \| "balanced" \| "sequential"` | `shortest` | 列分配策略，见下 |
| `padding` | `number \| {top,right,bottom,left}` | `0` | 容器内边距，参与布局计算 |
| `containerStyle` | `CSSProperties` | — | **需要给高度**，否则没有滚动上下文 |
| `containerClassName` / `itemStyle` / `itemClassName` | — | — | 样式扩展 |
| `useTransform` | `boolean` | `true` | 用 `transform` 定位；需要读 `offsetLeft`、或要打印时传 `false` |

三种 `alignmentMode`：

- `shortest`：放进当前**最矮**的列（视觉最均衡，默认）
- `balanced`：放进**项数最少**的列（列高可能不齐，但每列张数接近）
- `sequential`：按 `index % columns` 轮转（位置可预测，看板/泳道场景用）

列高相同时三者都取最小索引列（左优先）——这是刻意保留的旧行为。

### 性能

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `throttleDelay` | `number` | `16` | 滚动回调节流（ms） |
| `debounceDelay` | `number` | `150` | 重新布局的防抖（ms） |
| `reachBottomOffset` | `number` | `100` | 距底多少 px 触发 `onReachBottom` |
| `virtualize` | `boolean \| { overscan, estimateHeight, dynamicHeights }` | 关 | 只裁渲染不裁布局，见下 |
| `debug` | `boolean` | `false` | 打印布局耗时与估值占位数量 |

`virtualize` 的字段：

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `overscan` | `1` | 视口上下各多渲染几个屏高的内容 |
| `estimateHeight` | `240` | **未测量项的占位高度**。总高靠它兜底，估偏了滚动条会跳 |
| `dynamicHeights` | `true` | 是否给每项挂 ResizeObserver（关闭可省观测开销，但图片加载后不会自动重排） |

> 虚拟化与 `RecyclePlugin` 不要同开：一个直接卸载 DOM，一个只改 `visibility`，互相打架。

### 数据管线键（给插件读，Core 自己不消费）

`filterFn` / `sortComparator` / `searchQuery` / `pageIndex` / `pageSize` / `onLoadMore` /
`scrollToTopOnFilterChange` / `scrollToTopOnSortChange` / `scrollToTopOnSearchChange` / `scrollToTopOnPageChange` / `scrollToTopBehavior`

这些放在 Core props 上，是为了能穿过整条 `transformProps` 链——插件之间靠这条链传值。

### 生命周期回调（由 `withPlugins` 桥接成插件钩子）

`onMount` / `onUnmount` / `onBeforeLayout` / `onLayout` / `onLayoutComplete` /
`onItemMount` / `onItemUnmount` / `onItemEnterViewport` / `onItemLeaveViewport` /
`onScroll` / `onResize` / `onReachBottom` / `onItemClick`

页面直接用这些回调是合法的（不装插件也能拿到事件），同一事件会**先调 props 回调、再跑插件钩子链**。

## WaterfallCoreRef

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `relayout` | `() => void` | 清空高度缓存后重新测量并布局（图片加载完、字体变化后调） |
| `scrollToItem` | `(index, opts?: { behavior, block, offset }) => void` | `block` 支持 `start/center/end/nearest` |
| `scrollToTop` / `scrollToBottom` | `(opts?: { behavior, offset }) => void` | — |
| `getItemPosition` | `(index) => ItemPosition \| null` | 单项位置 |
| `getAllItemPositions` | `() => Map<number, ItemPosition>` | 全部位置（**读的是实时 Map**，不是渲染快照） |
| `getColumnHeights` | `() => number[]` | 每列当前高度 |
| `getLayoutInfo` | `() => LayoutInfo` | 列数 / 列宽 / 总高 / 容器尺寸 |
| `getViewportInfo` | `() => ViewportInfo` | 含 `isScrolling`、`direction` |
| `getVisibleRange` | `() => { start, end }` | 当前**渲染**区间（虚拟化关闭时是 `0..n-1`） |
| `forceUpdate` | `() => void` | 强制重渲染 |
| `getContainer` / `getItemElement` | `(index) => HTMLElement \| null` | DOM 句柄 |
| `measureItem` | `(index) => Promise<{width,height}>` | 量一项；虚拟化下若已卸载会返回缓存或估值 |

## withPlugins

```ts
const Waterfall = withPlugins(WaterfallCore, plugins);
// 或带调试
const Waterfall = withPlugins(WaterfallCore, { plugins, enableDebug: true });
```

| 要点 | 说明 |
| --- | --- |
| 调一次，别在渲染里调 | 每次调用都产生新组件类型 → React 卸载重建。需要读组件闭包时用 `useMemo` |
| `ref` 透传 | ref 指向 `WaterfallCoreRef`，插件上下文**不**通过 ref 暴露（插件之间的协作用 `bus`） |
| 执行顺序 | `resolveDependencyOrder`：依赖优先 → `priority` 降序 |
| 错误隔离 | 单个插件钩子抛错不影响其他插件；`renderOverlay` 外面包了 `PluginErrorBoundary` |

## 插件 context（`WaterfallPluginContext<T>`）

内核字段之外，瀑布流补了这些：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `items` / `itemCount` | `T[]` / `number` | 当前数据（`transformProps` 之后） |
| `containerRef` | `RefObject<HTMLDivElement>` | 滚动容器（`renderOverlay` 的定位基准） |
| `itemRefs` / `getItemRef(index)` | `Map` / `(i) => HTMLElement \| null` | 项 DOM |
| `layout` | `LayoutInfo` | **getter，读 Core 实时值** |
| `itemPositions` / `getItemPosition(i)` | `Map` | **getter，实时** |
| `viewport` | `ViewportInfo` | **getter，实时** |
| `visibleRange` | `{ start, end }` | **getter**，按真实重叠算（虚拟化关闭时也有值） |
| `visibleItems` | `Set<number>` | 当前可见集合 |
| `isLayouting` / `isScrolling` / `isDragging` / `isLoading` / `hasMore` / `error` | 状态位 | 由插件 `state` 驱动（如 `setState({ hasMore: false })`） |
| `sharedData` | `Map<string, any>` | 插件间共享（`GROUPS` 就是分组结果） |
| `bus` | `PluginBus` | `emit / on / once / off` |
| `networkInfo` / `dragInfo` | — | 网络状况 / 拖拽状态 |
| `relayout()` / `scrollToItem()` / `scrollToTop()` / `scrollToBottom()` / `measureItem()` | — | 转发到 ref 契约 |

> 四个几何字段是 **getter**：`onLayoutComplete` 里读到的就是本次布局结果。旧版这里是渲染快照，插件在布局完成钩子里只能自己去 DOM 里量。

## 20 个钩子

统一签名 `(context, ...args)`；返回值语义见下。

### 生命周期（4）

| 钩子 | 参数 | 返回值语义 |
| --- | --- | --- |
| `onMount` | `(ctx)` | 返回函数 = 清理函数（卸载时执行一次） |
| `onUnmount` | `(ctx)` | — |
| `onPropsChange` | `(ctx, prevProps, nextProps)` | — |
| `transformProps` | `(props)` | 返回新 props，进入下一条链 |

> 错误处理不在领域钩子里：内核统一做 `try/catch` 隔离，`renderOverlay` 外面包了 `PluginErrorBoundary`。

### 布局（6）

| 钩子 | 参数 | 说明 |
| --- | --- | --- |
| `onBeforeLayout` | `(ctx)` | 返回 `false` → 中断本次布局（整条链生效） |
| `calculateColumns` | `(ctx, containerWidth)` | 返回列数；`undefined` 继续下一个插件 |
| `calculateColumnWidth` | `(ctx, containerWidth, columns)` | 返回列宽 |
| `calculateItemPosition` | `(ctx, index, itemHeight, base)` | 返回 `Partial<ItemPosition>` 覆盖基准位置 |
| `onLayout` | `(ctx)` | 布局开始 |
| `onLayoutComplete` | `(ctx)` | 布局写完状态后（此时读 `layout` 是新的） |

### 项与视口（5）

`onItemMount(ctx, index, el)` · `onItemUnmount(ctx, index)` ·
`onItemEnterViewport(ctx, index, visibility)` · `onItemLeaveViewport(ctx, index, visibility)` ·
`onItemClick(ctx, index, item, event)`

### 滚动与尺寸（3）

`onScroll(ctx, scrollTop, scrollLeft)` · `onResize(ctx, width, height)` · `onReachBottom(ctx, distance)`

### 渲染（2）

| 钩子 | 返回值 | 说明 |
| --- | --- | --- |
| `renderOverlay` | `ReactNode` | 渲染在**滚动容器内部**，可做吸顶层 / 角标 / 概览面板 |
| `renderItemWrapper` | `ReactNode` | 参数 `(ctx, node, index)`，逐层包裹 `renderItem` 的结果 |

## 工具函数

| 导出 | 说明 |
| --- | --- |
| `computeLayout(params)` | 纯函数布局，返回 `{ columns, columnWidth, positions, columnHeights, totalHeight, estimatedCount }` |
| `computeVisibleRange(positions, total, scrollTop, height, overscan)` | 可见区间 |
| `normalizePadding(padding)` | 内边距归一化 |

`computeLayout` 是**可单测的**：传入高度数组就能断言位置，不需要 DOM。这也是等价性测试的入口。
