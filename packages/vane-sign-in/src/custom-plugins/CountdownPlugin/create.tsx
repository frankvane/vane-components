import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { GREEN, TEXT_3 } from "../tokens";
import { useSignInNow } from "../../components/SignInPlugin/plugins/clock";

export type CountdownConfig = Record<string, never>;

interface CountdownTextProps {
  nextResetAt: number;
  todaySigned: boolean;
}

/**
 * 倒计时文案（消费 Core 时钟，保证每秒 tick；旧实现只在渲染那一帧读 Date.now()）。
 * 长周期换算成「n天m小时」，不再出现「168小时0分」。
 */
function CountdownText({ nextResetAt, todaySigned }: CountdownTextProps) {
  const now = useSignInNow();
  const diff = nextResetAt - now;
  if (diff <= 0) {
    return <div style={{ fontSize: 12, color: GREEN }}>现在可签到</div>;
  }
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3.6e6);
  const minutes = Math.floor((diff % 3.6e6) / 6e4);
  const remaining = days > 0 ? `${days}天${hours}小时` : `${hours}小时${minutes}分`;
  return (
    <div style={{ fontSize: 12, color: TEXT_3 }}>
      {todaySigned ? `距下次可签到 ${remaining}` : "今日可签到"}
    </div>
  );
}

/**
 * CountdownPlugin - 次签倒计时（头部区）。
 * 依据 data.nextResetAt（绝对 epoch 毫秒）计算距下次可签到的剩余时间；
 * 已过期显示「现在可签到」。`now` 由 SignInCore 的时钟下发给消费者，每秒自动刷新。
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
        return (
          <CountdownText
            nextResetAt={nextResetAt}
            todaySigned={todaySigned}
          />
        );
      },
    },
  };
}

createCountdownPlugin.meta = doc as PluginDoc;
