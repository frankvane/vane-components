# 组合配方

三个开箱配方，装在 `presets/` 子路径。配方只决定「装哪些插件 + 默认参数」，仍然可以在此基础上增删。

```ts
import { photoFeedPreset } from "vane-waterfall/presets/photo-feed";
```

---

## photo-feed · 摄影 / 图文信息流

版式特点：图片高度天然不等、列数随宽度变、滚到底继续加载。

```tsx
import { WaterfallCore, withPlugins } from "vane-waterfall";
import { photoFeedPreset } from "vane-waterfall/presets/photo-feed";

const Waterfall = withPlugins(WaterfallCore, photoFeedPreset({ minColumnWidth: 240, maxColumns: 4 }));

<Waterfall
  items={items}
  containerStyle={{ height: "100vh" }}
  onLoadMore={loadMore}
  keyExtractor={(item) => item.id}
  renderItem={(item) => <PhotoCard {...item} />}
/>;
```

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `minColumnWidth` | `240` | 交给 AutoColumnPlugin |
| `maxColumns` | `4` | 列数上限 |
| `gap` | `16` | 行/列间距 |
| `threshold` | `400` | 距底多少 px 预加载 |

装了：`AutoColumn + Gap + Transition + ReducedMotion + InfiniteScroll + A11y`。
不装 Filter/Sort/Pagination——信息流的默认交互是「无限追加」，加筛选反而要处理回顶。

## product-feed · 商品 / 后台列表

版式特点：等高卡片、有筛选排序、分页、需要点击埋点。

```tsx
import { productFeedPreset } from "vane-waterfall/presets/product-feed";

const Waterfall = withPlugins(WaterfallCore, productFeedPreset({ itemHeight: 300, pageSize: 24 }));

<Waterfall items={items} pageIndex={page} filterFn={fn} sortComparator={cmp} ... />;
```

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `itemHeight` | `300` | FixedHeightPlugin 的统一高度 |
| `pageSize` | `24` | 每页条数 |

装了：`ResponsiveColumns + FixedHeight + Filter + Sort + Pagination + Transition + ClickAnalytics`。
数据管线顺序已由 priority 内置（`40 → 30 → 10`），页面只管把条件塞进 props。

## dashboard · 后台看板卡片流

版式特点：卡片数量大、容器宽度会变（侧栏折叠）、需要位置记忆与快捷键。

```tsx
import { dashboardPreset } from "vane-waterfall/presets/dashboard";

const Waterfall = withPlugins(WaterfallCore, dashboardPreset({ poolSize: 60, layoutDebounce: 200 }));
```

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `scrollThrottle` | `24` | 滚动回调节流 |
| `layoutDebounce` | `200` | 布局防抖（容器宽度变化很频繁） |
| `poolSize` | `60` | Recycle 保持可见的项数 |
| `storageKey` | `"dashboard"` | 状态与书签的 localStorage 前缀 |

装了：`Throttle + DebounceLayout + Recycle + StatePersistence + Bookmark + A11y`。

> 数据量上千时改用 Core 的 `virtualize`，并把 Recycle 去掉——两者互斥。

---

## 自己组合：三条经验

**1. 先定「数据怎么变」，再定「怎么排」**
数据条件（筛选 / 排序 / 搜索 / 翻页）走 data 组，顺序由 priority 决定，不要试图用 props 调整次序。版式（列数 / 间距 / 等高）走 layout 组，两者互不干扰。

**2. 同域只留一个「决策者」**
列数只能有一个来源（AutoColumn **或** ResponsiveColumns），高度只能有一个来源（`item.height` 由 FixedHeight 写，或由数据自带）。两个决策者同开会互相覆盖。

**3. 渲染成本按数据量分档**

| 数据量 | 方案 | 原因 |
| --- | --- | --- |
| < 200 | 什么都不加 | DOM 成本可以忽略 |
| 200–800 | `RecyclePlugin` | 不卸载 DOM，图片不用重载，滚动回来即时可见 |
| > 800 | `virtualize` + `estimateHeight` | 真卸载，节点数恒定；估值要贴近真实高度 |

---

## 调参 SOP

遇到「滚动条乱跳 / 卡片叠在一起 / 最后一屏看不到」时按这个顺序查：

1. **容器有高度吗**：`containerStyle={{ height }}` 或父级撑开。没有高度 → 没有滚动上下文 → 虚拟化与 `onReachBottom` 全失效。
2. **项高度是真的吗**：图片必须占位（`aspect-ratio` 或显式高度）。图片加载后高度变化由项级 ResizeObserver 兜住，但首帧估值偏差大会看到跳动。
3. **`estimateHeight` 贴近实际吗**：虚拟化下这个值决定总高。给个接近中位数的值（不是最小值）。
4. **有互斥插件同开吗**：先看[速查表](plugins.md#速查谁和谁不能一起装)。
5. **过渡还没跑完吗**：`TransitionPlugin` 的中间态会让几何量不准，量之前关掉或等 `duration` 之后再量。
6. **还是不对**：跑 `computeLayout` 的纯函数单测——把当时的高度数组喂进去，看位置对不对，能立刻区分「布局算错」还是「DOM 量错」。
