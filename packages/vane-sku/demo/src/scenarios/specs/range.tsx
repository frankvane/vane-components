import React from "react";
import { createSkuSelector } from "vane-sku";
import { createPriceRangePlugin } from "vane-sku/custom-plugins/PriceRange";
import { ATTRIBUTES, VARIANTS } from "../../data/sample";

// 02 价格区间：未选全时展示 ¥199–¥269；选了颜色后区间随选择收窄。
const Sku = createSkuSelector([createPriceRangePlugin()]);

export default function RangeScenario() {
  return (
    <div style={{ background: "#fff", borderRadius: 2, padding: 14, color: "#1f2328", width: "100%" }}>
      <Sku attributes={ATTRIBUTES} variants={VARIANTS} />
    </div>
  );
}
