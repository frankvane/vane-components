import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import doc from "./doc.json";

export interface AchievementItem {
  /** 唯一 id */
  id: string;
  /** 成就标题 */
  title: string;
  /** 成就描述 */
  desc?: string;
  /** 图标字（单/双字占位，无图片资源） */
  glyph?: string;
  /** 图标底色 */
  color?: string;
}

export interface AchievementWallConfig {
  /** 成就列表 */
  items?: AchievementItem[];
  /** 网格列数，默认 4 */
  columns?: number;
  /** 卡片间距（px），默认 10 */
  gap?: number;
  /** 仅在某个页签激活时显示（与 TabSync 联动）；不填则始终显示 */
  tab?: string;
  /** 分组标题 */
  title?: React.ReactNode;
  /** 空列表占位文案 */
  empty?: React.ReactNode;
}

/**
 * AchievementWall - 成就 / 勋章墙：随 activeTab 联动的内容区插件。
 *
 * 走领域槽 `renderContentArea`（Core 有内容插件时以它替代 children）。
 * config.tab 与 context.activeTab 联动：切到对应页签才出墙。
 */
export function createAchievementWallPlugin<T = any>(
  config: AchievementWallConfig = {}
): ProfilePlugin<T> {
  const {
    items = [],
    columns = 4,
    gap = 10,
    tab,
    title,
    empty = "暂无成就",
  } = config;
  return {
    name: "AchievementWall",
    version: "0.1.0",
    description: "成就 / 勋章墙：随 activeTab 联动的内容区插件。",
    priority: 10,
    enabled: true,
    hooks: {
      renderContentArea: (context: ProfilePluginContext<T>) => {
        if (tab && context.activeTab !== tab) return null;
        if (!items.length)
          return (
            <div style={{ padding: 16, opacity: 0.6 }}>{empty}</div>
          );
        return (
          <div className="vp-achievements" style={{ padding: 4 }}>
            {title && (
              <div style={{ fontWeight: 600, margin: "0 0 10px" }}>{title}</div>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap,
              }}
            >
              {items.map((it) => (
                <div
                  key={it.id}
                  title={it.desc}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(125,130,140,0.1)",
                    border: "1px solid rgba(125,130,140,0.18)",
                    textAlign: "center",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: it.color ?? "#2575fc",
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    {it.glyph ?? "★"}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{it.title}</span>
                  {it.desc && (
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{it.desc}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      },
    },
  };
}
