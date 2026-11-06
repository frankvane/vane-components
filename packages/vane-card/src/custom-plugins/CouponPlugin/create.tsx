/**
 * CouponPlugin - 优惠券展示与应用插件
 */
import type { CardPlugin, PluginCreator } from "../../components/CardPlugin/plugins/types";
import { BusKeys } from "../../components/CardPlugin/plugins/BusKeys";
import { couponValueLabel, type CouponLike } from "../../components/CardPlugin/plugins/utils/coupon";
import React from "react";

export interface Coupon extends CouponLike {
  code: string;
  /** 金额或折数；配合 discountType 解释（见 utils/coupon） */
  discount: number;
  minAmount?: number;
  expiry?: Date;
}

export interface CouponPluginConfig {
  coupons: Coupon[];
  autoApply?: boolean;
}

// 工厂返回 T 收敛为 unknown：T 仅经 data 透传，自定义 data 形态的调用方请显式写泛型参数。
export const createCouponPlugin: PluginCreator<unknown, CouponPluginConfig> = (
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
            <div style={{ fontSize: 12, color: "#6b6b6b", marginBottom: 6 }}>可用优惠券</div>
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
                      border: isApplied ? "2px solid #2e7d32" : "1px solid #ddd",
                      background: isApplied ? "#E8F5E9" : "#fff",
                      color: "#333",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {c.code} - {couponValueLabel(c, "¥")}
                  </button>
                );
              })}
            </div>
            {applied && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#2e7d32" }}>
                已应用优惠券：{applied.code}（{couponValueLabel(applied, "¥")}）
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