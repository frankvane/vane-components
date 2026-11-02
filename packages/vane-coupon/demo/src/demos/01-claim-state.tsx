import React from "react";
import { createCouponCard } from "vane-coupon";
import type { CouponData } from "vane-coupon";
import { createClaimStatePlugin } from "vane-coupon/custom-plugins/ClaimStatePlugin";

/**
 * 装配工厂在模块顶层调用（渲染体内调用会每次渲染造新实例，重挂载丢状态）。
 */
const ClaimCoupon = createCouponCard([
  createClaimStatePlugin({
    claim: async () => {
      await new Promise((r) => setTimeout(r, 600));
      return { ok: true };
    },
  }),
]);

const FailCoupon = createCouponCard([
  createClaimStatePlugin({
    claim: async () => {
      await new Promise((r) => setTimeout(r, 600));
      return { ok: false, reason: "超出限领数量" };
    },
    onClaimError: (reason) => console.warn("[claim 失败]", reason),
  }),
]);

export const meta = {
  slug: "claim-state",
  title: "领取状态机",
  group: "basic" as const,
  intro:
    "点击领取：available → claiming → claimed。第二张卡模拟领取失败，回退 available（终态 used/soldout/expired 不再响应点击）。",
};

export default function ClaimStateDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <ClaimCoupon
        coupon={{ id: "cs1", title: "点击领取试试 · 成功流", amount: 20, threshold: 199 } as CouponData}
      />
      <FailCoupon
        coupon={{ id: "cs2", title: "点击领取试试 · 失败回退流", amount: 5, threshold: 0 } as CouponData}
      />
    </div>
  );
}
