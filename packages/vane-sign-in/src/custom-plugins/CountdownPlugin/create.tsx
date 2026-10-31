import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { GREEN, TEXT_3 } from "../tokens";

export type CountdownConfig = Record<string, never>;

/**
 * CountdownPlugin - 次签倒计时（头部区）。
 * 依据 data.nextResetAt 计算距下次可签到的剩余时间；已过期显示「现在可签到」。
 * 纯渲染计算（无定时器），由消费方在 nextResetAt 变化时重渲即可刷新。
 */
export function createCountdownPlugin<T = any>(
  _config: CountdownConfig = {}
): SignInPlugin<T> {
  return {
    name: "Countdown",
    version: "0.1.0",
    description: doc.description,
    priority: 14,
    enabled: true,
    hooks: {
      renderHeader: (ctx: SignInPluginContext<T>) => {
        const { nextResetAt, todaySigned } = ctx.data;
        if (!nextResetAt) return null;
        const diff = nextResetAt - Date.now();
        if (diff <= 0) {
          return (
            <div style={{ fontSize: 12, color: GREEN }}>现在可签到</div>
          );
        }
        const h = Math.floor(diff / 3.6e6);
        const m = Math.floor((diff % 3.6e6) / 6e4);
        return (
          <div style={{ fontSize: 12, color: TEXT_3 }}>
            {todaySigned
              ? `距下次可签到 ${h}小时${m}分`
              : "今日可签到"}
          </div>
        );
      },
    },
  };
}

createCountdownPlugin.meta = doc as PluginDoc;
