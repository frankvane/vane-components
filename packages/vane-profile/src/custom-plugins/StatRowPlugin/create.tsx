import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
  StatItem,
} from "../../components/ProfilePlugin/plugins/types";
import doc from "./doc.json";

export interface StatRowConfig {
  /** 显式指标（覆盖 context.stats） */
  items?: StatItem[];
  /** 排布方向，默认 row */
  direction?: "row" | "column";
  /** 项之间是否显示分隔线（仅 row 生效），默认 true */
  divider?: boolean;
  /** 点击某条指标的回调（可在内部调用 context.setActiveTab 联动页签） */
  onStatClick?: (item: StatItem, index: number) => void;
}

/**
 * StatRow - 数据行：关注 / 粉丝 / 获赞 / 作品等指标，横排展示。
 *
 * 走领域槽 `renderStatRow`（由 ProfileCore 的 `vp-stat-row` 消费）。
 * 数据源：config.items ?? context.stats ?? []。每项显示 值（大）+ 标签（小）。
 */
export function createStatRowPlugin<T = any>(
  config: StatRowConfig = {}
): ProfilePlugin<T> {
  const { direction = "row", divider = true, onStatClick } = config;

  return {
    name: "StatRow",
    version: "0.1.0",
    description:
      "数据行：关注 / 粉丝 / 获赞 / 作品等指标，横排展示。",
    priority: 10,
    enabled: true,
    hooks: {
      renderStatRow: (context: ProfilePluginContext<T>) => {
        const items: StatItem[] = config.items ?? context.stats ?? [];
        if (items.length === 0) return null;
        return (
          <div
            className="vp-stat-row-inner"
            style={{
              display: "flex",
              flexDirection: direction === "column" ? "column" : "row",
              gap: 16,
              flex: 1,
            }}
          >
            {items.map((it, i) => (
              <button
                key={it.key ?? `stat-${i}`}
                type="button"
                onClick={onStatClick ? () => onStatClick(it, i) : undefined}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: direction === "column" ? "flex-start" : "center",
                  border: "none",
                  background: "transparent",
                  cursor: onStatClick ? "pointer" : "default",
                  padding: 0,
                  lineHeight: 1.2,
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700 }}>{it.value}</span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#888",
                    borderRight:
                      divider && direction === "row" && i < items.length - 1
                        ? "1px solid #eee"
                        : "none",
                    paddingRight:
                      divider && direction === "row" && i < items.length - 1 ? 16 : 0,
                  }}
                >
                  {it.label}
                </span>
              </button>
            ))}
          </div>
        );
      },
    },
  };
}

