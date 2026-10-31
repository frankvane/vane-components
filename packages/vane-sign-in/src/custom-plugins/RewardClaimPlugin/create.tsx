import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
  RewardInfo,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { ACCENT, TEXT_3 } from "../tokens";

export type RewardClaimConfig = Record<string, never>;

/**
 * RewardClaimPlugin - 当日奖励领取（奖励区）。
 * 找到「已达天数可领但尚未领取」的第一个奖励（data.rewards 中 day<=streak 且 !claimed），
 * 提供领取按钮；点按经 ctx.callbacks.claim(day) 下发。无待领时显示终态文案。
 */
export function createRewardClaimPlugin<T = any>(
  _config: RewardClaimConfig = {}
): SignInPlugin<T> {
  return {
    name: "RewardClaim",
    version: "0.1.0",
    description: doc.description,
    priority: 31,
    enabled: true,
    hooks: {
      renderRewards: (ctx: SignInPluginContext<T>) => {
        const { rewards, streak } = ctx.data;
        const target: RewardInfo | undefined = (rewards ?? []).find(
          (r) => r.day <= streak && !r.claimed
        );
        if (!target) {
          return (
            <div style={{ fontSize: 12, color: TEXT_3 }}>
              今日奖励已全部领取
            </div>
          );
        }
        return (
          <button
            type="button"
            onClick={() => ctx.callbacks.claim?.(target.day)}
            style={{
              border: "none",
              background: ACCENT,
              color: "#ffffff",
              borderRadius: 18,
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            领取第{target.day}天奖励 · {target.label}
          </button>
        );
      },
    },
  };
}

createRewardClaimPlugin.meta = doc as PluginDoc;
