import React from "react";
import { createSkuSelector } from "vane-sku";
import { createPriceLinkPlugin } from "vane-sku/custom-plugins/PriceLink";
import { createStockStatusPlugin } from "vane-sku/custom-plugins/StockStatus";
import { ATTRIBUTES, VARIANTS } from "../../data/sample";

// 03 价格联动 + 库存状态：命中变体后显单价与原价删除线，并提示现货 / 仅剩 N 件。
const Sku = createSkuSelector([
  createPriceLinkPlugin({ discountText: "限时8折" }),
  createStockStatusPlugin({ lowStockThreshold: 5 }),
]);

export default function PriceStockScenario() {
  return (
    <div style={{ background: "#fff", borderRadius: 2, padding: 14, color: "#1f2328", width: "100%" }}>
      <Sku
        attributes={ATTRIBUTES}
        variants={VARIANTS}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
    </div>
  );
}
