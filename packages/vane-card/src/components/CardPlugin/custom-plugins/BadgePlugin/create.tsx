/**
 * BadgePlugin - 徽章插件
 * 负责渲染商品徽章（如：甄选、热卖等）
 */

import type { CardPlugin, PluginCreator } from "../../plugins/types";

import React from "react";

export interface BadgePluginConfig {
  text?: string;
  type?: "premium" | "hot" | "new" | "sale" | "default";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  customStyle?: React.CSSProperties;
}

export const createBadgePlugin: PluginCreator<any, BadgePluginConfig> = (
  config = {}
) => {
  const { position = "top-right", customStyle = {} } = config;

  const plugin: CardPlugin = {
    name: "BadgePlugin",
    version: "1.0.0",
    description: "徽章插件",
    priority: 15,

    hooks: {
      renderOverlay: (context) => {
        // 优先使用 config 中的配置，其次从 context.data 读取
        const text = config.text || context.data?.badge;
        const type: keyof typeof colors =
          (config.type as keyof typeof colors) ||
          (context.data?.badgeType as keyof typeof colors) ||
          "default";

        if (!text) return null;

        // 根据类型设置颜色
        const colors = {
          premium: "#FFD700",
          hot: "#FF5722",
          new: "#4CAF50",
          sale: "#F44336",
          default: "#999",
        };

        // 根据位置设置定位
        const positions = {
          "top-left": { top: "8px", left: "8px" },
          "top-right": { top: "8px", right: "8px" },
          "bottom-left": { bottom: "8px", left: "8px" },
          "bottom-right": { bottom: "8px", right: "8px" },
        };

        return (
          <div
            style={{
              position: "absolute",
              ...positions[position],
              padding: "4px 12px",
              background: colors[type],
              color: "#fff",
              fontSize: "12px",
              fontWeight: "bold",
              borderRadius: "4px",
              zIndex: 10,
              pointerEvents: "none",
              ...customStyle,
            }}
          >
            {text}
          </div>
        );
      },
    },

    config,
  };

  return plugin;
};
