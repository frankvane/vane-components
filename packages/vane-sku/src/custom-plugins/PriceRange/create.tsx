import React from "react";
import type { SkuPlugin, SkuPluginContext } from "../../components/SkuPlugin/plugins/types";

/**
 * PriceRangePlugin — 价格区间。
 *
 * 未选全（或组合无货）时，PriceLink 显示不出单价，页面价格区就空了。
 * 这里补上「¥199 – ¥269」这种区间展示：按当前选择过滤变体后取 min/max。
 * 一旦选全并命中变体就退场，把价格区让给 PriceLink 显示准确单价。
 *
 * meta 在同目录 index.ts 挂载。
 */
export interface PriceRangeConfig {
  /** 货币符号，默认 "¥" */
  currency?: string;
  /** 区间连接符，默认 "–" */
  separator?: string;
  /** 命中变体时是否仍显示区间（默认 false：让位给 PriceLink） */
  showWhenMatched?: boolean;
}

export function createPriceRangePlugin(config: PriceRangeConfig = {}): SkuPlugin {
  return {
    name: "PriceRange",
    version: "0.1.0",
    description: "价格区间：未命中变体时展示可选范围的价格区间",
    priority: 45,
    // 排在 PriceLink 之前：价格区上下只有一块，命中时由 PriceLink 接管
    config: { slotPosition: "after", order: 5, ...config },
    hooks: {
      renderOverlay: (context: SkuPluginContext) => {
        if (context.variant && !config.showWhenMatched) return null;

        const attrs = context.props.attributes ?? [];
        const selection = context.selection ?? {};
        // 按当前选择过滤：只统计「与已选属性一致」的变体
        const keys = Object.keys(selection);
        const pool = (context.props.variants ?? []).filter((v) =>
          keys.every((k) => v.attrValues[k] === selection[k])
        );
        const prices = pool
          .map((v) => v.price)
          .filter((p): p is number => typeof p === "number");
        if (!prices.length) return null;

        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const currency = config.currency ?? "¥";
        const separator = config.separator ?? "–";

        return (
          <div
            data-testid="sku-price-range"
            style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: "#d4380d" }}>
              {currency}
              {min}
              {min !== max ? `${separator}${currency}${max}` : ""}
            </span>
            {attrs.length && !context.isComplete ? (
              <span style={{ fontSize: 11, opacity: 0.6 }}>（请先选择规格）</span>
            ) : null}
          </div>
        );
      },
    },
  };
}
