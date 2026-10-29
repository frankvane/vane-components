import React from "react";
import type {
  SkuPlugin,
  SkuPluginContext,
} from "../../components/SkuPlugin/plugins/types";

/**
 * PriceLinkPlugin — 价格联动（B2/B4 子路径插件）。
 *
 * 订阅命中变体，把价格渲染到 overlay 段（core 的「选中摘要」之后）。
 * 定价策略可替换：默认取 variant.price，也可由调用方在 variant 上自备。
 *
 * meta 在同目录 index.ts 挂载（家族约定），这里只导出裸工厂。
 */
export interface PriceLinkConfig {
  /** 货币符号，默认 "¥" */
  currency?: string;
  /** 是否展示原价（原价 > 现价时才画删除线），默认 true */
  showOriginal?: boolean;
  /** 折扣文案，如 "限时8折" */
  discountText?: string;
}

export function createPriceLinkPlugin(
  config: PriceLinkConfig = {}
): SkuPlugin {
  return {
    name: "PriceLink",
    version: "0.1.0",
    description: "价格联动：把命中变体的价格渲染到浮层",
    priority: 50,
    config,
    hooks: {
      renderOverlay: (context: SkuPluginContext) => {
        const v = context.variant;
        if (!v || typeof v.price !== "number") return null;
        const currency = config.currency ?? "¥";
        const showOriginal = config.showOriginal ?? true;
        const hasOriginal =
          showOriginal &&
          typeof v.originalPrice === "number" &&
          v.originalPrice > v.price;

        return (
          <div
            data-testid="sku-price"
            style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, color: "#d4380d" }}>
              {currency}
              {v.price}
            </span>
            {hasOriginal ? (
              <s data-testid="sku-price-original" style={{ fontSize: 12, opacity: 0.6 }}>
                {currency}
                {v.originalPrice}
              </s>
            ) : null}
            {config.discountText ? (
              <span
                data-testid="sku-price-discount"
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "#fff1f0",
                  color: "#d4380d",
                }}
              >
                {config.discountText}
              </span>
            ) : null}
          </div>
        );
      },
    },
  };
}
