# 插件

26 个插件，5 组。**执行顺序由 `priority` 决定（越大越先）**，与阅读顺序无关；下表按组列出并标注 priority。

导入方式：

```ts
import { createFilterPlugin } from "vane-waterfall/custom-plugins/FilterPlugin";
// 或一次拿到全部（逃生口）
import { createFilterPlugin } from "vane-waterfall/custom-plugins";
```

---

## 布局（layout）

### AutoColumnPlugin `priority 55`

按容器宽度算列数：`floor((可用宽度 + columnGap) / (minColumnWidth + columnGap))`。

```ts
createAutoColumnPlugin({ minColumnWidth: 220, maxColumns: 4 });
```

| 配置 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `minColumnWidth` | `number` | — | **必填**，每列最小宽度 |
| `maxColumns` | `number` | `Infinity` | 列数上限 |
| `minColumns` | `number` | `1` | 列数下限 |

走 D1-A 布局钩子 `calculateColumns`，拿到的是**容器**宽度而不是 `window.innerWidth`——嵌在侧边栏里也算得对。

### ResponsiveColumnsPlugin `priority 55`

按断点表决定列数，命中哪档用哪档（`width` 升序匹配）。

```ts
createResponsiveColumnsPlugin({
  breakpoints: {
    sm: { width: 0, columns: 2 },
    md: { width: 720, columns: 3 },
    lg: { width: 1080, columns: 4 },
  },
});
```

| 配置 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `breakpoints` | `Record<string, {width, columns}>` | — | **必填**，键名随意 |
| `fallbackColumns` | `number` | `props.columns ?? 3` | 未命中任何断点时用 |

> **与 AutoColumnPlugin 互斥**：两者都改列数，同开会交替覆盖。选「最小列宽」还是「断点表」，不要都装。

### AlignmentPlugin `priority 60`

改 `alignmentMode`：`shortest`（最矮列）/ `balanced`（最少项）/ `sequential`（轮转）。

```ts
createAlignmentPlugin({ mode: "balanced" });
```

### GapPlugin `priority 50`

把 `rowGap` / `columnGap` 收到一处配置，支持按窗口宽度换档。

```ts
createGapPlugin({
  columnGap: 16,
  rowGap: 16,
  responsive: { sm: { columnGap: 8, rowGap: 8 }, lg: { columnGap: 20, rowGap: 20 } },
});
```

`responsive` 的键是 `sm|md|lg|xl`，阈值分别是 768 / 992 / 1200。

### FixedHeightPlugin `priority 45`

把每项高度统一成固定值（等高网格）。

```ts
createFixedHeightPlugin({ itemHeight: 176 });
```

> **它改的是 `item.height` 字段**，Core 量的是 DOM 的 `offsetHeight`。所以卡片必须真的按 `height` 渲染，否则插件等于没开。

### PinItemPlugin `priority 100`

把指定项钉在某列顶部，普通项落到该列且低于置顶块底部时自动下推。

```ts
createPinItemPlugin({ pinnedIndices: [0, 1], column: 0 });
```

| 配置 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `pinnedIndices` | `number[]` | — | **必填**，建议用小索引（0..n） |
| `column` | `number` | `0` | 钉到第几列 |

限制：置顶项若索引**大于**该列已排好的项，会把后续项往下推但已布局的项不回退，视觉上会重叠。同一列多条置顶按 `pinnedIndices` 顺序纵向堆叠。

> 这个插件在 1.x 里是彻底空转的：逻辑全压在 `calculateItemPosition` 上，而旧 Core 没有任何地方执行这个钩子。

---

## 性能与动效（perf）

### ThrottlePlugin `priority 80`

改 Core 的 `throttleDelay` / `debounceDelay`。

```ts
createThrottlePlugin({ scroll: 16, resize: 120 });
```

### DebounceLayoutPlugin `priority 75`

只改 `debounceDelay`：拖拽窗口、展开收起这类「尺寸连续变化」的场景，把防抖拉长能明显降抖动。

