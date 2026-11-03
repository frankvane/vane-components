import React from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type { ActivityPluginContext } from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface CouponStackPluginConfig {
  /** 券堆叠的错位偏移（px，默认 6） */
  stackOffset?: number;
  /** 「领取」按钮文案（默认「领取」） */
  claimLabel?: string;
  /** 「已领取」文案（默认「已领取」） */
  claimedLabel?: string;
  /** 「未解锁」文案（默认「未解锁」） */
  lockedLabel?: string;
}

/**
 * CouponStackPlugin - 券堆叠（RewardClaim 的变体渲染）：每张奖励渲染成一张
 * 「票券」卡，堆叠错位摆放。与 RewardClaim 互为同槽位竞品——都声明独占
 * renderRewards，同时挂载时只留 priority 高者（装配期去重，控制台有警告）。
 */
export const createCouponStackPlugin: PluginCreator<CouponStackPluginConfig> = (
  config = {}
) => {
  const {
    stackOffset = 6,
    claimLabel = "领取",
    claimedLabel = "已领取",
    lockedLabel = "未解锁",
  } = config;

  return {
    name: "CouponStackPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 29,
    exclusiveSlots: ["renderRewards"],
    config,
    hooks: {
      renderRewards: (context: ActivityPluginContext) => {
        const rewards = context.rewards ?? [];
        if (rewards.length === 0) return null;

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rewards.map((r, i) => {
              // 堆叠错位：越靠后的卡越往右下偏，营造一摞券的手感
              const offset = (i % 2 === 0 ? -1 : 1) * stackOffset * ((i + 1) / 2);
              const reachPct = Math.round(
                Math.max(
                  0,
                  Math.min(1, Number.isFinite(r.threshold) ? r.threshold : 1)
                ) * 100
              );

              let btn: React.ReactNode;
              if (r.status === "claimable") {
                btn = (
                  <button
                    type="button"
                    onClick={() => context.claim(r.id)}
                    style={{
                      border: "none",
                      borderRadius: 999,
                      padding: "5px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: "#cf4407",
                      color: "#fff",
                    }}
                  >
                    {claimLabel}
                  </button>
                );
              } else if (r.status === "claimed") {
                btn = (
                  <span
                    style={{
                      borderRadius: 999,
                      padding: "5px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      background: "rgba(21,128,61,0.10)",
                      color: "#15803d",
                    }}
                  >
                    {claimedLabel}
                  </span>
                );
              } else {
                btn = (
                  <span
                    style={{
                      borderRadius: 999,
                      padding: "5px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      background: "rgba(93,99,106,0.10)",
                      color: "#5d636a",
                    }}
                  >
                    {lockedLabel}
                  </span>
                );
              }

              return (
                <div
                  key={r.id}
                  data-testid="activity-coupon"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px dashed #d8dce0",
                    background: "#fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                    transform: `translateX(${offset}px)`,
                    transition: "transform .25s ease",
                  }}
                >
                  <span style={{ fontSize: 22 }} aria-hidden>
                    {r.icon ?? "🎟️"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1f2328" }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#5d636a", marginTop: 2 }}>
                      {r.desc ?? `总体进度达 ${reachPct}% 解锁`}
                    </div>
                  </div>
                  {btn}
                </div>
              );
            })}
          </div>
        );
      },
    },
  };
};

createCouponStackPlugin.meta = doc as PluginDoc;
