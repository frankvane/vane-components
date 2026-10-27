/**
 * 场景 11 · 生鲜：按重量卖
 *
 * 生鲜和服饰最大的区别不是图，是**计量单位**：
 * 服饰的「尺码」是离散属性，生鲜的「规格」是重量，而「数量」在生鲜里
 * 指的是「几份」不是「几件」——两者乘起来才是总重，价格必须跟着重量走。
 *
 * 这一页的坑在于 Quantity 的上限：服饰看库存件数，生鲜看「还剩几份」。
 * 所以 Quantity 的 max 由 SKU 变体的 stock 推，而不是写死。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createBadgePlugin,
  createImagePlugin,
  createInventoryPlugin,
  createPriceCalculatorPlugin,
  createQuantityPlugin,
  createSKUPlugin,
} from "vane-card/custom-plugins";
import { MANGO, skuVariantsOf } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "fresh-weight",
  title: "生鲜：按重量卖",
  group: "商详",
  industry: "生鲜",
  ref: { label: "生鲜商详（重量规格 + 时效）", url: "https://github.com/frankvane/vane-components" },
  pain: "「500g 还是 1kg」是生鲜的第一个决策点，而「几份」是第二个 —— 两个维度揉在同一行里，用户和代码都会算错。",
  plugs: [
    { fn: "createImagePlugin", cfg: "alt: MANGO.title", why: "商详必须有主图；没有图时左上角的库存角标会直接压住标题" },
    { fn: "createSKUPlugin", cfg: "attributes: attrs, variants: variants", why: "规格 = 重量，切规格要连带换库存与价格" },
    { fn: "createPriceCalculatorPlugin", cfg: "showOriginalPrice: true", why: "价格必须跟着重量（规格）与份数一起变" },
    { fn: "createQuantityPlugin", cfg: "min: 1, useVariantStock: true", why: "「份数」上限跟着当前规格的剩余份数走" },
    { fn: "createInventoryPlugin", cfg: "lowStockThreshold: 10", why: "生鲜库存少，低于 10 份要提前告知" },
    { fn: "createBadgePlugin", cfg: 'text: "今日达", type: "new"', why: "时效是生鲜的第二个卖点，角标最省位置" },
  ],
  props: ["padding={16}"],
  note: "Quantity 的 max 不要写死：生鲜 1kg 只剩 12 份、2kg 只剩 3 份，写死一个数就等于对用户撒谎。",
};

const ATTRS = MANGO.attributes;
const VARIANTS = skuVariantsOf(MANGO);

const Card = withPlugins(CardCore, {
  plugins: [
    createImagePlugin({ alt: MANGO.title }),
    createSKUPlugin({ attributes: ATTRS, variants: VARIANTS }),
    createPriceCalculatorPlugin({ showOriginalPrice: true }),
    createQuantityPlugin({ min: 1, useVariantStock: true }),
    createInventoryPlugin({ lowStockThreshold: 10 }),
    createBadgePlugin({ text: "今日达", type: "new" }),
  ],
});

export default function FreshWeight() {
  return (
    <Card cardId="scn-fresh" data={MANGO} padding={16}>
      <div className="scn-content" style={{ paddingTop: 26 }}>
        <div className="scn-content__title">{MANGO.title}</div>
        <div className="scn-content__sub">
          换规格看库存：2kg 只剩几份，1kg 还很足
        </div>
      </div>
    </Card>
  );
}
