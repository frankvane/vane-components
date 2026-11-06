import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { CheckInButton } from "./internal";

export interface TodayCheckInConfig {
  /** 已签到时的按钮文案 */
  signedText?: string;
  /** 未签到时的按钮文案 */
  unsignedText?: string;
  /** 请求在途（尚未返回）时的按钮文案 */
  pendingText?: string;
  /** 回调失败时的兜底文案（错误对象自带 message 时优先用 message） */
  errorText?: string;
}

/**
 * TodayCheckInPlugin - 今日签到（操作区，主 CTA）。
 * todaySigned 驱动禁用态：已签 → 置灰「今日已签」，未签 → 高亮「立即签到」。
 * 点击经 ctx.callbacks.sign 下发，状态真相在消费方数据。
 */
// 泛型默认值 unknown：T 不参与类型结构（data 恒为 SignInData），默认值不影响调用方。
export function createTodayCheckInPlugin<T = unknown>(
  config: TodayCheckInConfig = {}
): SignInPlugin<T> {
  const {
    signedText = "今日已签 ✓",
    unsignedText = "立即签到",
    pendingText = "签到中…",
    errorText = "签到失败，请重试",
  } = config;

  return {
    name: "TodayCheckIn",
    version: "0.1.0",
    description: doc.description,
    priority: 40,
    enabled: true,
    hooks: {
      renderActions: (ctx: SignInPluginContext<T>) => (
        <CheckInButton
          ctx={ctx}
          signedText={signedText}
          unsignedText={unsignedText}
          pendingText={pendingText}
          errorText={errorText}
        />
      ),
    },
  };
}

createTodayCheckInPlugin.meta = doc as PluginDoc;
