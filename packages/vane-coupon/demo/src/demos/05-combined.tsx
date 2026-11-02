import React from "react";
import { createCouponCard } from "vane-coupon";
import type { CouponData } from "vane-coupon";
import { createClaimStatePlugin } from "vane-coupon/custom-plugins/ClaimStatePlugin";
import { createValidityPlugin } from "vane-coupon/custom-plugins/ValidityPlugin";
import { createRuleExpandPlugin } from "vane-coupon/custom-plugins/RuleExpandPlugin";
import { createStackPlugin } from "vane-coupon/custom-plugins/StackPlugin";

/** 全家桶装配：角标 → 有效期 → 规则 → 领取按钮，四槽各归其位 */
const FullCoupon = createCouponCard([
  createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
  createValidityPlugin({ urgentDays: 3 }),
  createRuleExpandPlugin({ collapsedCount: 1 }),
  createStackPlugin({ showWhenNotStackable: true }),
]);

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();

export const meta = {
  slug: "combined",
  title: "四插件合体",
  group: "advanced" as const,
  intro:
    "before 角标 / after 有效期+规则 / footer 领取按钮。priority：claim-state 32 · validity 23 · rule-expand 21 · stack 12。",
};

export default function CombinedDemo() {
  const coupon = {
    id: "full1",
    title: "全插件合体 · 紧迫可领",
    amount: 88,
    threshold: 599,
    stackable: true,
    validFrom: NOW - 12 * DAY,
    validTo: NOW + 2 * DAY,
    rules: [
      "仅限「家电焕新」活动商品使用",
      "可与运费券叠加，不与店铺券叠加",
      "核销后部分退款按比例退回",
    ],
  } as CouponData;

  const coupon2 = {
    id: "full2",
    title: "全插件合体 · 不可叠加",
    amount: 12,
    threshold: 0,
    stackable: false,
    validDays: 7,
    rules: ["全场通用", "有效期自领取日起算"],
  } as CouponData;

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <FullCoupon coupon={coupon} />
      <FullCoupon coupon={coupon2} />
    </div>
  );
}
