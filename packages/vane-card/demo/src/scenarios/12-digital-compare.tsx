/**
 * 场景 12 · 3C：版本组合 + 全网比价
 *
 * 3C 商详的决策链比服饰长：先选「颜色 × 套装」，再比「别家多少钱」，
 * 最后看「到手价」。这三件事分别属于三个插件，但必须读同一份数据 ——
 * 否则会出现「比价区写 899，到手价写 1049」这种当场露馅的错。
 *
 * 这里故意让套装影响价格（标准 899 / 套装 1049），比价区跟着变，
 * 这是「同一份 SKU 状态驱动三个区」的最小验证。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createComparePricePlugin,
  createInventoryPlugin,
  createPriceCalculatorPlugin,
  createSKUPlugin,
} from "vane-card/custom-plugins";
import { BUDS, skuVariantsOf } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "digital-compare",
  title: "3C：版本组合 + 全网比价",
  group: "交易",
  industry: "3C 数码",
  ref: { label: "3C 商详（版本 + 比价 + 到手价）", url: "https://github.com/frankvane/vane-components" },
  pain: "「别家 879」「到手 1049」两个数字同时出现，用户第一反应是被骗 —— 因为比价没跟着选中的套装走。",
  plugs: [
    { fn: "createSKUPlugin", cfg: "attributes: attrs, variants: variants", why: "颜色 × 套装，套装会改价格" },
    { fn: "createComparePricePlugin", cfg: "showLowestPrice: true", why: "全网比价，读的是当前变体价不是原价" },
    { fn: "createPriceCalculatorPlugin", cfg: "showSavings: true", why: "到手价唯一算法，比价区不自己算" },
    { fn: "createInventoryPlugin", cfg: "lowStockThreshold: 5", why: "雾白套装已缺货，要在选之前就说明" },
  ],
  props: ["padding={16}"],
  note: "比价插件只负责「别的店多少钱」，绝不碰「到手价」。两个数分开算，页面才不会自相矛盾。",
};

const COMPETITORS = [
  { name: "京东", price: 899 },
  { name: "天猫", price: 949 },
  { name: "拼多多", price: 879 },
];

const Card = withPlugins(CardCore, {
  plugins: [
    createSKUPlugin({ attributes: BUDS.attributes, variants: skuVariantsOf(BUDS) }),
    createComparePricePlugin({ competitors: COMPETITORS, showLowestPrice: true }),
    createPriceCalculatorPlugin({ showSavings: true, showDiscount: true }),
    createInventoryPlugin({ lowStockThreshold: 5 }),
  ],
});

export default function DigitalCompare() {
  return (
    <Card cardId="scn-digital" data={BUDS} padding={16}>
      <div className="scn-content">
        <div className="scn-content__title">{BUDS.title}</div>
        <div className="scn-content__sub">
          切到「充电盒套装」看比价与到手价是否同步变成 1049
        </div>
      </div>
    </Card>
  );
}
