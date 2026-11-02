import React from "react";
import { createCouponCard } from "vane-coupon";
import type { CouponData } from "vane-coupon";
import { createProgressPlugin } from "vane-coupon/custom-plugins/ProgressPlugin";

/** 装配工厂在模块顶层调用（渲染体内调用会每次渲染造新实例，重挂载丢状态）。 */
const NormalCoupon = createCouponCard([createProgressPlugin()]);
const UrgentCoupon = createCouponCard([createProgressPlugin({ urgentPct: 30 })]);
const SoldoutCoupon = createCouponCard([createProgressPlugin()]);

export const meta = {
  slug: "progress",
  title: "抢购进度条",
  group: "plugin" as const,
  intro:
    "total/claimed 驱动进度条与「已抢 X%」；剩余占比低于 urgentPct（默认 20）转紧迫色并追加「仅剩 N 张」；抢完后显示「已抢完」。",
};

export default function ProgressDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <NormalCoupon
        coupon={{ id: "pg1", title: "常规进度 · 30/100", amount: 10, threshold: 0, total: 100, claimed: 30 } as CouponData}
      />
      <UrgentCoupon
        coupon={{ id: "pg2", title: "紧迫进度 · 85/100（urgentPct 30）", amount: 50, threshold: 299, total: 100, claimed: 85 } as CouponData}
      />
      <SoldoutCoupon
        coupon={{ id: "pg3", title: "已抢完 · 100/100", amount: 10, threshold: 0, total: 100, claimed: 100 } as CouponData}
      />
    </div>
  );
}
