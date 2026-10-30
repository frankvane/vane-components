import type { CouponPlugin, CouponPluginContext } from "../../components/CouponPlugin/plugins/types";

/**
 * AnalyticsPlugin — 券埋点（无 UI，priority 90 事件链最前）。
 *
 * 对齐 vane-sku 的 Analytics 双通道：回调（onEvent）与总线（coupon:analytics）
 * 同时上报，自身不渲染任何 UI。事件三类：
 *   coupon:mount  —— 挂载
 *   coupon:claim  —— 相位变化（含目标相位）
 *   coupon:error  —— 领取失败（reason）
 * meta 在同目录 index.ts 挂载。
 */
export interface AnalyticsConfig {
  /** 埋点回调（与总线双通道） */
  onEvent?: (event: string, payload: Record<string, unknown>) => void;
}

export function createAnalyticsPlugin(
  config: AnalyticsConfig = {}
): CouponPlugin {
  const emit = (
    context: CouponPluginContext,
    event: string,
    payload: Record<string, unknown>
  ) => {
    context.bus.emit(event, payload);
    context.bus.emit("coupon:analytics", { event, ...payload });
    config.onEvent?.(event, payload);
  };

  return {
    name: "analytics",
    version: "0.1.0",
    description:
      "券埋点：coupon:mount / coupon:claim / coupon:error 三类事件，回调与总线 coupon:analytics 双通道，自身不渲染 UI",
    priority: 90,
    config: {},
    hooks: {
      onMount: (context: CouponPluginContext) => {
        emit(context, "coupon:mount", {
          couponId: context.coupon.id,
          phase: context.phase,
        });
      },
      onPhaseChange: (context: CouponPluginContext, phase) => {
        emit(context, "coupon:claim", {
          couponId: context.coupon.id,
          phase,
        });
      },
      onError: (context: CouponPluginContext, error: unknown) => {
        emit(context, "coupon:error", {
          couponId: context.coupon.id,
          message: String(error),
        });
      },
    },
  };
}