```ts
createDebounceLayoutPlugin({ delay: 160 });
```

### TransitionPlugin `priority 0`

给每项加 `transform / opacity` 的 CSS 过渡，重排时位置不瞬移。

```ts
createTransitionPlugin({ duration: 240, easing: "cubic-bezier(.22,.61,.36,1)" });
```

过渡会让「位置变化」有 200–300ms 的中间态，所以自动化量几何时要么等过渡结束，要么关掉它。

### ReducedMotionPlugin `priority 65`

检测 `prefers-reduced-motion: reduce`，命中后关掉 `useTransform`、清掉过渡。

```ts
createReducedMotionPlugin({ disableTransform: true, removeTransitions: true });
```

> **与 TransitionPlugin 同开等于把过渡关掉**——不是冲突，是预期行为，但别以为动效还在。

---

## 数据管线（data）

四个插件按固定 priority 串联，顺序不能乱：

```
Filter(40) → Sort(30) → Search(20) → Pagination(10)
```

先过滤再分页，页数才是过滤后的总数；顺序反了会出现「第 2 页是空的」。

### FilterPlugin `priority 40`

```ts
createFilterPlugin({ predicate: (item) => item.inStock, scrollToTop: false });
```

优先读 `props.filterFn`，没有就用工厂里的 `predicate`。谓词抛错时按「保留」处理，不会整表消失。

### SortPlugin `priority 30`

```ts
createSortPlugin({ comparator: (a, b) => b.likes - a.likes });
```

优先读 `props.sortComparator`。排序作用在**已过滤**的全量集合上。

### SearchPlugin `priority 20`

```ts
createSearchPlugin({ fields: ["title", "author"], scrollToTop: true });
```

读 `props.searchQuery`，大小写不敏感的包含匹配。`fields` 不给就扫全部可枚举字段（容易把 `undefined` 也扫一遍，建议显式给）。

### PaginationPlugin `priority 10`

```ts
createPaginationPlugin({ pageSize: 15, scrollToTop: true });
```

读 `props.pageIndex`（1 基）/ `props.pageSize`，对 `items` 切片。

### InfiniteScrollPlugin `priority 35`

```ts
createInfiniteScrollPlugin({ threshold: 600 });
```

`transformProps` 把 `reachBottomOffset` 写成 `threshold`，`onReachBottom` 里带并发锁 + `hasMore` 判断。

> **与 PaginationPlugin 互斥**：一个追加、一个切片，同开会「翻到第 2 页又看到第 1 页」。
> `context.hasMore` 默认 `true`；页面要停止加载时让插件 `setState({ hasMore: false })`，或在 `onLoadMore` 里自己短路。

---

## 交互与埋点（interaction）

### ClickAnalyticsPlugin `priority 0`

统计点击次数并 `bus.emit("analytics:click", { index, item, event, total })`。

```ts
createClickAnalyticsPlugin({ showOverlay: true, log: false });
```

`showOverlay` 默认 **false**（生产版式不该有角标），示例页打开它是为了肉眼确认钩子真的触发。

### HeatmapAnalyticsPlugin `priority 0`

统计每项**曝光次数**与点击次数，可选顶栏汇总条。

```ts
createHeatmapAnalyticsPlugin({ showOverlay: true });
```

`onLayoutComplete` 里补一次首屏曝光统计，避免首帧显示 0。

### DragReorderPlugin `priority 0`

HTML5 原生拖拽，松手时把 `from/to` 交给页面。

```ts
createDragReorderPlugin({
  showHandle: true,
  onReorder: (from, to, item) => setItems((prev) => move(prev, from, to)),
});
```

| 配置 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 关掉后完全不包 DOM |
| `onReorder` | `(from, to, item) => void` | — | **数组怎么改由页面决定**，插件不碰数据 |
| `showHandle` | `boolean` | `false` | 虚线边框提示可拖，接入真实版式时要关 |

