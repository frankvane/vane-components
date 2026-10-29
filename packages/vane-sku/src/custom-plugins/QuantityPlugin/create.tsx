import React from "react";
import type { SkuPlugin, SkuPluginContext } from "../../components/SkuPlugin/plugins/types";

/**
 * QuantityPlugin — 数量步进器。
 *
 * 选完规格紧接着就是选数量，上限取「库存」与「限购」的较小值，
 * 避免用户选了 10 件却在提交时才发现限购 2 件。
 * 数量写进内核 state（key: quantity），宿主加购按钮直接读。
 *
 * meta 在同目录 index.ts 挂载。
 */
export interface QuantityConfig {
  /** 初始数量，默认 1 */
  defaultValue?: number;
  /** 硬上限（不传则取 库存/限购 的较小值） */
  max?: number;
  /** 数量变化回调 */
  onChange?: (quantity: number) => void;
}

export function createQuantityPlugin(config: QuantityConfig = {}): SkuPlugin {
  const defaultValue = config.defaultValue ?? 1;

  return {
    name: "Quantity",
    version: "0.1.0",
    description: "数量步进器：受库存与限购双重上限约束",
    priority: 35,
    config: { slotPosition: "after", order: 20, ...config },
    hooks: {
      onMount: (context: SkuPluginContext) => {
        if (typeof context.state?.quantity !== "number") {
          context.setState({ quantity: defaultValue });
        }
      },
      renderHeader: (context: SkuPluginContext) => {
        const v = context.variant;
        if (!v) return null;

        // 上限：库存与限购取小；都缺省时用 config.max 或 Infinity
        const byStock = typeof v.stock === "number" ? v.stock : Infinity;
        const byQuota = typeof v.quota === "number" ? v.quota : Infinity;
        const upper = Math.min(byStock, byQuota, config.max ?? Infinity);
        if (!Number.isFinite(upper) || upper <= 0) return null;

        const current =
          typeof context.state?.quantity === "number"
            ? Math.min(context.state.quantity as number, upper)
            : Math.min(defaultValue, upper);

        const commit = (next: number) => {
          const clamped = Math.max(1, Math.min(next, upper));
          context.setState({ quantity: clamped });
          config.onChange?.(clamped);
        };

        const btn: React.CSSProperties = {
          width: 26,
          height: 26,
          border: "1px solid #d0d4da",
          background: "#fff",
          color: "#1f2328",
          cursor: "pointer",
          borderRadius: 4,
          lineHeight: 1,
        };

        return (
          <div
            data-testid="sku-quantity"
            data-quantity={String(current)}
            data-max={String(upper)}
            style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}
          >
            <span style={{ fontSize: 12, color: "#4a5056" }}>数量</span>
            <button
              type="button"
              data-testid="sku-quantity-minus"
              disabled={current <= 1}
              onClick={() => commit(current - 1)}
              style={{ ...btn, color: current <= 1 ? "#7d838a" : "#1f2328", cursor: current <= 1 ? "not-allowed" : "pointer" }}
            >
              −
            </button>
            <span style={{ minWidth: 28, textAlign: "center", fontSize: 13 }}>{current}</span>
            <button
              type="button"
              data-testid="sku-quantity-plus"
              disabled={current >= upper}
              onClick={() => commit(current + 1)}
              style={{ ...btn, color: current >= upper ? "#7d838a" : "#1f2328", cursor: current >= upper ? "not-allowed" : "pointer" }}
            >
              +
            </button>
            <span style={{ fontSize: 11, color: "#5b6064" }}>上限 {upper}</span>
          </div>
        );
      },
    },
  };
}
