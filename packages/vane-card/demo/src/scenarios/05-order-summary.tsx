/**
 * 场景 05 · 订单摘要
 *
 * 结算区：规格 + 数量 + 券 + 运费 + 税 → 一行合计。
 * 这个场景刻意把 OrderSummary 放在最后：它只读总线，不猜任何东西。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createCouponPlugin,
  createOrderSummaryPlugin,
  createQuantityPlugin,
  createSKUPlugin,
} from "vane-card/custom-plugins";
import { skuVariantsOf, TEE } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "order-summary",
  title: "订单摘要",
  group: "交易",
  ref: { label: "结算页摘要", url: "https://github.com/frankvane/vane-components" },
  pain: "明细行加起来和合计对不上 —— 因为合计是「另一个函数」算的。",
  plugs: [
    { fn: "createSKUPlugin", cfg: "attributes: attrs, variants: variants", why: "规格决定单价" },
    { fn: "createQuantityPlugin", cfg: "min: 1, max: 10", why: "数量决定小计" },
    { fn: "createCouponPlugin", cfg: "coupons: coupons", why: "券决定优惠额" },
    { fn: "createOrderSummaryPlugin", cfg: "showBreakdown: true, showTax: true, taxRate: 0.06, shippingFee: 12", why: "统一算合计并给明细" },
  ],
  props: ["padding={16}"],
  note: "税与运费在真实项目里应由服务端给（各地税率不同）；这里固定值只为让示例可复现。",
};

const Card = withPlugins(CardCore, {
  plugins: [
    createSKUPlugin({
      attributes: TEE.attributes as Array<{ name: string; options: string[] }>,
      variants: skuVariantsOf(TEE),
    }),
    createQuantityPlugin({ min: 1, max: 10 }),
    createCouponPlugin({
      coupons: [
        { code: "NEW30", discount: 30, minAmount: 199 },
        { code: "VIP50", discount: 50, minAmount: 399 },
      ],
    }),
    createOrderSummaryPlugin({
      showBreakdown: true,
      showTax: true,
      taxRate: 0.06,
      showShipping: true,
      shippingFee: 12,
    }),
  ],
});

export default function OrderSummary() {
  return (
    <Card cardId="scn-summary" data={TEE} padding={16}>
      <div className="scn-content">
        <div className="scn-content__title">{TEE.title}</div>
        <div className="scn-content__sub">选规格 → 领券 → 看合计：三处数字必须一致</div>
      </div>
    </Card>
  );
}
