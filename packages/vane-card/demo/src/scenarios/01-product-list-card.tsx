/**
 * 场景 01 · 商品列表卡
 *
 * 最常见的一张卡：图、角标、标题、价格、悬停反馈、加购。
 * 重点是「六个插件互不耦合」：Image 管图、Badge 管角标、PriceCalculator 管价、
 * Hover 管反馈、Actions 管按钮 —— 少装任何一个，其它照常工作。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createActionsPlugin,
  createBadgePlugin,
  createHoverPlugin,
  createImagePlugin,
  createPriceCalculatorPlugin,
} from "vane-card/custom-plugins";
import { TEE } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "product-list-card",
  title: "商品列表卡",
  group: "列表",
  industry: "通用",
  ref: { label: "通用电商列表卡形态", url: "https://github.com/frankvane/vane-components" },
  pain: "列表里一张卡要同时表达「长什么样、多少钱、有什么标签、能不能点」，但每项来源不同。",
  plugs: [
    { fn: "createImagePlugin", why: "主图，破图时兜底不塌高度" },
    { fn: "createBadgePlugin", cfg: 'text: "甄选"', why: "运营角标，不占布局" },
    { fn: "createPriceCalculatorPlugin", why: "现价 + 折扣，价格区唯一决策者" },
    { fn: "createHoverPlugin", cfg: "enableScale: true", why: "悬停反馈，暗示「可点」" },
    { fn: "createActionsPlugin", why: "加购按钮（列表卡也要能直接下单）" },
  ],
  props: ["padding={0}"],
  note: "列表卡别装 Countdown 和 Animation 之外的重插件：一屏十几张，每个插件都在乘 十几 倍。",
};

const Card = withPlugins(CardCore, {
  plugins: [
    createImagePlugin({ alt: TEE.title }),
    createBadgePlugin({ text: "甄选", type: "premium" }),
    createPriceCalculatorPlugin({ showDiscount: true, showSavings: true }),
    createHoverPlugin({ enableScale: true, enableShadow: true }),
    createActionsPlugin(),
  ],
});

export default function ProductListCard() {
  return (
    <div className="scn-cards">
      {[TEE, { ...TEE, id: "p-tee-2", title: "同款 · 橄榄绿", price: 319 }].map((item, i) => (
        <Card key={String(item.id)} cardId={`list-${i}`} data={item} padding={0}>
          <div className="scn-content">
            <div className="scn-content__title">{item.title}</div>
            <div className="scn-content__sub">{item.subtitle}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
