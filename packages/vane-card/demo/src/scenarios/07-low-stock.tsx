/**
 * 场景 07 · 低库存告警
 *
 * 库存只有 4 件时的完整表达：覆盖层提示「仅剩 4 件」、数量步进上限收到 4、
 * 加购按钮仍然可点（卖完才禁）。三处口径必须一致 —— 否则用户能买 10 件。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createActionsPlugin,
  createBadgePlugin,
  createImagePlugin,
  createInventoryPlugin,
  createPriceCalculatorPlugin,
  createQuantityPlugin,
} from "vane-card/custom-plugins";
import { MUG } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "low-stock",
  title: "低库存告警",
  group: "交易",
  industry: "通用",
  ref: { label: "库存紧迫感", url: "https://github.com/frankvane/vane-components" },
  pain: "「仅剩 4 件」和步进器上限各写一遍，改一次库存要改两处，最后一定对不上。",
  plugs: [
    { fn: "createInventoryPlugin", cfg: "lowStockThreshold: 10, showOverlayWhenSoldOut: true", why: "按阈值给提示，售罄时盖住加购" },
    { fn: "createQuantityPlugin", cfg: "min: 1, useVariantStock: true", why: "上限取库存，库存降了就自动钳制" },
    { fn: "createBadgePlugin", cfg: 'text: "仅剩少量", type: "hot"', why: "角标强化紧迫感" },
    { fn: "createPriceCalculatorPlugin", why: "价格与数量联动（合计）" },
    { fn: "createImagePlugin", why: "商品主图" },
    { fn: "createActionsPlugin", why: "加购入口" },
  ],
  props: ["padding={0}", "data={{ ...product, inventory: 4 }}"],
  note: "把 inventory 改成 0 再看：覆盖层出现、加购被挡 —— 这是「同一份数据驱动两处」的做法。",
};

const Card = withPlugins(CardCore, {
  plugins: [
    createInventoryPlugin({ lowStockThreshold: 10, showOverlayWhenSoldOut: true }),
    createQuantityPlugin({ min: 1, useVariantStock: true }),
    createBadgePlugin({ text: "仅剩少量", type: "hot", position: "top-right" }),
    createPriceCalculatorPlugin({ showTotalPrice: true }),
    createImagePlugin({ alt: MUG.title }),
    createActionsPlugin(),
  ],
});

export default function LowStock() {
  return (
    <Card cardId="scn-lowstock" data={{ ...MUG, inventory: 4 }} padding={0}>
      <div className="scn-content">
        <div className="scn-content__title">{MUG.title}</div>
        <div className="scn-content__sub">库存 4 件 · 数量上限会跟着收</div>
      </div>
    </Card>
  );
}
