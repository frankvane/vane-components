/**
 * CouponRecommendPlugin - 优惠券智能推荐
 */
import type { CardPlugin, PluginCreator } from "../../plugins/types";
import { BusKeys } from "../../plugins/BusKeys";
import { setupForceUpdateOnBusKeys } from "../../plugins/utils/busHelpers";
import { applyDefaults } from "../../plugins/utils/config";
import type { Coupon } from "../CouponPlugin";
import React from "react";

export interface CouponRecommendPluginConfig {
  coupons: Coupon[];
  placement?: "footer" | "overlay";
  autoApplyBest?: boolean; // 是否自动应用最佳券
  currency?: string;
  locale?: string;
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

function pickBestCoupon(coupons: Coupon[], subtotal: number): Coupon | undefined {
  const applicable = coupons.filter((c) => (c.minAmount ?? 0) <= subtotal);
  if (!applicable.length) return undefined;
  return applicable.reduce((best, c) => (c.discount > best.discount ? c : best), applicable[0]);
}

export const createCouponRecommendPlugin: PluginCreator<any, CouponRecommendPluginConfig> = (
  config
) => {
  const cfg = applyDefaults<CouponRecommendPluginConfig>(config || ({} as any), {
    coupons: [],
    placement: "footer",
    autoApplyBest: false,
    currency: "CNY",
    locale: "zh-CN",
    order: 30,
  });

  const plugin: CardPlugin = {
    name: "CouponRecommendPlugin",
    version: "1.0.0",
    description: "根据小计自动推荐更优优惠券",
    priority: 22,
    hooks: {
      onMount: (context) => {
        const cleanup = setupForceUpdateOnBusKeys(context, [
          BusKeys.skuPrice,
          BusKeys.quantity,
          BusKeys.couponApplied,
        ]);
        // 自动应用当前最优券（可选）
        if (cfg.autoApplyBest) {
          const price = Number((context.bus?.getData?.(BusKeys.skuPrice) as any) ?? (context.data as any)?.price ?? 0);
          const qty = Number(context.bus?.getData?.(BusKeys.quantity) ?? 1);
          const subtotal = price * qty;
          const best = pickBestCoupon(cfg.coupons, subtotal);
          if (best) context.bus?.setData?.(BusKeys.couponApplied, best);
        }
        return cleanup;
      },
      renderFooter: (context) => {
        if (cfg.placement !== "footer" || !cfg.coupons.length) return null;
        const price = Number((context.bus?.getData?.(BusKeys.skuPrice) as any) ?? (context.data as any)?.price ?? 0);
        const qty = Number(context.bus?.getData?.(BusKeys.quantity) ?? 1);
        const subtotal = price * qty;
        const applied = context.bus?.getData?.(BusKeys.couponApplied) as Coupon | undefined;
        const best = pickBestCoupon(cfg.coupons, subtotal);

        const isBetter = best && (!applied || best.discount > (applied.discount ?? 0));
        if (!best || !isBetter) return null;

        const delta = Math.max(0, (best.discount ?? 0) - (applied?.discount ?? 0));

        const applyBest = () => context.bus?.setData?.(BusKeys.couponApplied, best);

        return (
          <div style={{ padding: 12, borderTop: "1px dashed #eee", background: "#f9fff6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#388e3c", fontWeight: 700 }}>有更优优惠券可用</span>
              <span style={{ fontSize: 12, color: "#666" }}>可再省 {formatCurrency(delta, cfg.currency, cfg.locale)}</span>
              <button onClick={applyBest} style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 6, border: "1px solid #c8e6c9", background: "#e8f5e9", color: "#2e7d32" }}>一键使用</button>
            </div>
          </div>
        );
      },
      renderOverlay: (context) => {
        if (cfg.placement !== "overlay" || !cfg.coupons.length) return null;
        const price = Number((context.bus?.getData?.(BusKeys.skuPrice) as any) ?? (context.data as any)?.price ?? 0);
        const qty = Number(context.bus?.getData?.(BusKeys.quantity) ?? 1);
        const subtotal = price * qty;
        const applied = context.bus?.getData?.(BusKeys.couponApplied) as Coupon | undefined;
        const best = pickBestCoupon(cfg.coupons, subtotal);

        const isBetter = best && (!applied || best.discount > (applied.discount ?? 0));
        if (!best || !isBetter) return null;

        const applyBest = () => context.bus?.setData?.(BusKeys.couponApplied, best);
        return (
          <div style={{ position: "absolute", top: 8, left: 8, right: 8, background: "#e8f5e9", border: "1px solid #c8e6c9", borderRadius: 8, padding: 8, zIndex: 11 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#2e7d32", fontWeight: 700 }}>推荐更优券：{best.code}</span>
              <button onClick={applyBest} style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 6, border: "1px solid #c8e6c9", background: "#c8e6c9", color: "#2e7d32" }}>使用</button>
            </div>
          </div>
        );
      },
      renderPriceArea: (context) => {
        if (!cfg.coupons.length) return null;
        const price = Number((context.bus?.getData?.(BusKeys.skuPrice) as any) ?? (context.data as any)?.price ?? 0);
        const qty = Number(context.bus?.getData?.(BusKeys.quantity) ?? 1);
        const subtotal = price * qty;
        const applied = context.bus?.getData?.(BusKeys.couponApplied) as Coupon | undefined;
        const best = pickBestCoupon(cfg.coupons, subtotal);

        const isBetter = best && (!applied || (best.discount ?? 0) > (applied.discount ?? 0));
        if (!best || !isBetter) return null;

        const delta = Math.max(0, (best.discount ?? 0) - (applied?.discount ?? 0));
        const applyBest = () => context.bus?.setData?.(BusKeys.couponApplied, best);
        return (
          <span
            onClick={applyBest}
            title={`更优优惠券：${best.code}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#1b5e20",
              background: "#E8F5E9",
              border: "1px solid #C8E6C9",
              borderRadius: 12,
              padding: "2px 8px",
              cursor: "pointer",
              marginLeft: 6,
            }}
          >
            可领券再省 {formatCurrency(delta, cfg.currency, cfg.locale)}
          </span>
        );
      },
    },
    config: cfg,
  };

  return plugin;
};