装配位置：`onReorder` 要改组件 state 时，把 `withPlugins` 放进 `useMemo`，不要放模块顶层（闭包拿不到 `setState`）。

### ScrollAnchorPlugin `priority 0`

监听 `bus` 上的 `anchor:scrollToId`，按 id 找到索引后 `scrollToItem`。

```ts
createScrollAnchorPlugin({ getAnchorId: (item) => item.id });
// 触发：ctx.bus.emit("anchor:scrollToId", { id: "post-42" })
```

页面拿不到 `bus`（ref 只透传 Core），所以页面侧要么直接 `ref.scrollToItem(index)`，要么写一个极小插件把 DOM 事件转成 bus 事件——见场景「长文归档」。

### RecyclePlugin `priority 0`

离屏项设 `visibility: hidden`，DOM 保留，减少绘制成本。

```ts
createRecyclePlugin({ poolSize: 16 });
```

> **与 `virtualize` 互斥**：几百项用 Recycle（不卸载，图片不用重载），上千项用 `virtualize`（真卸载）。

---

## 语义与状态（ui）

### A11yPlugin `priority 0`

给容器与项补 `role` / `aria-label` / `tabIndex`。

```ts
createA11yPlugin({
  containerRole: "list",
  itemRole: "listitem",
  containerLabel: "摄影作品列表",
  enableTabIndex: false,
});
```

容器属性写在 `onMount` / `onLayoutComplete` 里（而不是渲染期的 `renderOverlay` 副作用），项用 `renderItemWrapper` 包一层。

### GroupingPlugin `priority 0`

按字段分组，结果写进 `sharedData.get("GROUPS")`（`Map<组键, 索引数组>`），并 `bus.emit("grouping:change")`。

```ts
createGroupingPlugin({ groupBy: (item) => item.tag, showOverlay: false });
```

挂载即算 + 布局完成重算 + props 变化重算——1.x 只在 `onPropsChange` 里算，首屏永远是空的。

### StickyHeaderPlugin `priority 0`

读 `GROUPS` 的第一个组名，渲染一个 `position: sticky` 的标题条。

```ts
createStickyHeaderPlugin({ title: "当前分组", showHint: false });
```

实验版：只显示首组。要「滚动时跟随当前组」需要自己订阅 `grouping:change` + `visibleRange` 再写插件。

### BookmarkPlugin `priority 0`

键盘位置书签：按 `b` 记当前位置到 `localStorage`，按 `r` 跳回。输入框内不触发。

```ts
createBookmarkPlugin({ storageKey: "feed-bookmark", scrollBehavior: "smooth" });
```

### StatePersistencePlugin `priority 0`

卸载时把 `scrollTop` 与指定 props 键写入 `localStorage`，挂载时**只注入一次**。

```ts
createStatePersistencePlugin({
  storageKey: "feed-state",
  persistScroll: true,
  persistKeys: ["pageIndex", "pageSize", "searchQuery"],
});
```

### URLSyncPlugin `priority 0`

把条件写进 URL，刷新与分享能复现同一屏。

```ts
createURLSyncPlugin({ mode: "search", keys: ["searchQuery", "pageIndex"] });
```

`mode: "hash"` 写 `location.hash`，`"search"` 写 `location.search`。注意 hash 路由的站点用 `"search"` 会把参数加到 `?` 后面（不影响路由，但 URL 会变长）。

---

## 速查：谁和谁不能一起装

| A | B | 原因 |
| --- | --- | --- |
| AutoColumnPlugin | ResponsiveColumnsPlugin | 都改列数，交替覆盖 |
| InfiniteScrollPlugin | PaginationPlugin | 追加 vs 切片，页码错乱 |
| RecyclePlugin | `virtualize` | 隐藏 vs 卸载，互相打架 |
| TransitionPlugin | ReducedMotionPlugin | 后者会把过渡清掉（预期行为） |

在插件工坊里勾到冲突组合时，页面顶部会直接列出这几条提示。
