# 图片懒加载 · 组合配方

配方 = 一组插件的预设组合，用来降低「面对一堆插件不知道选谁」的成本。配方是快捷方式，不是白名单——任何插件都可单独引入。

每个配方是一个独立子路径，按需引入、未用到的配方不进产物：

```tsx
import { socialFeedPreset } from "vane-lazy-image/presets/social-feed";
```

## 社交信息流 · social-feed

信息流里大量缩略图快速滚动，重视觉连续性、弱网重试与滚动性能。

```tsx
import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";
import { socialFeedPreset } from "vane-lazy-image/presets/social-feed";

const FeedImage = withPlugins(LazyLoadImageCore, socialFeedPreset());
```

组合：BlurUp + FadeIn + RetryOnError + MemoryCache + ViewportDebounce。

## 商品画廊 · product-gallery

电商商品图，重视觉细节与浏览体验，CLS 敏感（价格/按钮不能跳动）。

```tsx
import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";
import { productGalleryPreset } from "vane-lazy-image/presets/product-gallery";

const ProductImage = withPlugins(LazyLoadImageCore, productGalleryPreset());
```

组合：AspectRatioSpacer + BlurUp + Skeleton + Gallery + HoverZoom + Caption。

## 长文阅读 · content-long-read

文章正文配图，用户以阅读为主，重视布局稳定、SEO 与无障碍。

```tsx
import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";
import { contentLongReadPreset } from "vane-lazy-image/presets/content-long-read";

const ArticleImage = withPlugins(LazyLoadImageCore, contentLongReadPreset());
```

组合：AspectRatioSpacer + BlurUp + FadeIn + ScrollIdle + SEO + A11y。

## 性能优先 · performance-first

首屏性能敏感页面（落地页/活动页），把加载链路的每一环都压到极限。

```tsx
import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";
import { performanceFirstPreset } from "vane-lazy-image/presets/performance-first";

const HeroImage = withPlugins(LazyLoadImageCore, performanceFirstPreset());
```

组合：FetchLoader + IDBCache + ConcurrencyControl + Preconnect + DecodeAfterIdle + DataSaver。

## 离线优先 · offline-first

网络不稳或弱网环境，要求尽可能看到图。兜底图地址必填：

```tsx
import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";
import { offlineFirstPreset } from "vane-lazy-image/presets/offline-first";

const ResilientImage = withPlugins(
  LazyLoadImageCore,
  offlineFirstPreset({ fallbackSrc: "/fallback.png" })
);
```

组合：IDBCache + CachePrewarm + Offline + RetryOnError + FallbackImage。

## 在配方基础上微调

配方返回的是普通插件数组，可自由增删：

```tsx
import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";
import { socialFeedPreset } from "vane-lazy-image/presets/social-feed";
import { createWatermarkPlugin } from "vane-lazy-image/custom-plugins/WatermarkPlugin";

const FeedImage = withPlugins(LazyLoadImageCore, [
  ...socialFeedPreset(),
  createWatermarkPlugin({ text: "© Vane" }), // 追加自定义插件
]);
```

## 如何新增配方

1. 在 `packages/vane-lazy-image/src/presets/<name>/index.ts` 写配方函数（返回 `LazyImagePlugin[]`），文件头注释说明适用场景与组合思路；
2. 在本文档补充对应章节（场景 + 引入代码 + 组合清单）；
3. 提交后子路径 `vane-lazy-image/presets/<name>` 自动生效（`pnpm sync:exports` 会登记）。
