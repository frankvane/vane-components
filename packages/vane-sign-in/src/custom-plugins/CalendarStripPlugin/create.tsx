import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
  DayCell,
  DayStatus,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface CalendarStripConfig {
  /** 是否高亮带奖励的格 */
  showRewardDot?: boolean;
}

/** 各状态配色（背景 + 字色成对，满足 ADR-13 对比度门槛） */
const COLORS: Record<DayStatus, { bg: string; fg: string; border: string }> = {
  signed: { bg: "#fff1e6", fg: "#d35400", border: "#ff7a29" },
  today: { bg: "#ff7a29", fg: "#ffffff", border: "#ff7a29" },
  missed: { bg: "#f2f3f5", fg: "#7d7d7d", border: "#e3e5e8" },
  future: { bg: "#fafafa", fg: "#8a8a8a", border: "#ececec" },
  reward: { bg: "#fff8e1", fg: "#b8860b", border: "#e0a800" },
};

const GLYPH: Record<DayStatus, string> = {
  signed: "✓",
  today: "今",
  missed: "·",
  future: "",
  reward: "★",
};

/**
 * CalendarStripPlugin - 日历条（日历区）。
 * 横向滚动的逐日格：已签 / 今日 / 漏签 / 未来 / 奖励五态，带奖励的格右上角金点。
 */
export function createCalendarStripPlugin<T = any>(
  config: CalendarStripConfig = {}
): SignInPlugin<T> {
  const { showRewardDot = true } = config;

  return {
    name: "CalendarStrip",
    version: "0.1.0",
    description: doc.description,
    priority: 20,
    enabled: true,
    hooks: {
      renderCalendar: (ctx: SignInPluginContext<T>) => {
        const cells: DayCell[] = ctx.data.calendar ?? [];
        return (
          <div
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {cells.map((c) => {
              const s = COLORS[c.status] ?? COLORS.future;
              const hasReward = !!(c.reward && !c.reward.claimed);
              return (
                <div
                  key={c.date}
                  title={c.date}
                  style={{
                    flex: "0 0 auto",
                    width: 42,
                    height: 54,
                    borderRadius: 8,
                    background: s.bg,
                    color: s.fg,
                    border: `1px solid ${s.border}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: 11, color: s.fg }}>第{c.day}天</span>
                  <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.1 }}>
                    {GLYPH[c.status] || c.day}
                  </span>
                  {showRewardDot && hasReward && (
                    <span
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#b8860b",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      },
    },
  };
}

createCalendarStripPlugin.meta = doc as PluginDoc;
