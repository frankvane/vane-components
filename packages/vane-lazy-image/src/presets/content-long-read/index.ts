/**
 * 配方：长文阅读（content-long-read）
 *
 * 场景：文章正文配图，用户以阅读为主，重视布局稳定、SEO 与无障碍。
 * 组合思路：
 *   - AspectRatioSpacer：预留比例空间，杜绝图片加载导致的 CLS；
 *   - BlurUp + FadeIn：占位到清晰的柔和过渡，不打断阅读节奏；
 *   - ScrollIdle：滚动停止后再加载，避免与滚动争抢带宽造成卡顿；
 *   - SEO：alt/title 回退、固定 aspectRatio、首屏图 preload 与 LCP 优先；
 *   - A11y：装饰性图片、aria-label 与状态文本，屏幕阅读器友好。
 *
 * 用法：withPlugins(LazyLoadImageCore, contentLongReadPreset())
 */
import { createAspectRatioSpacerPlugin } from "../../custom-plugins/AspectRatioSpacerPlugin";
import { createBlurUpPlugin } from "../../custom-plugins/BlurUpPlugin";
import { createFadeInPlugin } from "../../custom-plugins/FadeInPlugin";
import { createScrollIdlePlugin } from "../../custom-plugins/ScrollIdlePlugin";
import { createSEOPlugin } from "../../custom-plugins/SEOPlugin";
import { createA11yPlugin } from "../../custom-plugins/A11yPlugin";
import type { LazyImagePlugin } from "../../components/LazyLoadImagePlugin/plugins/types";

export const contentLongReadPreset = (): LazyImagePlugin[] => [
  createAspectRatioSpacerPlugin(),
  createBlurUpPlugin(),
  createFadeInPlugin(),
  createScrollIdlePlugin(),
  createSEOPlugin(),
  createA11yPlugin(),
];
