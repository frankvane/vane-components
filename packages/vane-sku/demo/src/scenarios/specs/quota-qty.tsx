import React from "react";
import { createSkuSelector } from "vane-sku";
import { createQuotaPlugin } from "vane-sku/custom-plugins/Quota";
import { createQuantityPlugin } from "vane-sku/custom-plugins/Quantity";
import { createSkuCodePlugin } from "vane-sku/custom-plugins/SkuCode";
import { createResetBarPlugin } from "vane-sku/custom-plugins/ResetBar";
import { ATTRIBUTES, VARIANTS } from "../../data/sample";

// 04 限购 + 数量上限：限购 2 / 已购 1，库存 5 → 数量上限取较小值 2，另有货号与清空重选。
const Sku = createSkuSelector([
  createQuotaPlugin({ purchasedCount: 1 }),
  createQuantityPlugin(),
  createSkuCodePlugin(),
  createResetBarPlugin(),
]);

export default function QuotaQtyScenario() {
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
