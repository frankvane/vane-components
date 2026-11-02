import React from "react";
import { createCouponCard } from "vane-coupon";
import type { CouponData } from "vane-coupon";
import { createQuotaPlugin } from "vane-coupon/custom-plugins/QuotaPlugin";

/** 装配工厂在模块顶层调用（渲染体内调用会每次渲染造新实例，重挂载丢状态）。 */
const OkCoupon = createCouponCard([
  createQuotaPlugin({ quota: 3, purchasedCount: 1, onExceed: () => console.warn("[quota] 超限") }),
]);
const ExceededCoupon = createCouponCard([
  createQuotaPlugin({ quota: 2, purchasedCount: 2, onExceed: (q) => console.warn("[quota] 已达上限", q) }),
]);

export const meta = {
  slug: "quota",
  title: "限领提示",
  group: "plugin" as const,
  intro:
    "config.quota + purchasedCount 驱动限领提示条：未超限绿字「还可领 N 张」，超限红字「已达限领上限」并触发 onExceed；未声明 quota 时插件不渲染。",
};

export default function QuotaDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <OkCoupon coupon={{ id: "qt1", title: "还可领 · 1/3", amount: 15, threshold: 99 } as CouponData} />
      <ExceededCoupon coupon={{ id: "qt2", title: "已超限 · 2/2", amount: 15, threshold: 99 } as CouponData} />
    </div>
  );
}
