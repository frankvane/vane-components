import React from "react";
import { quantityUpper } from "../../components/SkuPlugin/limits";
import type { SkuPlugin, SkuPluginContext } from "../../components/SkuPlugin/plugins/types";

/**
 * QuantityPlugin — 数量步进器。
 *
 * 选完规格紧接着就是选数量，上限取「库存」「剩余可购（限购-已购）」与 config.max 的最小值，
 * 避免用户选了 10 件却在提交时才发现限购 2 件。
 * 数量写进内核 state（key: quantity），宿主加购按钮直接读。
 *
 * 关键约束（P0-2）：上限不能只作用在渲染值上 —— 变体/库存/限购变化时
 * 必须把收敛后的数量写回 state，否则宿主读到的是旧数量（超卖）。
 * 收敛在 onMount / onSkuChange 里做（事件钩子），不在渲染期 setState，
 * 且仅在「已经是数字且与目标值不同」时才写 + 回调，避免 setState 循环。
 *
 * meta 在同目录 index.ts 挂载。
 */
export interface QuantityConfig {
  /** 初始数量，默认 1 */
  defaultValue?: number;
  /** 硬上限（不传则取 库存/剩余限购 的较小值） */
  max?: number;
  /** 当前用户已购件数，用于扣减限购额度（与 QuotaPlugin 同一口径），默认 0 */
  purchasedCount?: number;
  /** 数量变化回调（用户步进 + 库存/限购变化导致的自动收敛都会触发） */
  onChange?: (quantity: number) => void;
}

export function createQuantityPlugin(config: QuantityConfig = {}): SkuPlugin {
  const defaultValue = config.defaultValue ?? 1;
  const purchasedCount = config.purchasedCount ?? 0;

  /** 当前变体下的数量上限；变体缺失/上限非有限时返回 0 */
  const upperOf = (context: SkuPluginContext) =>
    quantityUpper(context.variant, {
      purchasedCount,
      max: config.max,
    });

  /** 收敛目标：无变体 → defaultValue；有上限 → clamp 到 [1, upper] */
  const targetOf = (context: SkuPluginContext) => {
    const upper = upperOf(context);
    const base =
      typeof context.state?.quantity === "number"
        ? (context.state.quantity as number)
        : defaultValue;
    if (!Number.isFinite(upper) || upper <= 0) return defaultValue;
    return Math.max(1, Math.min(base, upper));
  };

  /**
   * 把收敛结果写回内核 state。
   * notify=false（首次初始化）只写不回调，避免把初始化当用户操作；
   * 与目标值相同则完全跳过，保证不会出现 setState 循环。
   */
  const converge = (context: SkuPluginContext, notify: boolean) => {
    const target = targetOf(context);
    const current = context.state?.quantity;
    if (typeof current === "number" && current === target) return;
    const hadNumber = typeof current === "number";
    context.setState({ quantity: target });
    if (hadNumber && notify) config.onChange?.(target);
  };

  return {
    name: "Quantity",
    version: "0.1.0",
    description: "数量步进器：受库存与剩余限购双重上限约束，并写回 state",
    priority: 35,
    config: { slotPosition: "after", order: 20, ...config },
    hooks: {
      onMount: (context: SkuPluginContext) => {
        converge(context, false);
      },
      // 变体 / 库存 / 限购变化都会触发（withPlugins 对变体变化同样派发 onSkuChange）
      onSkuChange: (context: SkuPluginContext) => {
        converge(context, true);
      },
      renderHeader: (context: SkuPluginContext) => {
        const v = context.variant;
        if (!v) return null;

        const upper = upperOf(context);
        if (!Number.isFinite(upper) || upper <= 0) return null;

        // 展示用兜底 clamp：state 的收敛由 onSkuChange 负责，这里只防一帧闪烁
        const raw =
          typeof context.state?.quantity === "number"
            ? (context.state.quantity as number)
            : defaultValue;
        const current = Math.max(1, Math.min(raw, upper));

        const commit = (next: number) => {
          const clamped = Math.max(1, Math.min(next, upper));
          if (clamped === raw) return;
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
