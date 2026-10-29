import React from "react";
import { createSkuSelector } from "vane-sku";
import type { SkuAttribute } from "vane-sku";
import { ATTRIBUTES, VARIANTS } from "../../data/sample";

// 08 双属性简版：只留红/蓝两色，对比禁用推导在更小矩阵下的表现。
const COLOR_ATTR = ATTRIBUTES[0];
const SIZE_ATTR = ATTRIBUTES[1];
const TWO_COLOR: SkuAttribute = { ...COLOR_ATTR, options: COLOR_ATTR.options.slice(0, 2) };

const Sku = createSkuSelector([]);

export default function TwoAttrScenario() {
  return (
    <div style={{ background: "#fff", borderRadius: 2, padding: 14, color: "#1f2328", width: "100%" }}>
      <Sku
        attributes={[TWO_COLOR, SIZE_ATTR]}
        variants={VARIANTS.filter((v) => v.attrValues["颜色"] !== "green")}
      />
    </div>
  );
}
