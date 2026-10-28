/**
 * ThumbPreloadPlugin —— 相邻图预加载（gallery 增强插件）。
 *
 * 监听 onActiveChange 事件（GalleryCore 在主图切换后广播），预加载后续 lookahead 张
 * 及（可选）前一张到浏览器缓存（new Image().src），使切换主图时近乎瞬时。
 * 用模块级 Set 去重，同一 URL 只预热一次。纯副作用插件，不渲染 UI。
 */
import type { GalleryContext, GalleryPlugin } from "../../gallery/types";

export interface ThumbPreloadConfig {
  /** 向后预加载张数 */
  lookahead?: number;
  /** 是否也预加载前一张 */
  alsoPrevious?: boolean;
}

const preloaded = new Set<string>();

export function createThumbPreloadPlugin(
  config: ThumbPreloadConfig = {}
): GalleryPlugin {
  const { lookahead = 1, alsoPrevious = false } = config;

  return {
    name: "gallery-thumb-preload",
    version: "1.0.0",
    config,
    hooks: {
      onActiveChange: (context: GalleryContext, index: number) => {
        const { images } = context;
        const targets: number[] = [];
        for (let k = 1; k <= lookahead; k++) {
          const i = index + k;
          if (i < images.length) targets.push(i);
        }
        if (alsoPrevious) {
          const p = index - 1;
          if (p >= 0) targets.push(p);
        }
        for (const i of targets) {
          const src = images[i]?.src;
          if (!src || preloaded.has(src)) continue;
          preloaded.add(src);
          const img = new Image();
          img.src = src;
        }
      },
    },
  };
}

export default createThumbPreloadPlugin;
