import React from "react";
import type {
  SkuPlugin,
  SkuPluginContext,
} from "../../components/SkuPlugin/plugins/types";

/**
 * QuotaPlugin — 限购校验（B2/B4 子路径插件）。
 *
 * vane-card 只有 stock（库存），没有「每人限购 N 件」；这里补齐：
 *  - 读 variant.quota 与已购数，在 after 段渲染限购提示条；
 *  - 把 canPurchase 写入内核 state，宿主加购按钮读它决定是否禁用。
 *
 * canPurchase 在事件钩子（onMount / onSkuChange）里写入，不在渲染期 setState，
 * 避免渲染期修改状态导致的循环告警。
 *
 * meta 在同目录 index.ts 挂载。
 */
export interface QuotaConfig {
  /** 当前用户已购件数，默认 0 */
  purchasedCount?: number;
  /** 超出限购时回调 */
  onExceed?: () => void;
}

export function createQuotaPlugin(config: QuotaConfig = {}): SkuPlugin {
  const purchased = config.purchasedCount ?? 0;

  const resolve = (context: SkuPluginContext) => {
    const quota = context.variant?.quota;
    // 未声明 quota 视为不限购
    const canPurchase = typeof quota === "number" ? purchased < quota : true;
    return { quota, canPurchase };
  };

  return {
    name: "Quota",
    version: "0.1.0",
    description: "限购校验：渲染限购提示条并暴露 canPurchase 门控",
    priority: 40,
    config,
    hooks: {
      onMount: (context: SkuPluginContext) => {
        context.setState({ canPurchase: resolve(context).canPurchase });
      },
      onSkuChange: (context: SkuPluginContext) => {
        const { canPurchase } = resolve(context);
        context.setState({ canPurchase });
        if (!canPurchase) config.onExceed?.();
      },
      renderHeader: (context: SkuPluginContext) => {
        const { quota, canPurchase } = resolve(context);
        if (typeof quota !== "number") return null;
        return (
          <div
            data-testid="sku-quota"
            data-can-purchase={canPurchase ? "true" : "false"}
            style={{
              marginTop: 6,
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 4,
              background: canPurchase ? "#f6ffed" : "#fff1f0",
              color: canPurchase ? "#237a06" : "#b32d08",
              border: `1px solid ${canPurchase ? "#b7eb8f" : "#ffa39e"}`,
            }}
          >
            每人限购 {quota} 件（已购 {purchased}）
            {canPurchase ? "" : " · 已达限购上限"}
          </div>
        );
      },
    },
  };
}
