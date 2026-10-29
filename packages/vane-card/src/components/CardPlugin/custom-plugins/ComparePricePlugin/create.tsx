/**
 * ComparePricePlugin - 比价展示插件（增强：排序/过滤/低价高亮/波动提示）
 */
import type { CardPlugin, PluginCreator } from "../../plugins/types";
import { BusKeys } from "../../plugins/BusKeys";
import { setupForceUpdateOnBusKeys } from "../../plugins/utils/busHelpers";
import React from "react";

export interface ComparePricePluginConfig {
  competitors?: Array<{ name: string; price: number; url?: string }>;
  showLowestPrice?: boolean;
  sortBy?: "price" | "name";
  sortOrder?: "asc" | "desc";
  filterMaxPrice?: number;
  highlightLowerThanOurPrice?: boolean;
  priceDiffHighlightThreshold?: number; // 与当前价差超过阈值高亮
}

export const createComparePricePlugin: PluginCreator<any, ComparePricePluginConfig> = (
  config = {}
) => {
  const {
    competitors = [],
    showLowestPrice = true,
    sortBy = "price",
    sortOrder = "asc",
    filterMaxPrice,
    highlightLowerThanOurPrice = true,
    priceDiffHighlightThreshold = 0,
  } = config;

  const plugin: CardPlugin = {
    name: "ComparePricePlugin",
    version: "1.0.0",
    description: "展示其他平台价格对比",
    priority: 20,
    hooks: {
      onMount: (context) => {
        // 当当前价变化时，触发更新以重算高亮
        const cleanup = setupForceUpdateOnBusKeys(context, [BusKeys.skuPrice]);
        return cleanup;
      },
      renderFooter: (context) => {
        if (!competitors.length) return null;
        const currentPrice = Number(
          (context.bus?.getData?.(BusKeys.skuPrice) as any) ?? (context.data as any)?.price ?? 0
        );

        let list = [...competitors];
        if (typeof filterMaxPrice === "number") {
          list = list.filter((c) => c.price <= filterMaxPrice!);
        }
        list.sort((a, b) => {
          const valA = sortBy === "name" ? a.name.localeCompare(b.name) : a.price - 0;
          const valB = sortBy === "name" ? b.name.localeCompare(a.name) : b.price - 0;
          const cmp = sortBy === "name" ? valA - valB : (a.price - b.price);
          return sortOrder === "asc" ? cmp : -cmp;
        });

        const lowest = showLowestPrice && list.length
          ? list.reduce((min, c) => (c.price < min.price ? c : min), list[0])
          : undefined;
        return (
          <div style={{ padding: 12, borderTop: "1px dashed #eee" }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>平台价格对比</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6 }}>
              {list.map((c) => {
                const isLowest = lowest?.name === c.name;
                const lowerThanOur = highlightLowerThanOurPrice && currentPrice > 0 && c.price < currentPrice;
                const diff = currentPrice > 0 ? currentPrice - c.price : 0;
                const highlight = isLowest || lowerThanOur || (priceDiffHighlightThreshold > 0 && diff >= priceDiffHighlightThreshold);
                return (
                <React.Fragment key={c.name}>
                  <div style={{ fontSize: 13, color: "#555" }}>{c.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: highlight ? "#388e3c" : "#333" }}>
                    ¥{c.price}
                    {lowerThanOur && (
                      <span title="低于当前价" style={{ marginLeft: 6, fontSize: 11, color: "#388e3c" }}>↓{Math.max(0, diff)}</span>
                    )}
                  </div>
                </React.Fragment>
              );})}
            </div>
            {lowest && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#388e3c" }}>
                当前最低：{lowest.name}（¥{lowest.price}）
              </div>
            )}
          </div>
        );
      },
      renderPriceArea: (context) => {
        if (!competitors.length) return null;
        const currentPrice = Number(
          (context.bus?.getData?.(BusKeys.skuPrice) as any) ?? (context.data as any)?.price ?? 0
        );
        const lowest = competitors.reduce((min, c) => (c.price < min ? c.price : min), Infinity);
        if (!isFinite(lowest)) return null;
        const diff = currentPrice - lowest;
        const isLower = diff < 0;
        const color = isLower ? "#1b5e20" : "#a52714";
        const label = isLower ? `低于最低价 ¥${Math.round(Math.abs(diff))}` : `最低价 ¥${lowest}`;
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontSize: 12,
              fontWeight: 700,
              color,
              background: isLower ? "#E8F5E9" : "#FFF3F3",
              border: `1px solid ${isLower ? "#C8E6C9" : "#F5C6CB"}`,
              borderRadius: 12,
              padding: "2px 6px",
              marginLeft: 6,
            }}
            title="平台比价"
          >
            {label}
          </span>
        );
      },
    },
    config: { ...config, order: 20 },
  };

  return plugin;
};