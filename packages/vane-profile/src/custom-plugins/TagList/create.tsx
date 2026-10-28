import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import doc from "./doc.json";

export interface TagListConfig {
  /** 标签文本列表 */
  tags: string[];
  /** 整组对齐，默认左对齐 */
  align?: "left" | "center" | "right";
}

/**
 * TagList - 兴趣 / 标签行：一排圆角小标签。
 *
 * 走领域槽 `renderBioArea`（与 BioSlot / SocialLinks 同区，按 priority 串联）。
 * tags 为空时整体返回 null。
 */
export function createTagListPlugin<T = any>(
  config: TagListConfig = { tags: [] }
): ProfilePlugin<T> {
  const { tags, align = "left" } = config;
  return {
    name: "TagList",
    version: "0.1.0",
    description: "兴趣 / 标签行：一排圆角小标签。",
    priority: 12,
    enabled: true,
    hooks: {
      renderBioArea: (_context: ProfilePluginContext<T>) => {
        if (!tags.length) return null;
        return (
          <div
            className="vp-tags"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              justifyContent:
                align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
            }}
          >
            {tags.map((t, i) => (
              <span
                key={i}
                className="vp-tag"
                style={{
                  padding: "2px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  lineHeight: 1.6,
                  background: "rgba(125,130,140,0.16)",
                  color: "inherit",
                  border: "1px solid rgba(125,130,140,0.25)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        );
      },
    },
  };
}
