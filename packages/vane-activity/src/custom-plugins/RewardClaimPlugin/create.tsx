import React from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
  ActivityRewardWithStatus,
  RewardStatus,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface RewardClaimPluginConfig extends ActivityPluginConfigBase {
  /** 已领取文案（默认「已领取」） */
  claimedLabel?: string;
}

/** 领取按钮三态样式（ADR-13：禁用/锁定态实色 ≥4.5，不靠 opacity）
 *  claimable 必须用 #cf4407：#ff7a29 白字仅 2.6:1 不达标（sign-in 同款强调橙）
 *  locked   #5d636a（muted，浅灰底 5.4:1）
 *  claimed  #15803d（白底 5.0:1） */
const BTN: Record<
  RewardStatus,
  { label: string; bg: string; color: string; disabled: boolean }
> = {
  locked: { label: "未解锁", bg: "rgba(128,128,128,0.12)", color: "#5d636a", disabled: true },
  claimable: { label: "领取", bg: "#cf4407", color: "#fff", disabled: false },
  claimed: { label: "已领取", bg: "rgba(21,128,61,0.12)", color: "#15803d", disabled: true },
};

/**
 * RewardClaimPlugin - 奖励领取：渲染奖励行，按派生状态展示按钮
 * （claimable 高亮可点 / claimed 已完成 / locked 未解锁），点击调 context.claim。
 */
export const createRewardClaimPlugin: PluginCreator<RewardClaimPluginConfig> = (
  config = {}
) => {
  const { claimedLabel = "已领取" } = config;

  return {
    name: "RewardClaimPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 30,
    exclusiveSlots: ["renderRewards"],
    config,
    hooks: {
      renderRewards: (context: ActivityPluginContext) => {
        const rewards = (context.rewards ?? []) as ActivityRewardWithStatus[];
        if (rewards.length === 0) return null;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rewards.map((r) => {
              const btn =
                r.status === "claimed"
                  ? { ...BTN.claimed, label: claimedLabel }
                  : BTN[r.status];
              return (
                <div
                  key={r.id}
                  data-testid="activity-reward"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(128,128,128,0.18)",
                    background: "#fff",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1f2328" }}>
                      {r.icon ? `${r.icon} ` : ""}
                      {r.title}
                    </div>
                    {r.desc && (
                      <div style={{ fontSize: 12, color: "#5d636a", marginTop: 2 }}>
                        {r.desc}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={btn.disabled}
                    onClick={() => context.claim(r.id)}
                    style={{
                      border: "none",
                      borderRadius: 999,
                      padding: "6px 14px",
                      background: btn.bg,
                      color: btn.color,
                      fontSize: 13,
                      cursor: btn.disabled ? "default" : "pointer",
                    }}
                  >
                    {btn.label}
                  </button>
                </div>
              );
            })}
          </div>
        );
      },
    },
  };
};

createRewardClaimPlugin.meta = doc as PluginDoc;
