/**
 * 场景 02 · SKU 联动商详
 *
 * 商详页的核心链路：选颜色 → 选尺码 → 价格 / 库存 / 图片同时变。
 * 四个插件靠总线串起来，任何一个都不知道其它三个的存在：
 *   SKU（源，写 sku.*） → PriceCalculator（读 sku.price）→ Inventory（读 sku.variant.stock）
 *   Quantity（读变体库存当上限）
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createActionsPlugin,
  createImagePlugin,
  createInventoryPlugin,
  createPriceCalculatorPlugin,
  createQuantityPlugin,
  createSKUPlugin,
} from "vane-card/custom-plugins";
import { skuVariantsOf, TEE } from "../data/seed";
import type { ScenarioMeta } from "./types";

const ATTRS = TEE.attributes as Array<{ name: string; options: string[] }>;
const VARIANTS = skuVariantsOf(TEE);

export const meta: ScenarioMeta = {
  id: "sku-detail",
  title: "SKU 联动商详",
  group: "商详",
  industry: "通用",
  ref: { label: "规格选择 + 价格联动", url: "https://github.com/frankvane/vane-components" },
  pain: "选规格之后价格、库存、主图三处都要变，手写时总会漏掉一处。",
  plugs: [
    { fn: "createSKUPlugin", cfg: "attributes: attrs, variants: variants", why: "唯一的价格 / 库存 / 图片源，写总线" },
    { fn: "createImagePlugin", why: "主图跟随 sku.image 自动换图" },
    { fn: "createPriceCalculatorPlugin", cfg: "showDiscount: true", why: "读 sku.price 算到手价与折扣" },
    { fn: "createQuantityPlugin", cfg: "useVariantStock: true", why: "数量上限跟随选中规格的库存" },
    { fn: "createInventoryPlugin", cfg: "lowStockThreshold: 5", why: "低库存 / 售罄提示" },
    { fn: "createActionsPlugin", why: "加购入口" },
  ],
  props: ["padding={0}"],
  note: "属性没选全时价格回退到商品级 price —— 这是刻意的，避免拿「颜色对了尺码没选」的变体价顶上。",
};

const Card = withPlugins(CardCore, {
  plugins: [
    createSKUPlugin({ attributes: ATTRS, variants: VARIANTS }),
    createImagePlugin({ alt: TEE.title }),
    createPriceCalculatorPlugin({ showDiscount: true, showSavings: true }),
    createQuantityPlugin({ useVariantStock: true, min: 1 }),
    createInventoryPlugin({ lowStockThreshold: 5 }),
    createActionsPlugin(),
  ],
});

export default function SkuDetail() {
  return (
    <Card cardId="scn-sku" data={TEE} padding={0}>
      <div className="scn-content">
        <div className="scn-content__title">{TEE.title}</div>
        <div className="scn-content__sub">先选颜色，再选尺码 —— 价格与库存会跟着变</div>
      </div>
    </Card>
  );
}
