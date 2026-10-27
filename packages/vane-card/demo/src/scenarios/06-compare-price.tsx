/**
 * 场景 06 · 比价
 *
 * 比价必须诚实：竞品更便宜就显示更便宜。这个场景里 288 < 299，
 * 所以「某电商」会被高亮，这是我们刻意留下的「不好看但真实」的示例。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createComparePricePlugin,
  createImagePlugin,
  createPriceCalculatorPlugin,
} from "vane-card/custom-plugins";
import { CHAIR } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "compare-price",
  title: "比价",
  group: "商详",
  ref: { label: "多渠道比价", url: "https://github.com/frankvane/vane-components" },
  pain: "用户先在别处比价再回来下单，页面却假装自己最便宜 —— 一旦被识破就失去信任。",
  plugs: [
    { fn: "createComparePricePlugin", cfg: "competitors: competitors, showLowestPrice: true, highlightLowerThanOurPrice: true", why: "列出竞品价、标出最低、比我们便宜时高亮" },
    { fn: "createPriceCalculatorPlugin", cfg: "showDiscount: true", why: "本店到手价，作为对比基准" },
    { fn: "createImagePlugin", why: "商品主图" },
  ],
  props: ["padding={0}"],
  note: "竞品价必须在服务端算好下发：前端抓竞品页面既不稳定，也有合规风险。",
};

const Card = withPlugins(CardCore, {
  plugins: [
    createComparePricePlugin({
      competitors: [
        { name: "线下专柜", price: 599 },
        { name: "某电商", price: 439 },
        { name: "官方旗舰", price: 499 },
      ],
      showLowestPrice: true,
      highlightLowerThanOurPrice: true,
      sortBy: "price",
      sortOrder: "asc",
    }),
    createPriceCalculatorPlugin({ showDiscount: true, showSavings: true }),
    createImagePlugin({ alt: CHAIR.title }),
  ],
});

export default function ComparePrice() {
  return (
    <Card cardId="scn-compare" data={CHAIR} padding={0}>
      <div className="scn-content">
        <div className="scn-content__title">{CHAIR.title}</div>
        <div className="scn-content__sub">本店 459，某电商 439 —— 高亮是真的，不是话术</div>
      </div>
    </Card>
  );
}
