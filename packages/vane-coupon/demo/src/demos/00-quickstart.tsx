import React from "react";
import { CouponCard } from "vane-coupon";

export const meta = {
  slug: "quickstart",
  title: "裸券 · 零插件",
  group: "basic" as const,
  intro: "不装任何插件：面额区（¥ / 折）+ 门槛 + 标题，这就是核心组件本体的全部。",
};

export default function QuickstartDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <CouponCard
        coupon={{ id: "c1", title: "新人专享券", amount: 10, threshold: 99 }}
      />
      <CouponCard
        coupon={{
          id: "c2",
          title: "服饰品类折扣券",
          amount: 8.5,
          amountType: "discount",
          threshold: 0,
        }}
      />
      <CouponCard
        coupon={{
          id: "c3",
          title: "自定义门槛文案",
          amount: 30,
          thresholdText: "限下单实物商品",
        }}
      />
    </div>
  );
}
