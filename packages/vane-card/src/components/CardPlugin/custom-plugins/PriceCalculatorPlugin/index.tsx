/**
 * PriceCalculatorPlugin - 价格计算与展示插件
 */
import type { CardPlugin, PluginCreator } from "../../plugins/types";
import { BusKeys } from "../../plugins/BusKeys";
import { setupForceUpdateOnBusKeys } from "../../plugins/utils/busHelpers";
import { applyDefaults } from "../../plugins/utils/config";
import React from "react";

export interface PriceCalculatorPluginConfig {
  showOriginalPrice?: boolean;
  showDiscount?: boolean; // 显示折扣百分比
  showSavings?: boolean; // 显示节省金额
  showSavingsBadgeInPriceArea?: boolean; // 在价格区域显示节省徽章
  showTotalPrice?: boolean; // 显示按数量与优惠后的合计
  currency?: string; // 如 CNY, USD
  locale?: string; // 如 zh-CN, en-US
  order?: number; // priceArea 渲染顺序
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

export const createPriceCalculatorPlugin: PluginCreator<any, PriceCalculatorPluginConfig> = (
  config = {}
) => {
  const cfg = applyDefaults<PriceCalculatorPluginConfig>(config, {
    showOriginalPrice: true,
    showDiscount: true,
    showSavings: true,
    showSavingsBadgeInPriceArea: true,
    showTotalPrice: false,
    currency: "CNY",
    locale: "zh-CN",
    order: 10,
  });

  const plugin: CardPlugin = {
    name: "PriceCalculatorPlugin",
    version: "1.0.0",
    description: "价格计算与展示（现价/原价/折扣/节省）",
    priority: 20,
    hooks: {
      onMount: (context) => {
        // 在价格/数量/优惠券相关键变化时触发更新与事件发布
        const recalc = () => {
          const skuPrice = context.bus?.getData?.(BusKeys.skuPrice);
          const price = Number((skuPrice as any) ?? (context.data as any)?.price ?? 0);
          const quantity = Number(context.bus?.getData?.(BusKeys.quantity) ?? 1);
          const appliedCoupon = context.bus?.getData?.(BusKeys.couponApplied) as { code?: string; discount?: number } | undefined;
          const subtotal = price * quantity;
          const total = Math.max(0, subtotal - (appliedCoupon?.discount ?? 0));
          // 发布 price:change 事件（含当前单价/数量/小计/合计/券）
          context.bus?.emit?.("price:change", { price, quantity, subtotal, total, coupon: appliedCoupon });
          // 触发 UI 刷新
          context.forceUpdate();
        };

        const off1 = context.bus?.on?.(BusKeys.skuPrice, recalc);
        const off2 = context.bus?.on?.(BusKeys.quantity, recalc);
        const off3 = context.bus?.on?.(BusKeys.couponApplied, recalc);
        // 初始化一次
        recalc();
        // 卸载清理
        return () => {
          if (off1) {
            try { off1(); } catch {}
          }
          if (off2) {
            try { off2(); } catch {}
          }
          if (off3) {
            try { off3(); } catch {}
          }
        };
      },
      renderFooter: (context) => {
        const skuPrice = context.bus?.getData?.(BusKeys.skuPrice);
        const price = Number(
          (skuPrice as any) ?? (context.data as any)?.price ?? 0
        );
        const originalPrice = Number((context.data as any)?.originalPrice || 0);
        const hasOriginal = cfg.showOriginalPrice && originalPrice > price && originalPrice > 0;
        const savings = hasOriginal ? originalPrice - price : 0;
        const discount = hasOriginal ? Math.round((1 - price / originalPrice) * 100) : 0;

        const quantity = Number(context.bus?.getData?.(BusKeys.quantity) ?? 1);
        const appliedCoupon = context.bus?.getData?.(BusKeys.couponApplied) as { code?: string; discount?: number } | undefined;
        const subtotal = price * quantity;
        const total = Math.max(0, subtotal - (appliedCoupon?.discount ?? 0));

        return (
          <div style={{ padding: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#e53935" }}>
                {formatCurrency(price, cfg.currency, cfg.locale)}
              </span>
              {hasOriginal && (
                <span style={{ fontSize: 14, color: "#999", textDecoration: "line-through" }}>
                  {formatCurrency(originalPrice, cfg.currency, cfg.locale)}
                </span>
              )}
              {hasOriginal && cfg.showDiscount && (
                <span style={{ fontSize: 12, color: "#388e3c", fontWeight: 700 }}>-{discount}%</span>
              )}
            </div>

            {(hasOriginal && cfg.showSavings) && (
              <div style={{ marginTop: 4, fontSize: 12, color: "#555" }}>
                已省 {formatCurrency(savings, cfg.currency, cfg.locale)}
              </div>
            )}

            {cfg.showTotalPrice && (
              <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#666" }}>数量：{quantity}{appliedCoupon?.code ? `（已用券：${appliedCoupon.code}）` : ""}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1e88e5" }}>
                  合计 {formatCurrency(total, cfg.currency, cfg.locale)}
                </span>
              </div>
            )}
          </div>
        );
      },
      renderPriceArea: (context) => {
        const skuPrice = context.bus?.getData?.(BusKeys.skuPrice);
        const price = Number(
          (skuPrice as any) ?? (context.data as any)?.price ?? 0
        );
        const originalPrice = Number((context.data as any)?.originalPrice || 0);
        const hasOriginal = cfg.showOriginalPrice && originalPrice > price && originalPrice > 0;
        const discount = hasOriginal ? Math.round((1 - price / originalPrice) * 100) : 0;
        const savings = hasOriginal ? originalPrice - price : 0;
        if (!hasOriginal) return null;
        const nodes: React.ReactNode[] = [];
        if (cfg.showDiscount && discount > 0) {
          nodes.push(
            <span key="discount" style={{ fontSize: 12, color: "#388e3c", fontWeight: 700 }} title="折扣">
              -{discount}%
            </span>
          );
        }
        if (cfg.showSavingsBadgeInPriceArea && savings > 0) {
          nodes.push(
            <span
              key="savings"
              title="已省"
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontSize: 12,
                color: "#1b5e20",
                background: "#E8F5E9",
                border: "1px solid #C8E6C9",
                borderRadius: 12,
                padding: "2px 6px",
                marginLeft: 6,
              }}
            >
              省 {formatCurrency(savings, cfg.currency, cfg.locale)}
            </span>
          );
        }
        if (!nodes.length) return null;
        return <>{nodes}</>;
      },
    },
    config: cfg,
  };

  return plugin;
};