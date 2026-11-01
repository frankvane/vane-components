import React, { useState } from "react";
import { createCouponCard } from "vane-coupon";
import {
  createClaimStatePlugin,
  createQuotaPlugin,
  createRuleExpandPlugin,
  createValidityPlugin,
} from "vane-coupon/custom-plugins";
import type { ScenarioMeta } from "./types";

/**
 * 01 · 领券主流程
 *
 * 「有效期判定 + 领取状态机 + 限领 + 规则」四个原子插件拼成一张可领取的券。
 * Validity 与 ClaimState 只经内核 state 联动：过期券自动降级为「已过期」。
 */
export const meta: ScenarioMeta = {
  id: "claim-flow",
  title: "领券主流程",
  group: "领取流程",
  ref: { label: "电商 App · 商品详情领券", url: "https://vane.dev/examples/coupon/claim-flow" },
  pain: "光有面额和标题用户不敢领：什么时候截止、能领几张、规则有没有坑，都要一眼看清。",
  plugs: [
    { fn: "createValidityPlugin", why: "有效期判定行 + 紧迫态，结果写入内核 state 驱动状态机" },
    {
      fn: "createClaimStatePlugin",
      cfg: "claim: async () => ({ ok: true })",
      why: "主 CTA：idle/可领/领取中/已领/过期 七态按钮，领取失败自动回退",
    },
    { fn: "createQuotaPlugin", why: "每人限领 2 张，超出走 onExceed 而不是静默失败" },
    {
      fn: "createRuleExpandPlugin",
      cfg: "collapsedCount: 2",
      why: "规则默认收起只露 2 条，点开展开全量，不挤占票面",
    },
  ],
  props: ["coupon={coupon}"],
  note: "Validity 与 ClaimState 缺一不可：只有前者券面不会过期降级，只有后者过期了还能领。",
};

const Coupon = createCouponCard([
  createValidityPlugin(),
  createClaimStatePlugin({
    claim: async () => {
      await new Promise((r) => setTimeout(r, 600));
      return { ok: true };
    },
  }),
  createQuotaPlugin(),
  createRuleExpandPlugin({ collapsedCount: 2 }),
]);

export default function Stage() {
  const [claimed, setClaimed] = useState(0);
  const coupon = {
    id: "c-claim",
    title: "家电焕新专享券",
    amount: 30,
    threshold: 299,
    quota: 2,
    validFrom: Date.now() - 3 * 86_400_000,
    validTo: Date.now() + 4 * 86_400_000,
    rules: [
      "全平台通用，可与店铺优惠叠加使用",
      "下单满 299 元可用，家电类目除外",
      "领取后 4 天内有效，过期自动作废",
      "每单限用 1 张，不找零、不兑现",
    ],
  };
  return (
    <Coupon
      coupon={coupon}
      containerStyle={{ maxWidth: 420, margin: "0 auto" }}
      key={claimed}
    />
  );
}
