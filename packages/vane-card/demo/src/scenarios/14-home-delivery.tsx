/**
 * 场景 14 · 家居：尺寸决定能不能进门，送装决定敢不敢买
 *
 * 大件的决策顺序和服饰反着来：先确认「进得了门吗」（尺寸），再确认
 * 「有人装吗」（送装服务），价格反而排在第三。所以这一页把尺寸选择器
 * 放在最前，运费与安装费单独摊开 —— 不摊开，用户会觉得「599 怎么结账变 699」。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createBadgePlugin,
  createOrderSummaryPlugin,
  createSKUPlugin,
} from "vane-card/custom-plugins";
import { LAMP, skuVariantsOf } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "home-delivery",
  title: "家居：尺寸 + 送装",
  group: "交易",
  industry: "家居",
  ref: { label: "大件家居商详（尺寸 + 送装费）", url: "https://github.com/frankvane/vane-components" },
  pain: "大件商品的「运费 + 安装费」到结算页才冒出来，是家具类退货率最高的原因之一。",
  plugs: [
    { fn: "createSKUPlugin", cfg: "attributes: attrs, variants: variants", why: "尺寸 × 颜色，140cm 已缺货" },
    { fn: "createOrderSummaryPlugin", cfg: "showShipping: true, shippingFee: 60", why: "大件运费必须提前摊开，别等结算页" },
    { fn: "createBadgePlugin", cfg: 'text: "包安装", type: "premium"', why: "送装一体是家居的核心卖点" },
  ],
  props: ["padding={16}"],
  note: "运费在 OrderSummary 里是「配置」不是「计算」：真实项目应从地址服务取，示例里写死 60 是为了让明细可见。",
};

const Card = withPlugins(CardCore, {
  plugins: [
    createSKUPlugin({ attributes: LAMP.attributes, variants: skuVariantsOf(LAMP) }),
    createOrderSummaryPlugin({ showBreakdown: true, showShipping: true, shippingFee: 60 }),
    createBadgePlugin({ text: "包安装", type: "premium" }),
  ],
});

export default function HomeDelivery() {
  return (
    <Card cardId="scn-home" data={LAMP} padding={16}>
      <div className="scn-content">
        <div className="scn-content__title">{LAMP.title}</div>
        <div className="scn-content__sub">切 140cm：缺货；运费 60 元写在明细里</div>
      </div>
    </Card>
  );
}
