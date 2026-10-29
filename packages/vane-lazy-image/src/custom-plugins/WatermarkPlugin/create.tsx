import React from "react";
import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface WatermarkPluginConfig {
  text?: string | ((src: string) => string);
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  opacity?: number; // 0~1
  fontSize?: number; // px
  color?: string;
  offsetX?: number; // px
  offsetY?: number; // px
  zIndex?: number;
  enabled?: boolean;
}

export function createWatermarkPlugin(
  config: WatermarkPluginConfig = {}
): LazyImagePlugin {
  const {
    text = "© 2024 Vane",
    position = "bottom-right",
    opacity = 0.8,
    fontSize = 12,
    color = "#fff",
    offsetX = 8,
    offsetY = 8,
    zIndex = 2,
    enabled = true,
  } = config;

  const plugin: LazyImagePlugin = {
    name: "watermark",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => {
        if (!enabled) return null;

        const label = typeof text === "function" ? text(context.src) : text;

        const baseStyle: React.CSSProperties = {
          position: "absolute",
          pointerEvents: "none",
          color,
          opacity,
          fontSize,
          fontWeight: 500,
          /*
           * 描边必须是暗的。原来写的是 rgba(255,255,255,0.5)：
           * 白字 + 白色光晕，压在浅色图上等于两头都在增亮，字彻底糊掉；
           * 深色描边会在字周围压出一圈局部对比，浅图深图都能看清轮廓。
           */
          textShadow: "0 1px 2px rgba(0,0,0,0.55)",
          zIndex,
        };

        const posStyle: Record<string, React.CSSProperties> = {
          "top-left": { top: offsetY, left: offsetX },
          "top-right": { top: offsetY, right: offsetX },
          "bottom-left": { bottom: offsetY, left: offsetX },
          "bottom-right": { bottom: offsetY, right: offsetX },
          center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
        };

        /*
         * 水印是「图片的一部分」，不是正文 —— WCAG 1.4.3 对「属于含有其他
         * 重要视觉内容的图片的文字」明确豁免，所以这里不改 opacity（它本来就是
         * 这个插件的可配置产品特性），而是把语义交给 aria：
         * 读屏不该在 alt 之后再把「VANE」「© 2026 Vane」念一遍。
         */
        return (
          <div aria-hidden="true" style={{ ...baseStyle, ...posStyle[position] }}>
            {label}
          </div>
        );
      },
    },
  };

  return plugin;
}