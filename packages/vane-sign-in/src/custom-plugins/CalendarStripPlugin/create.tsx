import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
  DayCell,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import {
  DAY_COLORS,
  DAY_GLYPH,
  DAY_STATUS_TEXT,
  GOLD,
} from "../tokens";

export interface CalendarStripConfig {
  /** 是否高亮带奖励的格 */
  showRewardDot?: boolean;
}

/**
 * CalendarStripPlugin - 日历条（日历区）。
 * 横向滚动的逐日格：已签 / 今日 / 漏签 / 未来 / 奖励五态，带奖励的格右上角金点。
 * 配色统一从 tokens 取（旧实现在本文件内自带一份色板，已与 CalendarGrid 漂移）。
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
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {cells.map((c) => {
              const s = DAY_COLORS[c.status] ?? DAY_COLORS.future;
              const hasReward = !!(c.reward && !c.reward.claimed);
              const statusText = DAY_STATUS_TEXT[c.status] ?? c.status;
              return (
                <div
                  key={c.date}
                  role="img"
                  aria-label={`${c.date} ${statusText}`}
                  title={`${c.date} ${statusText}`}
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
                    {DAY_GLYPH[c.status] || c.day}
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
                        background: GOLD,
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
