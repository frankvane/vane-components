/**
 * UserTagPlugin - 用户标签覆盖展示
 */
import type { CardPlugin, PluginCreator } from "../../plugins/types";
import React from "react";

export interface UserTag {
  label: string;
  color?: string;
}

export interface UserTagPluginConfig {
  tags?: UserTag[];
  maxTags?: number;
}

export const createUserTagPlugin: PluginCreator<any, UserTagPluginConfig> = (
  config = {}
) => {
  const { tags = [], maxTags = 3 } = config;

  const plugin: CardPlugin = {
    name: "UserTagPlugin",
    version: "1.0.0",
    description: "在图片区域叠加用户标签",
    priority: 35,
    hooks: {
      renderOverlay: (context) => {
        const dataTags: UserTag[] = (context.data as any)?.tags || [];
        const list = (dataTags.length ? dataTags : tags).slice(0, maxTags);
        if (!list.length) return null;

        return (
          <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 6, flexWrap: "wrap", zIndex: 9 }}>
            {list.map((t) => (
              <span
                key={t.label}
                style={{
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  background: t.color || "#eee",
                  color: "#222",
                }}
              >
                {t.label}
              </span>
            ))}
          </div>
        );
      },
    },
    config,
  };

  return plugin;
};