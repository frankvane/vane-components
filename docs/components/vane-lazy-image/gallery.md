# 商品图集引擎（gallery）

> `vane-lazy-image` 的子特性：把「多图容器 + 主图实例」做成插件化图集，主图直接复用 `LazyLoadImageCore` 的全部能力（懒加载 / 占位 / 容灾 / 单图插件链）。

## 为什么是子特性而不是独立包

图集的主图本质上就是一张带懒加载与插件链的图片。独立成包（B1）会复制一整套图片内核（≈6.9KB）并重复维护；并入 `vane-lazy-image` 走独立子路径（B1-B），主图直接 `withPlugins(LazyLoadImageCore, mainPlugins)` 渲染 `images[activeIndex]`，单图插件零改动复用。详见 [ADR-19](../../docs/guide/decisions.md)。

## 安装与引入

gallery 不进根桶，独立子路径引入：

```tsx
import {
  GalleryCore,
  createGallery,
  useGalleryRuntime,
  renderGallerySlot,
} from "vane-lazy-image/gallery";
```

可选 gallery 域插件走 `custom-plugins` 子路径（与单图插件同体系）：

```tsx
import { createCarouselPlugin } from "vane-lazy-image/custom-plugins/CarouselPlugin";
import { createFullscreenPlugin } from "vane-lazy-image/custom-plugins/FullscreenPlugin";
import { createZoomControlPlugin } from "vane-lazy-image/custom-plugins/ZoomControlPlugin";
import { createThumbPreloadPlugin } from "vane-lazy-image/custom-plugins/ThumbPreloadPlugin";
import { createHotspotPlugin } from "vane-lazy-image/custom-plugins/HotspotPlugin";
import { createFavoritePlugin } from "vane-lazy-image/custom-plugins/FavoritePlugin";
```

## 30 秒上手

```tsx
import { GalleryCore } from "vane-lazy-image/gallery";
import { createThumbSyncPlugin } from "vane-lazy-image/custom-plugins/ThumbSyncPlugin";

const images = [
  { src: "a.jpg", alt: "正面" },
  { src: "b.jpg", alt: "侧面" },
  { src: "c.jpg", alt: "细节" },
];

// 不传 plugins 时默认用 galleryPreset()（缩略联动 + 360 + 计数 + 指示点）
<GalleryCore images={images} />
```

## 两层插件模型

gallery 有**两层**插件，互不干扰：

1. **图集域插件**（`GalleryPlugin`）：经 `context.activeIndex / frameIndex / zoom / favorited` 协调图集整体行为。缩略联动、计数、指示点、轮播、全屏、热点、收藏、相邻预加载都属于这一层。
2. **单图插件**（`LazyImagePlugin`）：通过 `mainPlugins` 挂到主图实例上，作用于当前主图本身（放大镜、视频位、灯箱、价格标签、促销角标、社交分享、下载按钮 …）。它们与图集域插件共用同一套插件内核，零改动接入。

```tsx
import { createPriceTagPlugin } from "vane-lazy-image/custom-plugins/PriceTagPlugin";
import { createHoverZoomPlugin } from "vane-lazy-image/custom-plugins/HoverZoomPlugin";

<GalleryCore
  images={images}
  mainPlugins={[createPriceTagPlugin(), createHoverZoomPlugin()]}
  plugins={[createThumbSyncPlugin(), createZoomControlPlugin(), createFavoritePlugin()]}
/>
```

## 协调态（context）

图集域插件拿到的 `GalleryContext` 在 `PluginContext` 之上追加：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `images` | `GalleryImage[]` | 图集全部图片 |
| `activeIndex` | `number` | 当前主图索引 |
| `setActiveIndex(i)` | `(i: number) => void` | 切换主图（自动 clamp 到 `[0, max]`） |
| `frameIndex` | `number` | 360° 环物当前帧 |
| `setFrameIndex(i)` | `(i: number) => void` | 切换 360 帧 |
| `zoom` | `number` | 主图缩放比例（默认 1） |
| `setZoom(z)` | `(z: number) => void` | 设置缩放 |
| `favorited` | `boolean` | 收藏态 |
| `setFavorited(v)` | `(v: boolean) => void` | 切换收藏 |

