import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface TodayCheckInConfig {
  /** 已签到时的按钮文案 */
  signedText?: string;
  /** 未签到时的按钮文案 */
  unsignedText?: string;
}

/**
 * TodayCheckInPlugin - 今日签到（操作区，主 CTA）。
 * todaySigned 驱动禁用态：已签 → 置灰「今日已签」，未签 → 高亮「立即签到」。
 * 点击经 ctx.callbacks.sign 下发，状态真相在消费方数据。
 */
export function createTodayCheckInPlugin<T = any>(
  config: TodayCheckInConfig = {}
): SignInPlugin<T> {
  const { signedText = "今日已签 ✓", unsignedText = "立即签到" } = config;

  return {
    name: "TodayCheckIn",
    version: "0.1.0",
    description: doc.description,
    priority: 40,
    enabled: true,
    hooks: {
      renderActions: (ctx: SignInPluginContext<T>) => {
        const { todaySigned } = ctx.data;
        return (
          <button
            type="button"
            data-testid="si-checkin-btn"
            data-signed={String(todaySigned)}
            disabled={todaySigned}
            onClick={() => !todaySigned && ctx.callbacks.sign?.()}
            style={{
              border: "none",
              background: todaySigned ? "#f2f3f5" : "#cf4407",
              color: todaySigned ? "#8a8a8a" : "#ffffff",
              borderRadius: 20,
              padding: "8px 20px",
              fontSize: 14,
              fontWeight: 700,
              cursor: todaySigned ? "not-allowed" : "pointer",
            }}
          >
            {todaySigned ? signedText : unsignedText}
          </button>
        );
      },
    },
  };
}

createTodayCheckInPlugin.meta = doc as PluginDoc;
