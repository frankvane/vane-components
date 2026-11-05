import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { CountdownText } from "./internal";

export type CountdownConfig = Record<string, never>;

/**
 * CountdownPlugin - 次签倒计时（头部区）。
 * 依据 data.nextResetAt（绝对 epoch 毫秒）计算距下次可签到的剩余时间；
 * 已过期显示「现在可签到」。`now` 由 SignInCore 的时钟下发给消费者，每秒自动刷新。
 */
// 泛型默认值 any：公共契约位（同 types.ts 顶部约定），收紧为 unknown 会让不写 T 的调用方 tsc 失败。
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
