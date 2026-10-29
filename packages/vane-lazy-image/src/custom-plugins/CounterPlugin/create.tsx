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
              /*
               * 不要写死 #333（ADR-13 第 5 条）：计数器是纯文字，没有自己的底色，
               * 落在深色舞台上就是 #333 / #171513 = 1.44:1 —— 数字直接看不见。
               * 跟随宿主文字色，浅底深字、深底浅字都自动成立。
               */
              color: "inherit",
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
