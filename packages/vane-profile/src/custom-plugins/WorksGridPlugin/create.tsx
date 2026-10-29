import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import doc from "./doc.json";

export interface WorkItem {
  /** 唯一 id（作 React key） */
  id: string;
  /** 标题 */
  title: string;
  /** 封面图 URL（优先于 coverColor） */
  cover?: string;
  /** 无封面图时的纯色占位（CSS 颜色） */
  coverColor?: string;
  /** 副信息（时长 / 点赞 / 日期…） */
  meta?: React.ReactNode;
}

export interface WorksGridConfig {
  /** 作品列表 */
  items: WorkItem[];
  /** 列数，默认 3 */
  columns?: number;
  /** 卡片间距，默认 10 */
  gap?: number;
  /**
   * 仅在某个页签激活时显示（与 TabSync 联动）。
   * 不填则始终显示（适合没有页签、以作品为主页内容的主页）。
   */
  tab?: string;
  /** 标题（网格上方的分组标题，可选） */
  title?: React.ReactNode;
  /** 空列表时的占位文案 */
  empty?: React.ReactNode;
}

const FALLBACK_COLORS = [
  "#6a11cb",
  "#2575fc",
  "#11998e",
  "#ff7e5f",
  "#fc466b",
  "#3a1c71",
];

/**
 * WorksGrid - 作品网格：随 activeTab 联动的内容区插件。
 *
 * 走领域槽 `renderContentArea`（由 ProfileCore 的 `vp-content-area` 消费）。
 * 当 `config.tab` 有值时，只在对应页签激活时才渲染，实现「切到作品 tab 才出网格」。
 * 没有内容插件时 Core 会回退到 children，因此本插件与 TabSync 文本区可二选一。
 */
export function createWorksGridPlugin<T = any>(
  config: WorksGridConfig = { items: [] }
): ProfilePlugin<T> {
  const { items, columns = 3, gap = 10, tab, title, empty = "暂无作品" } = config;

  return {
    name: "WorksGrid",
    version: "0.1.0",
    description: "作品网格：随 activeTab 联动的内容区插件。",
    priority: 15,
    enabled: true,
    hooks: {
      renderContentArea: (context: ProfilePluginContext<T>) => {
        // tab 过滤：指定了 tab 且当前不是该 tab 时整体不渲染
        if (tab && context.activeTab !== tab) return null;

        const grid = (
          <div
            className="vp-works-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap,
            }}
          >
            {items.map((w, i) => {
              const bg =
                w.cover ?? w.coverColor ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
              return (
                <figure
                  key={w.id}
                  className="vp-work"
                  style={{
                    margin: 0,
                    borderRadius: 10,
                    overflow: "hidden",
                    border: "1px solid rgba(125,130,140,0.22)",
                    background: "#fff",
                    color: "#222",
                  }}
                >
                  <div
                    style={{
                      aspectRatio: "1 / 1",
                      background: w.cover ? `url(${w.cover}) center/cover no-repeat` : bg,
                    }}
                  />
                  <figcaption style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{w.title}</div>
                    {w.meta ? (
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{w.meta}</div>
                    ) : null}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        );

        if (items.length === 0) {
          return (
            <div className="vp-works-empty" style={{ padding: "24px 0", textAlign: "center", opacity: 0.6 }}>
              {empty}
            </div>
          );
        }

        if (!title) return grid;
        return (
          <div className="vp-works">
            <div
              className="vp-works-title"
              style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}
            >
              {title}
            </div>
            {grid}
          </div>
        );
      },
    },
  };
}
