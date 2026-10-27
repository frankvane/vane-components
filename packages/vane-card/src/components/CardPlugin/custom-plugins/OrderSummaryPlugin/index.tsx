/**
 * OrderSummaryPlugin - 账单明细/结算摘要
 */
import type { CardPlugin, PluginCreator } from "../../plugins/types";
import { BusKeys } from "../../plugins/BusKeys";
import { setupForceUpdateOnBusKeys } from "../../plugins/utils/busHelpers";
import { applyDefaults } from "../../plugins/utils/config";
import React from "react";

export interface OrderSummaryPluginConfig {
  showBreakdown?: boolean; // 是否显示明细行
  showTax?: boolean;
  showShipping?: boolean;
  currency?: string;
  locale?: string;
  taxRate?: number; // 税率（如 0.1 表示 10%）
  shippingFee?: number; // 固定运费
  placement?: "footer" | "overlay";
}

function formatCurrency(value: number, currency?: string, locale?: string) {
  try {
    return new Intl.NumberFormat(locale || "zh-CN", {
      style: currency ? "currency" : "decimal",
      currency: currency || "CNY",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `¥${value}`;
  }
}

export const createOrderSummaryPlugin: PluginCreator<any, OrderSummaryPluginConfig> = (
  config = {}
) => {
  const cfg = applyDefaults<OrderSummaryPluginConfig>(config, {
    showBreakdown: true,
    showTax: false,
    showShipping: false,
    currency: "CNY",
    locale: "zh-CN",
    taxRate: 0,
    shippingFee: 0,
    placement: "footer",
  });

  const plugin: CardPlugin = {
    name: "OrderSummaryPlugin",
    version: "1.0.0",
    description: "显示单价×数量−优惠券+税费/运费的账单明细",
    priority: 18,
    hooks: {
      onMount: (context) => {
        const cleanup = setupForceUpdateOnBusKeys(context, [
          BusKeys.skuPrice,
          BusKeys.quantity,
          BusKeys.couponApplied,
        ]);
        return cleanup;
      },
      renderFooter: (context) => {
        if (cfg.placement !== "footer") return null;
        const skuPrice = context.bus?.getData?.(BusKeys.skuPrice);
        const price = Number((skuPrice as any) ?? (context.data as any)?.price ?? 0);
        const qty = Number(context.bus?.getData?.(BusKeys.quantity) ?? 1);
        const appliedCoupon = context.bus?.getData?.(BusKeys.couponApplied) as { code?: string; discount?: number } | undefined;
        const subtotal = price * qty;
        const couponCut = Math.min(appliedCoupon?.discount ?? 0, subtotal);
        const tax = cfg.showTax ? Math.round(subtotal * (cfg.taxRate ?? 0)) : 0;
        const shipping = cfg.showShipping ? (cfg.shippingFee ?? 0) : 0;
        const total = Math.max(0, subtotal - couponCut + tax + shipping);

        return (
          <div style={{ padding: 12, borderTop: "1px dashed #eee" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, fontSize: 13, color: "#555" }}>
              {cfg.showBreakdown && (
                <>
                  <span>单价 × 数量</span>
                  <span style={{ textAlign: "right" }}>{formatCurrency(price, cfg.currency, cfg.locale)} × {qty}</span>
                  {appliedCoupon?.code && (
                    <>
                      <span>优惠券（{appliedCoupon.code}）</span>
                      <span style={{ textAlign: "right", color: "#e53935" }}>- {formatCurrency(couponCut, cfg.currency, cfg.locale)}</span>
                    </>
                  )}
                  {cfg.showTax && (
                    <>
                      <span>税费</span>
                      <span style={{ textAlign: "right" }}>{formatCurrency(tax, cfg.currency, cfg.locale)}</span>
                    </>
                  )}
                  {cfg.showShipping && (
                    <>
                      <span>运费</span>
                      <span style={{ textAlign: "right" }}>{formatCurrency(shipping, cfg.currency, cfg.locale)}</span>
                    </>
                  )}
                </>
              )}
            </div>

            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#888" }}>合计</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#1e88e5" }}>{formatCurrency(total, cfg.currency, cfg.locale)}</span>
            </div>
          </div>
        );
      },
      renderOverlay: (context) => {
        if (cfg.placement !== "overlay") return null;
        const skuPrice = context.bus?.getData?.(BusKeys.skuPrice);
        const price = Number((skuPrice as any) ?? (context.data as any)?.price ?? 0);
        const qty = Number(context.bus?.getData?.(BusKeys.quantity) ?? 1);
        const appliedCoupon = context.bus?.getData?.(BusKeys.couponApplied) as { code?: string; discount?: number } | undefined;
        const subtotal = price * qty;
        const couponCut = Math.min(appliedCoupon?.discount ?? 0, subtotal);
        const tax = cfg.showTax ? Math.round(subtotal * (cfg.taxRate ?? 0)) : 0;
        const shipping = cfg.showShipping ? (cfg.shippingFee ?? 0) : 0;
        const total = Math.max(0, subtotal - couponCut + tax + shipping);

        return (
          <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, background: "rgba(255,255,255,0.95)", borderRadius: 8, padding: 8, zIndex: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#666" }}>合计</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#1e88e5" }}>{formatCurrency(total, cfg.currency, cfg.locale)}</span>
            </div>
          </div>
        );
      },
    },
    config: cfg,
  };

  return plugin;
};