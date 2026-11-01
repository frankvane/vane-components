import React from "react";
import type { CouponPlugin, CouponPluginContext } from "../../components/CouponPlugin/plugins/types";
import { resolveQuota } from "../../components/CouponPlugin/plugins/quota";

/**
 * QuotaPlugin — 每人限领（after 槽）。
 *
 * 读 coupon.quota（config 可覆盖）与已领数，渲染限领提示；
 * 超限写 state.quotaReached 供 ClaimStatePlugin 门控领取按钮（同口径见 plugins/quota.ts）。
 * 事件钩子写 state，渲染钩子纯读；写入前比较当前值，避免父渲染引发的空转重渲染（P2-5）。
 * meta 在同目录 index.ts 挂载。
 */
export interface QuotaConfig {
  /** 每人限领张数（默认读 coupon.quota） */
  quota?: number;
  /** 当前用户已领张数，默认 0（可传 order.purchasedCount） */
  purchasedCount?: number;
  /** 超限回调（入参为生效的限领张数） */
  onExceed?: (quota: number) => void;
}

export function createQuotaPlugin(config: QuotaConfig = {}): CouponPlugin {
  const mergedConfig = { slotPosition: "after", order: 10, ...config } as any;

  const resolve = (context: CouponPluginContext) =>
    resolveQuota(context.coupon, {
      quota: config.quota,
      purchasedCount:
        config.purchasedCount ?? context.order?.purchasedCount,
    });

  /** 仅在判定结果变化时写 state；超限时回调 */
  const sync = (context: CouponPluginContext): void => {
    const { quota, reached } = resolve(context);
    const current = context.state?.quotaReached === true;
    if (current !== reached) context.setState({ quotaReached: reached });
    if (reached && quota !== null) config.onExceed?.(quota);
  };

  return {
    name: "quota",
    version: "0.1.0",
    description:
      "每人限领：读 coupon.quota 与已领数渲染限领提示，超限写 state.quotaReached 供领取按钮门控",
    priority: 19,
    config: mergedConfig,
    hooks: {
      onMount: (context: CouponPluginContext) => {
        sync(context);
      },
      onPropsChange: (context: CouponPluginContext) => {
        sync(context);
      },
      renderHeader: (context: CouponPluginContext) => {
        const { quota, purchased, reached } = resolve(context);
        if (quota === null) return null;

        return (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 4,
              background: reached ? "#fff1f0" : "#f6ffed",
              color: reached ? "#b32d08" : "#237a06",
              border: `1px solid ${reached ? "#ffa39e" : "#b7eb8f"}`,
            }}
            data-testid="coupon-quota"
            data-reached={reached ? "true" : "false"}
          >
            每人限领 {quota} 张（已领 {purchased}）
            {reached ? " · 已达限领上限" : ""}
          </div>
        );
      },
    },
  };
}
