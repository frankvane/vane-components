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

/**
 * 标签底色是数据侧给的（`{ label, color }`），字色只能按底色亮度选：
 * 统一写死 `#222` 时，深色标签（会员红、橄榄绿）上的深字只有 3.1:1。
 */
function readableOn(bg: string): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(bg.trim());
  if (!m) return "#222";
  let hex = m[1];
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const onWhite = 1.05 / (L + 0.05);
  const onInk = (L + 0.05) / (0.0144 + 0.05);
  return onWhite >= onInk ? "#fff" : "#222";
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
                  color: readableOn(t.color || "#eee"),
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