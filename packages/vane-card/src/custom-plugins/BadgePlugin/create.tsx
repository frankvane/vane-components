/**
 * BadgePlugin - 徽章插件
 * 负责渲染商品徽章（如：甄选、热卖等）
 */

import type { CardPlugin, PluginCreator } from "../../components/CardPlugin/plugins/types";

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
        const type: keyof typeof palette =
          (config.type as keyof typeof palette) ||
          (context.data?.badgeType as keyof typeof palette) ||
          "default";

        if (!text) return null;

        // 根据类型设置颜色。底色和字色成对给：
        // 原来统一用白字，压在金色（1.4:1）、橙红（3.2:1）、绿（2.8:1）上全都读不清，
        // 亮底必须配深字 —— 徽章是「一眼要看清两个字」的元件。
        const palette = {
          premium: { bg: "#FFD700", fg: "#3d2f00" },
          hot: { bg: "#c4390f", fg: "#fff" },
          new: { bg: "#2e7d32", fg: "#fff" },
          sale: { bg: "#c62828", fg: "#fff" },
          default: { bg: "#6b6b6b", fg: "#fff" },
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
              background: palette[type].bg,
              color: palette[type].fg,
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
