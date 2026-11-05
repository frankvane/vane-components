import type { CardPlugin, PluginCreator } from "../../components/CardPlugin/plugins/types";
import React from "react";

import { GalleryHeaderComp, type Slide } from "./internal";

export interface GalleryPluginConfig {
  images?: string[];
  autoplay?: boolean;
  interval?: number;
  showIndicators?: boolean;
  enableZoom?: boolean;
  showThumbnails?: boolean;
  style?: React.CSSProperties;
  videoSrc?: string;
  videoPoster?: string;
  /** 图片加载失败时的兜底图；不传则隐藏破图，不再硬编码 /404.jpg */
  errorFallbackSrc?: string;
  // 渲染位置控制（供 withPlugins 读取）
  headerPosition?: "before" | "after";
  order?: number;
  // 将视频插入到第 N 个位置（1 开始）。默认在末尾
  videoIndex?: number;
}

/** 画廊从 data 里读取的字段（ProductData 之外还允许宿主自定义） */
type GalleryData = {
  name?: string;
  images?: string[];
  image?: string;
  video?: string;
  poster?: string;
};

// 公共契约位：工厂泛型默认值 any 保留（不写 T 的调用方依赖默认值）。
export const createGalleryPlugin: PluginCreator<any, GalleryPluginConfig> = (
  config = {}
) => {
  const {
    autoplay = false,
    interval = 3000,
    showIndicators = true,
    enableZoom = false,
    showThumbnails = true,
    style = {},
    videoSrc,
    videoPoster,
    errorFallbackSrc,
  } = config;

  const plugin: CardPlugin = {
    name: "GalleryPlugin",
    version: "1.0.0",
    description: "图片画廊插件（头部区域轮播）",
    priority: 40,
    hooks: {
      renderHeader: (context) => {
        const data = context.data as GalleryData | undefined;
        const imgs: string[] =
          config.images || data?.images || (data?.image ? [data.image] : []);
        const vSrc = videoSrc || data?.video;

        const slides: Slide[] = [
          ...imgs.map((src) => ({ type: "image" as const, src, thumb: src })),
        ];
        if (vSrc) {
          const poster = videoPoster || data?.poster || imgs[0];
          const videoSlide: Slide = { type: "video", src: vSrc, thumb: poster || "" };
          const totalImages = slides.length;
          const desired = (config.videoIndex ?? totalImages + 1) - 1;
          const insertIndex = Math.max(0, Math.min(totalImages, desired));
          slides.splice(insertIndex, 0, videoSlide);
          // 标记由 GalleryHeaderComp 的 effect 写入（渲染期写总线不安全，见 P2-6）
        }
        if (!slides.length) return null;

        return (
          <GalleryHeaderComp
            slides={slides}
            style={style}
            enableZoom={enableZoom}
            autoplay={autoplay}
            interval={interval}
            showIndicators={showIndicators}
            showThumbnails={showThumbnails}
            errorFallbackSrc={errorFallbackSrc}
            context={context}
          />
        );
      },
    },
    config,
  };

  return plugin;
};
