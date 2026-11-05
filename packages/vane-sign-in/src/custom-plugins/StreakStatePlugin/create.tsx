import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import { ACCENT, TEXT_2, BORDER } from "../tokens";
import doc from "./doc.json";

export interface StreakStateConfig {
  /** 是否展示历史最高连签天数 */
  showMax?: boolean;
}

/**
 * StreakStatePlugin - 连签状态（头部区）。
 * 展示当前连签天数与历史最高连签；可关掉最高天数只留当前连签。
 */
// 泛型默认值 any：公共契约位（同 types.ts 顶部约定），收紧为 unknown 会让不写 T 的调用方 tsc 失败。
export function createStreakStatePlugin<T = any>(
  config: StreakStateConfig = {}
): SignInPlugin<T> {
  const { showMax = true } = config;

  return {
    name: "StreakState",
    version: "0.1.0",
    description: doc.description,
    priority: 10,
    enabled: true,
    hooks: {
      renderHeader: (ctx: SignInPluginContext<T>) => {
        const { streak, maxStreak } = ctx.data;
        return (
          <div
            data-testid="si-streak"
            style={{ display: "flex", alignItems: "baseline", gap: 8 }}
          >
            <span
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: ACCENT,
                lineHeight: 1,
                letterSpacing: "-0.5px",
              }}
            >
              {streak}
            </span>
            <span style={{ fontSize: 13, color: TEXT_2, fontWeight: 600 }}>
              天连签
            </span>
            {showMax && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  color: TEXT_2,
                  background: "#faf7f4",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 999,
                  padding: "3px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                最高 {maxStreak} 天
              </span>
            )}
          </div>
        );
      },
    },
  };
}

createStreakStatePlugin.meta = doc as PluginDoc;
