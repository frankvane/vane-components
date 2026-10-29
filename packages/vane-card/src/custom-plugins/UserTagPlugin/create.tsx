/**
 * UserTagPlugin - 用户标签覆盖展示
 */
import type { CardPlugin, PluginCreator } from "../../components/CardPlugin/plugins/types";
import React from "react";

export interface UserTag {
  label: string;
  color?: string;
}

export interface UserTagPluginConfig {
  tags?: UserTag[];
  maxTags?: number;
}

/**
 * 两种形态都收：`["88VIP"]` 与 `[{ label: "88VIP", color: "#b4553c" }]`。
 *
 * `ProductData.tags` 的类型是 `string[]`，而本插件的配置是 `UserTag[]` ——
 * 不做归一化时，直接把商品数据里的 tags 交给它，渲染出来是一排**空标签**
 * （`t.label` 是 undefined），看起来像「插件没生效」。
 */
function normalizeTags(list: unknown): UserTag[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((t) =>
      typeof t === "string"
        ? { label: t }
        : t && typeof t === "object" && "label" in t
          ? (t as UserTag)
          : null
    )
    .filter((t): t is UserTag => Boolean(t?.label));
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
        // 配置优先、data 兜底：与 BadgePlugin 一致（显式配置 > 数据默认值）。
        // 反过来写的话，示例页里传的 tags 会被商品数据顶掉，页面上永远看不到自己配的标签。
        const configured = normalizeTags(tags);
        const list = (configured.length ? configured : normalizeTags((context.data as any)?.tags)).slice(
          0,
          maxTags
        );
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