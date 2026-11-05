import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
  RewardInfo,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { TEXT_3 } from "../tokens";
import { ClaimButton } from "./internal";

export interface RewardClaimConfig {
  /** 请求在途时的按钮文案 */
  pendingText?: string;
  /** 回调失败时的兜底文案（错误对象自带 message 时优先用 message） */
  errorText?: string;
}

/**
 * RewardClaimPlugin - 当日奖励领取（奖励区）。
 * 找到「已达天数可领但尚未领取」的第一个奖励（data.rewards 中 day<=streak 且 !claimed），
 * 提供领取按钮；点按经 ctx.callbacks.claim(day) 下发。无待领时显示终态文案。
 */
// 泛型默认值 any：公共契约位（同 types.ts 顶部约定），收紧为 unknown 会让不写 T 的调用方 tsc 失败。
export function createRewardClaimPlugin<T = any>(
  config: RewardClaimConfig = {}
): SignInPlugin<T> {
  const { pendingText = "领取中…", errorText = "领取失败，请重试" } = config;

  return {
    name: "RewardClaim",
    version: "0.1.0",
    description: doc.description,
    priority: 31,
    enabled: true,
    hooks: {
      renderRewards: (ctx: SignInPluginContext<T>) => {
        const { rewards, streak } = ctx.data;
        // 服务端可能乱序：按 day 升序取最靠前的一个待领奖励，避免「先领大奖」
        const target: RewardInfo | undefined = [...(rewards ?? [])]
          .filter((r) => r.day <= streak && !r.claimed)
          .sort((a, b) => a.day - b.day)[0];
        if (!target) {
          return (
            <div style={{ fontSize: 12, color: TEXT_3 }}>
              今日奖励已全部领取
            </div>
          );
        }
        return (
          <ClaimButton
            ctx={ctx}
            target={target}
            pendingText={pendingText}
            errorText={errorText}
          />
        );
      },
    },
  };
}

createRewardClaimPlugin.meta = doc as PluginDoc;
