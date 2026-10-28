/**
 * CounterPlugin —— 图片计数指示器（gallery 增强插件）。
 *
 * 在 galleryToolbarArea 渲染 "当前 / 总数"（如 3 / 8），绑定 context.activeIndex。
 * activeIndex 变化即刷新，与缩略联动/轮播/指示点共用同一协调态。
 */
import React from "react";
import type { GalleryContext, GalleryPlugin } from "../../gallery/types";

export interface CounterConfig {
  /** 前缀文案 */
  prefix?: string;
  /** 分隔符 */
  separator?: string;
}

export function createCounterPlugin(config: CounterConfig = {}): GalleryPlugin {
  const { prefix = "", separator = " / " } = config;
  return {
    name: "gallery-counter",
    version: "1.0.0",
    config,
    hooks: {
      galleryToolbarArea: (context: GalleryContext) => {
        const { activeIndex, images } = context;
        return (
          <span
            style={{
              fontVariantNumeric: "tabular-nums",
              color: "#333",
              fontSize: 13,
              padding: "2px 6px",
              userSelect: "none",
            }}
          >
            {prefix}
            {activeIndex + 1}
            {separator}
            {images.length}
          </span>
        );
      },
    },
  };
}

export default createCounterPlugin;
