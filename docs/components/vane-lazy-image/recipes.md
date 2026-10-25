# 图片懒加载 · 组合配方

配方 = 一组插件的预设组合，用来降低「面对一堆插件不知道选谁」的成本。

## 基础渐进（最常用）

```tsx
import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";
import { createBlurUpPlugin } from "vane-lazy-image/custom-plugins/BlurUpPlugin";
import { createFadeInPlugin } from "vane-lazy-image/custom-plugins/FadeInPlugin";

export const ProgressiveImage = withPlugins(LazyLoadImageCore, [
  createBlurUpPlugin({ placeholder: "/blur.jpg" }),
  createFadeInPlugin({ durationMs: 400 }),
]);
```

## 电商图片（稳定优先）

```tsx
export const CommerceImage = withPlugins(LazyLoadImageCore, [
  createImageOptimizationPlugin({ widthParam: "w", qualityParam: "q", defaultQuality: 80 }),
  createRetryOnErrorPlugin({ maxRetries: 3, retryDelay: 1000 }),
  createCdnFallbackPlugin({ fallbacks: ["https://cdn2.example.com"] }),
]);
```

## 性能优先（大列表）

```tsx
export const ListImage = withPlugins(LazyLoadImageCore, [
  createPreconnectPlugin({ domains: ["https://images.example.com"] }),
  createPriorityLoadingPlugin({ loading: "lazy", rootMargin: "200px" }),
  createConcurrencyControlPlugin({ maxConcurrent: 4 }),
  createCacheMemoryPlugin({ maxSize: 50 }),
]);
```

## 如何新增配方

1. 在 `docs/components/vane-lazy-image/recipes.md` 写清楚适用场景；
2. 如果配方被 3 个以上页面复用，提升为包内导出（`presets/` 目录）；
3. 配方也是一种插件，可被 `pnpm docs:plugins` 收录。
