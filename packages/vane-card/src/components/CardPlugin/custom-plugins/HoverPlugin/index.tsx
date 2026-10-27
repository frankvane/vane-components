/**
 * HoverPlugin - 悬停效果插件
 * 负责卡片悬停时的视觉反馈
 */

import type { CardPlugin, PluginCreator } from "../../plugins/types";

export interface HoverPluginConfig {
  enableShadow?: boolean;
  enableScale?: boolean;
  enableBorder?: boolean;
  shadowIntensity?: "light" | "medium" | "heavy";
  scaleRatio?: number;
}

export const createHoverPlugin: PluginCreator<any, HoverPluginConfig> = (
  config = {}
) => {
  const {
    enableShadow = true,
    enableScale = true,
    enableBorder = false,
    shadowIntensity = "medium",
    scaleRatio = 1.02,
  } = config;

  const shadows = {
    light: "0 2px 8px rgba(0,0,0,0.1)",
    medium: "0 4px 12px rgba(0,0,0,0.15)",
    heavy: "0 8px 24px rgba(0,0,0,0.2)",
  };

  const plugin: CardPlugin = {
    name: "HoverPlugin",
    version: "1.0.0",
    description: "悬停效果插件",
    priority: 5,

    hooks: {
      transformProps: (props) => {
        return {
          ...props,
          containerStyle: {
            ...props.containerStyle,
            transition: "all 0.3s ease",
            cursor: "pointer",
          },
        };
      },

      onHover: (context, isHovered) => {
        const container = context.getContainer();
        if (!container) return;

        if (isHovered) {
          if (enableShadow) {
            container.style.boxShadow = shadows[shadowIntensity];
          }
          if (enableScale) {
            container.style.transform = `scale(${scaleRatio})`;
          }
          if (enableBorder) {
            container.style.border = "2px solid #4CAF50";
          }
        } else {
          container.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
          container.style.transform = "scale(1)";
          if (enableBorder) {
            container.style.border = "1px solid #eee";
          }
        }
      },
    },

    config,
  };

  return plugin;
};
