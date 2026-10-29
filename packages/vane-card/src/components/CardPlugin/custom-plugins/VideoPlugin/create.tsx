import type { CardPlugin, PluginCreator } from "../../plugins/types";

import React from "react";

export interface VideoPluginConfig {
  src?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  poster?: string;
  playOnHover?: boolean;
  style?: React.CSSProperties;
  // 渲染位置控制（供 withPlugins 读取）
  headerPosition?: "before" | "after";
  order?: number;
}

export const createVideoPlugin: PluginCreator<any, VideoPluginConfig> = (
  config = {}
) => {
  const {
    autoplay = false,
    muted = true,
    loop = false,
    controls = true,
    poster,
    playOnHover = false,
    style = {},
  } = config;

  const plugin: CardPlugin = {
    name: "VideoPlugin",
    version: "1.0.0",
    description: "视频展示插件（头部区域）",
    priority: 40,
    hooks: {
      renderHeader: (context) => {
        // 若画廊已声明处理视频，则避免重复渲染
        if (context.bus?.getData?.("media.handledByGallery")) {
          return null;
        }
        const videoSrc = (context.data as any)?.video || config.src;
        if (!videoSrc) return null;

        return (
          <div style={{ width: "100%", aspectRatio: "16 / 9", overflow: "hidden", borderRadius: "8px 8px 0 0", background: "#000" }}>
            <video
              autoPlay={autoplay}
              muted={muted}
              loop={loop}
              controls={controls}
              poster={poster || (context.data as any)?.poster}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }}
            >
              <source src={videoSrc} />
            </video>
          </div>
        );
      },
      onHover: (context, isHovered) => {
        if (!playOnHover) return;
        // 若视频由画廊处理，跳过悬停控制，避免获取错误元素
        if (context.bus?.getData?.("media.handledByGallery")) return;
        const container = context.getContainer();
        const video = container?.querySelector("video");
        if (video) {
          // eslint-disable-next-line
          isHovered ? video.play?.() : video.pause?.();
        }
      },
    },
    config,
  };

  return plugin;
};