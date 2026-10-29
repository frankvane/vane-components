import React from "react";
import type { SkuPlugin, SkuPluginContext } from "../../components/SkuPlugin/plugins/types";

/**
 * StockStatusPlugin — 库存状态。
 *
 * 命中变体后告诉用户「还有没有货」：现货 / 仅剩 N 件 / 缺货。
 * 低库存阈值可配，用来制造紧迫感（电商常见手法）。
 *
 * meta 在同目录 index.ts 挂载。
 */
export interface StockStatusConfig {
  /** 低库存预警阈值：库存 ≤ 该值时显示「仅剩 N 件」，默认 5 */
  lowStockThreshold?: number;
  /** 缺货文案，默认 "暂时缺货" */
  soldOutText?: string;
  /** 是否展示具体库存数字，默认 true */
  showCount?: boolean;
}

export function createStockStatusPlugin(
  config: StockStatusConfig = {}
): SkuPlugin {
  const threshold = config.lowStockThreshold ?? 5;
  const soldOutText = config.soldOutText ?? "暂时缺货";
  const showCount = config.showCount ?? true;

  return {
    name: "StockStatus",
    version: "0.1.0",
    description: "库存状态：现货 / 仅剩 N 件 / 缺货",
    priority: 42,
    config: { slotPosition: "after", order: 10, ...config },
    hooks: {
      renderHeader: (context: SkuPluginContext) => {
        const v = context.variant;
        if (!v) return null;
        const stock = v.stock;
        if (typeof stock !== "number") return null;

        const soldOut = stock === 0;
        const low = !soldOut && stock <= threshold;
        const color = soldOut ? "#b32d08" : low ? "#a54a00" : "#237a06";
        const bg = soldOut ? "#fff1f0" : low ? "#fff7e6" : "#f6ffed";
        const border = soldOut ? "#ffa39e" : low ? "#ffd591" : "#b7eb8f";

        const text = soldOut
          ? soldOutText
          : low
            ? showCount
              ? `仅剩 ${stock} 件`
              : "库存紧张"
            : showCount
              ? `现货 · 库存 ${stock}`
              : "现货";

        return (
          <div
            data-testid="sku-stock"
            data-stock={String(stock)}
            data-sold-out={soldOut ? "true" : "false"}
            style={{
              marginTop: 6,
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 4,
              background: bg,
              color,
              border: `1px solid ${border}`,
            }}
          >
            {text}
          </div>
        );
      },
    },
  };
}
