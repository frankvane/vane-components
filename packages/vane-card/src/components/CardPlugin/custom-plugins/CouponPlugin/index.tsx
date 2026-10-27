/**
 * CouponPlugin - 优惠券展示与应用插件
 */
import type { CardPlugin, PluginCreator } from "../../plugins/types";
import { BusKeys } from "../../plugins/BusKeys";
import React from "react";

export interface Coupon {
  code: string;
  discount: number; // 金额或百分比（简单用金额）
  minAmount?: number;
  expiry?: Date;
}

export interface CouponPluginConfig {
  coupons: Coupon[];
  autoApply?: boolean;
}

export const createCouponPlugin: PluginCreator<any, CouponPluginConfig> = (
  config
) => {
  const coupons = config?.coupons || [];

  const plugin: CardPlugin = {
    name: "CouponPlugin",
    version: "1.0.0",
    description: "优惠券展示与应用",
    priority: 25,
    hooks: {
      onMount: (context) => {
        if (config?.autoApply && coupons.length) {
          context.bus?.setData?.(BusKeys.couponApplied, coupons[0]);
        }
      },
      renderFooter: (context) => {
        if (!coupons.length) return null;
        const applied: Coupon | undefined = context.bus?.getData?.(BusKeys.couponApplied);
        const apply = (c: Coupon) => context.bus?.setData?.(BusKeys.couponApplied, c);
        const clear = () => context.bus?.deleteData?.(BusKeys.couponApplied);

        return (
          <div style={{ padding: 12, borderTop: "1px dashed #eee" }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>可用优惠券</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {coupons.map((c) => {
                const isApplied = applied?.code === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => (isApplied ? clear() : apply(c))}
                    title={c.code}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: isApplied ? "2px solid #4CAF50" : "1px solid #ddd",
                      background: isApplied ? "#E8F5E9" : "#fff",
                      color: "#333",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {c.code} - 立减 ¥{c.discount}
                  </button>
                );
              })}
            </div>
            {applied && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#388e3c" }}>
                已应用优惠券：{applied.code}（立减 ¥{applied.discount}）
              </div>
            )}
          </div>
        );
      },
    },
    config,
  };

  return plugin;
};