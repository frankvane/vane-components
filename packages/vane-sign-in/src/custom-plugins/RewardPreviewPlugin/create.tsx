import type React from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
  RewardInfo,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface RewardPreviewConfig {
  /** 最多展示几条奖励预告，默认 5 */
  limit?: number;
}

/**
 * RewardPreviewPlugin - 奖励预告（奖励区）。
 * 从当前连签天数起，逐日展示后续可领奖励（积分 / 券 / 礼包 / 徽章）。
 * 已领取的奖励标记「已领」终态，不覆盖未领取。
 */
// 泛型默认值 any：公共契约位（同 types.ts 顶部约定），收紧为 unknown 会让不写 T 的调用方 tsc 失败。
export function createRewardPreviewPlugin<T = any>(
  config: RewardPreviewConfig = {}
): SignInPlugin<T> {
  const { limit = 5 } = config;

  return {
    name: "RewardPreview",
    version: "0.1.0",
    description: doc.description,
    priority: 30,
    enabled: true,
    hooks: {
      renderRewards: (ctx: SignInPluginContext<T>) => {
        // 服务端乱序时预告也要按 day 升序：先排序再截断，避免「第 30 天大奖」被挤出列表
        const rewards: RewardInfo[] = [...(ctx.data.rewards ?? [])]
          .filter((r) => r.day >= ctx.data.streak)
          .sort((a, b) => a.day - b.day);
        if (!rewards.length) return null;
        return (
          <div
            style={{
              background: "#fafbfc",
              border: "1px solid #eef0f2",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {rewards.slice(0, limit).map((r) => (
              <div
                key={r.day}
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    flex: "0 0 auto",
                    background: "#fff8e1",
                    color: "#9a6a00",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {r.day}
                </span>
                <span style={{ color: "#1f2328" }}>{r.label}</span>
                {r.claimed && (
                  <span style={{ marginLeft: "auto", color: "#0f8a4a", fontSize: 12 }}>
                    已领 ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      },
    },
  };
}

createRewardPreviewPlugin.meta = doc as PluginDoc;
