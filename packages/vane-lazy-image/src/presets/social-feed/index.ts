/**
 * 配方：社交信息流（social-feed）
 *
 * 场景：信息流里大量缩略图快速滚动，重视觉连续性、弱网重试与滚动性能。
 * 组合思路：
 *   - BlurUp + FadeIn：占位到清晰的平滑过渡，避免闪白；
 *   - RetryOnError：弱网下自动重试，减少裂图；
 *   - CacheMemory：会话内缓存，反复滚动不重复请求；
 *   - ViewportDebounce：快速滚动时对进出视口去抖，减少无效加载。
 *
 * 用法：withPlugins(LazyLoadImageCore, socialFeedPreset())
 */
import { createBlurUpPlugin } from "../../custom-plugins/BlurUpPlugin";
import { createFadeInPlugin } from "../../custom-plugins/FadeInPlugin";
import { createRetryOnErrorPlugin } from "../../custom-plugins/RetryOnErrorPlugin";
import { createMemoryCachePlugin } from "../../custom-plugins/CacheMemoryPlugin";
import { createViewportDebouncePlugin } from "../../custom-plugins/ViewportDebouncePlugin";
import type { LazyImagePlugin } from "../../components/LazyLoadImagePlugin/plugins/types";

export const socialFeedPreset = (): LazyImagePlugin[] => [
  createBlurUpPlugin(),
  createFadeInPlugin(),
  createRetryOnErrorPlugin(),
  createMemoryCachePlugin(),
  createViewportDebouncePlugin(),
];
