import React from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface ActivityHeaderPluginConfig extends ActivityPluginConfigBase {
  /** 标题（默认取 data.title） */
  title?: string;
  /** 副标题（一句话说明活动卖点） */
  subtitle?: string;
  /** 标签行（如「限时」「新人专享」） */
  tags?: string[];
  /** 状态徽章文案；不传则按 data.endTime 派生（剩 N 天 / 今日截止 / 已结束） */
  badge?: string;
  /** 标题前的图标（emoji 或字符） */
  icon?: string;
  /** 对齐方式（默认 left） */
  align?: "left" | "center";
}

/** 从截止时间派生徽章文案；无截止时间返回 null（不渲染徽章） */
function deriveBadge(endTime?: string | number): string | null {
  if (endTime === undefined || endTime === null) return null;
  const end = typeof endTime === "number" ? endTime : Date.parse(endTime);
  if (Number.isNaN(end)) return null;
  const ms = end - Date.now();
  if (ms <= 0) return "已结束";
  const days = Math.ceil(ms / 86400000);
  return days <= 1 ? "今日截止" : `剩 ${days} 天`;
}

/**
 * ActivityHeaderPlugin - 活动头部横幅：标题 + 副标题 + 标签 + 状态徽章。
 *
 * 落在 renderHeader 槽（Core 最顶部）。徽章按 data.endTime 派生，插件本身不持有
 * 计时器；需要秒级倒计时请叠加 CountdownTimerPlugin（同页共存不冲突）。
 */
export const createActivityHeaderPlugin: PluginCreator<ActivityHeaderPluginConfig> = (
  config = {}
) => {
  const { title, subtitle, tags = [], badge, icon, align = "left" } = config;

  return {
    name: "ActivityHeaderPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 5,
    config,
    hooks: {
      renderHeader: (context: ActivityPluginContext) => {
        const dataTitle = (context.data as { title?: string } | undefined)?.title;
        const heading = title ?? dataTitle;
        if (!heading && !subtitle) return null;

        const statusBadge =
          badge ??
          deriveBadge((context.data as { endTime?: string | number } | undefined)?.endTime);

        return (
          <header
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 14,
              /* 浅橙底 + 深字（ADR-13）：正文 #1f2328 对 #fff5ee 约 15:1 */
              background: "linear-gradient(135deg, #fff5ee 0%, #fffaf7 100%)",
              border: "1px solid rgba(207,68,7,0.14)",
              textAlign: align === "center" ? "center" : "left",
              justifyContent: align === "center" ? "center" : "flex-start",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  justifyContent: align === "center" ? "center" : "flex-start",
                }}
              >
                {icon && (
                  <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>
                    {icon}
                  </span>
                )}
                <h2
                  style={{
                    margin: 0,
                    fontSize: 19,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    color: "#1f2328",
                  }}
                >
                  {heading}
                </h2>
                {statusBadge && (
                  <span
                    style={{
                      flex: "none",
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "#cf4407",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      lineHeight: 1.6,
                    }}
                  >
                    {statusBadge}
                  </span>
                )}
              </div>

              {subtitle && (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "#5d636a",
                  }}
                >
                  {subtitle}
                </p>
              )}

              {tags.length > 0 && (
                <ul
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    margin: "10px 0 0",
                    padding: 0,
                    listStyle: "none",
                    justifyContent: align === "center" ? "center" : "flex-start",
                  }}
                >
                  {tags.map((tag, i) => (
                    <li
                      key={`${tag}-${i}`}
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "rgba(207,68,7,0.1)",
                        color: "#a33a06",
                        fontSize: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </header>
        );
      },
    },
  };
};

createActivityHeaderPlugin.meta = doc as PluginDoc;
