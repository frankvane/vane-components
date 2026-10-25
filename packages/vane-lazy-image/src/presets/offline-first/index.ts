/**
 * 配方：离线优先（offline-first）
 *
 * 场景：网络不稳或弱网环境（野外/移动网络/内网），要求尽可能看到图。
 * 组合思路：
 *   - CacheIDB：持久缓存，已看过的图离线可用；
 *   - CachePrewarm：进入视口即预热，切网前把图写进缓存；
 *   - OfflinePlugin：断网时给出明确的离线提示，而非无限转圈；
 *   - RetryOnError：网络恢复后自动重试，指数退避避免打满带宽；
 *   - FallbackImage：最终兜底，失败也展示一张占位图。
 *
 * 用法：
 *   withPlugins(LazyLoadImageCore, offlineFirstPreset({ fallbackSrc: "/fallback.png" }))
 */
import { createIDBCachePlugin } from "../../custom-plugins/CacheIDBPlugin";
import { createCachePrewarmPlugin } from "../../custom-plugins/CachePrewarmPlugin";
import { createOfflinePlugin } from "../../custom-plugins/OfflinePlugin";
import { createRetryOnErrorPlugin } from "../../custom-plugins/RetryOnErrorPlugin";
import { createFallbackImagePlugin } from "../../custom-plugins/FallbackImagePlugin";
import type { LazyImagePlugin } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface OfflineFirstPresetOptions {
  /** 最终兜底图地址（必填，加载与缓存都失败时展示） */
  fallbackSrc: string;
}

export const offlineFirstPreset = ({
  fallbackSrc,
}: OfflineFirstPresetOptions): LazyImagePlugin[] => [
  createIDBCachePlugin(),
  createCachePrewarmPlugin(),
  createOfflinePlugin(),
  createRetryOnErrorPlugin(),
  createFallbackImagePlugin({ fallbackSrc }),
];
