import React from "react";
import type { CouponPlugin, CouponPluginContext } from "../../components/CouponPlugin/plugins/types";
import { resolveStock } from "../../components/CouponPlugin/plugins/stock";
import * as T from "../../components/CouponPlugin/plugins/tokens";

/**
 * ProgressPlugin — 领取进度条（after 槽）。
 *
 * 读 coupon.total / claimed（可用 config 覆盖），渲染进度条 + 「已抢 X%」；
 * 剩余 ≤ urgentPct 时换紧迫色。数据来自接口轮询时，props 变化（onPropsChange）即重算。
 *
 * 口径与 ClaimStatePlugin 共用 plugins/stock.ts：stock ≤ 0 与 claimed ≥ total
 * 取并集，进度条写「已抢完」时领取按钮一定被判 soldout（P1-1）。
 * meta 在同目录 index.ts 挂载。
 */
export interface ProgressConfig {
  /** 发放总量（默认读 coupon.total） */
  total?: number;
  /** 已领取数（默认读 coupon.claimed） */
  claimed?: number;
  /** 剩余库存（宿主侧权威值；与 total/claimed 取并集判售罄） */
  stock?: number;
  /** 剩余 ≤ N% 标记紧迫，默认 20 */
  urgentPct?: number;
  /** 是否展示「仅剩 N 张」替代百分比，默认 true */
  showRemaining?: boolean;
}

export function createProgressPlugin(config: ProgressConfig = {}): CouponPlugin {
  const urgentPct = config.urgentPct ?? 20;
  const showRemaining = config.showRemaining ?? true;
  const mergedConfig = { slotPosition: "after", order: 10, ...config } as any;

  return {
    name: "progress",
    version: "0.1.0",
    description:
      "领取进度条：按 total/claimed/stock 渲染已抢百分比进度条，剩余 ≤ N% 换紧迫色，数据轮询即刷新",
    priority: 20,
    config: mergedConfig,
    hooks: {
      renderHeader: (context: CouponPluginContext) => {
        const stock = resolveStock(context.coupon, {
          total: config.total,
          claimed: config.claimed,
          stock: config.stock,
        });
        if (stock.total === null || stock.total <= 0) return null;
        if (stock.claimed === null || stock.claimed < 0) return null;

        const pct = stock.percent ?? 0;
        const remaining = stock.remaining ?? 0;
        const urgent = 100 - pct <= urgentPct;
        let text = `已抢 ${pct}%`;
        if (stock.soldout) {
          text = "已抢完";
        } else if (urgent && showRemaining) {
          text += ` · 仅剩 ${remaining} 张`;
        }

        return (
          <div
            className="vc-coupon__progress"
            style={{ marginTop: 10, fontSize: 12, color: T.validityStyle.color }}
            data-testid="coupon-progress"
            data-percent={String(pct)}
            data-urgent={urgent ? "true" : "false"}
            data-soldout={stock.soldout ? "true" : "false"}
          >
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: "#f2f3f5",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: urgent ? "#a54a00" : "#d03050",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div style={{ marginTop: 4, color: urgent ? "#a54a00" : "#57606a" }}>
              {text}
            </div>
          </div>
        );
      },
    },
  };
}
