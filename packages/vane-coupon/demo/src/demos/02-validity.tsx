import React from "react";
import { createCouponCard } from "vane-coupon";
import { createClaimStatePlugin } from "vane-coupon/custom-plugins/ClaimStatePlugin";
import { createValidityPlugin } from "vane-coupon/custom-plugins/ValidityPlugin";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();

/** 紧迫：还剩 2 天（≤ urgentDays 3） */
const UrgentCoupon = createCouponCard([
  createValidityPlugin({ urgentDays: 3 }),
  createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
]);

/** 已过期：validTo 在过去 → 有效期行打「已过期」，状态机联动降级 expired */
const ExpiredCoupon = createCouponCard([
  createValidityPlugin(),
  createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
]);

/** 相对有效期：未领取时显示「领取后 N 天内有效」，领取后从 claimedAt 起算 */
const RelativeCoupon = createCouponCard([
  createValidityPlugin(),
  createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
]);

export const meta = {
  slug: "validity",
  title: "有效期判定",
  group: "plugin" as const,
  intro:
    "绝对（validFrom/validTo）与相对（领取后 N 天）双模式；紧迫态强调展示；过期的券会被状态机自动压到「已过期」。",
};

export default function ValidityDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <UrgentCoupon
        coupon={{
          id: "v1",
          title: "紧迫态 · 仅剩 2 天",
          amount: 15,
          threshold: 99,
          validFrom: NOW - 10 * DAY,
          validTo: NOW + 2 * DAY,
        }}
      />
      <ExpiredCoupon
        coupon={{
          id: "v2",
          title: "过期联动 · 按钮自动变已过期",
          amount: 50,
          threshold: 299,
          validTo: NOW - 1 * DAY,
        }}
      />
      <RelativeCoupon
        coupon={{
          id: "v3",
          title: "相对有效期 · 领取后 7 天",
          amount: 8,
          threshold: 0,
          validDays: 7,
        }}
      />
    </div>
  );
}
