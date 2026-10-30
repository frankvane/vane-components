import React from "react";
import type { CouponPlugin, CouponPluginContext } from "../../components/CouponPlugin/plugins/types";

/**
 * QuotaPlugin — 每人限领（after 槽）。
 *
 * 读 coupon.quota（config 可覆盖）与已领数，渲染限领提示；
 * 超限写 state.quotaReached 供宿主/其他插件读取（不直接耦合 ClaimState）。
 * 事件钩子写 state，渲染钩子纯读。
 * meta 在同目录 index.ts 挂载。
 */
export interface QuotaConfig {
  /** 每人限领张数（默认读 coupon.quota） */
  quota?: number;
  /** 当前用户已领张数，默认 0 */
  purchasedCount?: number;
  /** 超限回调（入参为生效的限领张数） */
  onExceed?: (quota: number) => void;
}

export function createQuotaPlugin(config: QuotaConfig = {}): CouponPlugin {
  const purchased = config.purchasedCount ?? 0;
  const mergedConfig = { slotPosition: "after", order: 10, ...config } as any;

  const resolve = (context: CouponPluginContext) => {
    const quota = config.quota ?? context.coupon.quota;
    // 未声明 quota 视为不限领
    const reached = typeof quota === "number" ? purchased >= quota : false;
    return { quota, reached };
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
        const { quota, reached } = resolve(context);
        if (reached) {
          context.setState({ quotaReached: true });
          config.onExceed?.(quota as number);
        }
      },
      onPropsChange: (context: CouponPluginContext) => {
        const { quota, reached } = resolve(context);
        context.setState({ quotaReached: reached });
        if (reached) config.onExceed?.(quota as number);
      },
      renderHeader: (context: CouponPluginContext) => {
        const { quota, reached } = resolve(context);
        if (typeof quota !== "number") return null;

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
