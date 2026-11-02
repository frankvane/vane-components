import React from "react";
import { createCouponCard } from "vane-coupon";
import { createStackPlugin } from "vane-coupon/custom-plugins/StackPlugin";

const StackableCoupon = createCouponCard([createStackPlugin()]);
const NotStackableCoupon = createCouponCard([
  createStackPlugin({ showWhenNotStackable: true }),
]);
const ForcedCoupon = createCouponCard([createStackPlugin({ always: true })]);

export const meta = {
  slug: "stack",
  title: "叠加态角标",
  group: "plugin" as const,
  intro:
    "数据驱动：coupon.stackable === true 渲染「可叠加」强调角标；false + showWhenNotStackable 渲染灰标；always 强制渲染。",
};

export default function StackDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <StackableCoupon
        coupon={{
          id: "s1",
          title: "可与运费券叠加",
          amount: 18,
          threshold: 128,
          stackable: true,
        }}
      />
      <NotStackableCoupon
        coupon={{
          id: "s2",
          title: "独享券 · 不可叠加",
          amount: 40,
          threshold: 259,
          stackable: false,
        }}
      />
      <ForcedCoupon
        coupon={{
          id: "s3",
          title: "always 强制渲染（数据未声明）",
          amount: 6,
          threshold: 0,
        }}
      />
    </div>
  );
}
