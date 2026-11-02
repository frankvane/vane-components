import React from "react";
import { createCouponCard } from "vane-coupon";
import { createRuleExpandPlugin } from "vane-coupon/custom-plugins/RuleExpandPlugin";

const RULES = [
  "本券仅限平台在售自营商品使用",
  "不与店铺优惠券叠加，可与运费券叠加",
  "订单部分退款时，按比例退回券面金额",
  "单笔订单最多使用 1 张，核销后不找零",
  "如在有效期内未使用，券自动作废且不予补发",
];

const Fold1 = createCouponCard([createRuleExpandPlugin({ collapsedCount: 1 })]);
const Fold2 = createCouponCard([
  createRuleExpandPlugin({ collapsedCount: 2, title: "" }),
]);

export const meta = {
  slug: "rules",
  title: "规则展开 / 收起",
  group: "plugin" as const,
  intro:
    "按条数折叠（不是 line-clamp——tasks/28 证明那是纵向裁切重灾区）。点击展开/收起，展开态写内核 state。",
};

export default function RulesDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <Fold1
        coupon={{
          id: "r1",
          title: "默认折叠 1 条",
          amount: 25,
          threshold: 199,
          rules: RULES,
        }}
      />
      <Fold2
        coupon={{
          id: "r2",
          title: "折叠 2 条 · 无标题",
          amount: 60,
          threshold: 399,
          rules: RULES,
        }}
      />
    </div>
  );
}
