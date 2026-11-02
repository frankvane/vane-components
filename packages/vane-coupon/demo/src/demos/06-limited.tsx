import React from "react";
import { createCouponCard } from "vane-coupon";
import type { CouponData } from "vane-coupon";
import { createClaimStatePlugin } from "vane-coupon/custom-plugins/ClaimStatePlugin";
import { createStackPlugin } from "vane-coupon/custom-plugins/StackPlugin";

/** stock ≤ 0：挂载即降级 soldout（已抢光） */
const SoldoutCoupon = createCouponCard([
  createClaimStatePlugin({ stock: 0 }),
  createStackPlugin(),
]);

/** stock 3：正常可领（真实场景里 stock 来自接口轮询，重建插件即可刷新） */
const LimitedCoupon = createCouponCard([
  createClaimStatePlugin({
    stock: 3,
    claim: async () => {
      await new Promise((r) => setTimeout(r, 500));
      return { ok: true };
    },
  }),
  createStackPlugin(),
]);

export const meta = {
  slug: "limited",
  title: "限量 / 抢空",
  group: "advanced" as const,
  intro:
    "stock ≤ 0 挂载即「已抢光」（终态）；有限库存正常领取。过期判定同理：expired 优先级低于已核销 used。",
};

export default function LimitedDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <SoldoutCoupon
        coupon={{ id: "l1", title: "已抢空的券", amount: 100, threshold: 999 } as CouponData}
      />
      <LimitedCoupon
        coupon={{ id: "l2", title: "限量抢购中", amount: 66, threshold: 699 } as CouponData}
      />
    </div>
  );
}
