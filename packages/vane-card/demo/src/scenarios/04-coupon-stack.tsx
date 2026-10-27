/**
 * 场景 04 · 优惠券叠加到手价
 *
 * 「券 → 到手价」最容易出错的地方是「谁算的价」：
 * CouponRecommend 只写 coupon.applied，PriceCalculator 读它算到手价，
 * OrderSummary 再把明细摊开。三处数字必须同源。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createCouponRecommendPlugin,
  createOrderSummaryPlugin,
  createPriceCalculatorPlugin,
  createQuantityPlugin,
} from "vane-card/custom-plugins";
import { TEE } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "coupon-stack",
  title: "券叠加到手价",
  group: "交易",
  industry: "通用",
  ref: { label: "券包 + 到手价", url: "https://github.com/frankvane/vane-components" },
  pain: "用户算不清「用券后多少钱」，客服也答不上来 —— 因为三个地方各算了一遍。",
  plugs: [
    { fn: "createCouponRecommendPlugin", cfg: "coupons: coupons, autoApplyBest: true", why: "挑最优券并写 coupon.applied" },
    { fn: "createPriceCalculatorPlugin", cfg: "showTotalPrice: true, showSavings: true", why: "按数量与券算到手价（唯一算法）" },
    { fn: "createQuantityPlugin", cfg: "min: 1, max: 5", why: "改数量会改变合计，进而改变最优券" },
    { fn: "createOrderSummaryPlugin", cfg: "showBreakdown: true, shippingFee: 12", why: "把明细摊开，让「到手价」可核对" },
  ],
  props: ["padding={16}"],
  note: "券的门槛按「券前金额」还是「券后金额」判断，是业务规则 —— 插件默认按券前，改口径请改配置而不是改插件。",
};

const COUPONS = [
  { code: "NEW30", discount: 30, minAmount: 199 },
  { code: "VIP50", discount: 50, minAmount: 399 },
  { code: "FREESHIP", discount: 12, minAmount: 99 },
];

const Card = withPlugins(CardCore, {
  plugins: [
    createCouponRecommendPlugin({ coupons: COUPONS, autoApplyBest: true }),
    createPriceCalculatorPlugin({ showTotalPrice: true, showSavings: true, showDiscount: true }),
    createQuantityPlugin({ min: 1, max: 5 }),
    createOrderSummaryPlugin({ showBreakdown: true, showShipping: true, shippingFee: 12 }),
  ],
});

export default function CouponStack() {
  return (
    <Card cardId="scn-coupon" data={TEE} padding={16}>
      <div className="scn-content">
        <div className="scn-content__title">{TEE.title}</div>
        <div className="scn-content__sub">改数量：最优券可能从 NEW30 换成 VIP50</div>
      </div>
    </Card>
  );
}