> 这些字段由 `useGalleryRuntime` 用 `useState` 持有，变更即 `GalleryCore` 重渲染——所有图集域插件同步刷新，**无需手动 `forceUpdate`**（不同于 `vane-waterfall` 的闭包态）。

## 图集域插件清单（10 个）

`galleryPreset()` 默认组合 4 个核心插件；其余 6 个按需引入（保持 tree-shaking）。

| 插件 | 工厂 | 领域槽 / 事件 | 作用 |
| --- | --- | --- | --- |
| 缩略联动 | `createThumbSyncPlugin` | `galleryThumbArea` | 缩略图条，点击切换主图 |
| 360 环物 | `createSpin360Plugin` | `galleryOverlay` | 把图片序列当帧，拖拽 / 自动旋转 |
| 计数 | `createCounterPlugin` | `galleryToolbarArea` | 显示 `当前 / 总数` |
| 指示点 | `createIndicatorPlugin` | `galleryToolbarArea` | 圆点指示器，点击跳图 |
| 轮播 | `createCarouselPlugin` | `galleryToolbarArea` | 播放 / 暂停自动轮播，悬停暂停 |
| 缩放控制 | `createZoomControlPlugin` | `galleryToolbarArea` | − / 重置 / + 按钮调 `zoom` |
| 全屏 | `createFullscreenPlugin` | `galleryToolbarArea` | 图集根容器全屏切换 |
| 相邻预加载 | `createThumbPreloadPlugin` | `onActiveChange` | 切换主图后预热后续张 |
| 热点 | `createHotspotPlugin` | `galleryOverlay` | 主图百分比定位的可交互热点 |
| 收藏 | `createFavoritePlugin` | `galleryToolbarArea` | 心形按钮，绑定 `favorited` |

### 配置示例

```tsx
createThumbSyncPlugin({ gap: 8, thumbWidth: 64, thumbHeight: 64, showActiveRing: true })
createSpin360Plugin({ sensitivity: 6, autoPlay: false, autoPlayInterval: 120 })
createCounterPlugin({ prefix: "", separator: " / " })
createIndicatorPlugin({ size: 8, gap: 6, activeColor: "#2b7de9" })
createCarouselPlugin({ interval: 3000, autoStart: false, pauseOnHover: true })
createZoomControlPlugin({ step: 0.5, min: 1, max: 4 })
createFullscreenPlugin({ enterLabel: "⛶ 全屏", exitLabel: "✕ 退出" })
createThumbPreloadPlugin({ lookahead: 1, alsoPrevious: false })
createHotspotPlugin({ hotspots: [{ x: 50, y: 50, label: "核心卖点", href: "/detail" }] })
createFavoritePlugin({ onChange: (fav) => saveFav(fav) })
```

## 自定义图集

不想用默认预设，自己组合插件：

```tsx
import { createGallery } from "vane-lazy-image/gallery";

const ProductGallery = createGallery({
  plugins: [
    createThumbSyncPlugin(),
    createZoomControlPlugin(),
    createCarouselPlugin({ autoStart: true }),
    createFavoritePlugin(),
  ],
});

<ProductGallery images={images} mainPlugins={[createPriceTagPlugin()]} />
```

## 体积与预算

`vane-lazy-image/gallery` 子路径闭包实测 **18.4KB gzip**（预算 20KB），构成：图片内核 `LazyLoadImageCore` 5.14KB（复用，非重复）+ 插件运行时 `withPlugins` 3.55KB（共享）+ `PerformanceMonitor` 2.24KB（被内核静态依赖，耦合无法摘除）+ GalleryCore 框架 ~4.7KB + 默认预设 4 个域插件 2.78KB。规划原 4.0KB 口径基于「独立包自己实现最小内核」假设，并入后失效，据实上调并写进 `gallerySizeBudgetNote`（[ADR-19](../../docs/guide/decisions.md)）。真正可选的 6 个域插件保持按需引入，tree-shaking 仍成立；根入口 26.9KB 不受影响。

## 文档

- [API](api.md)
- [插件目录](plugins.md)
- [组合配方](recipes.md)
- [关键决策 ADR-19](../../docs/guide/decisions.md)
