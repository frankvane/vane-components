import React from "react";
import { createSkuSelector } from "vane-sku";
import { createKeyboardNavPlugin } from "vane-sku/custom-plugins/KeyboardNav";
import { ATTRIBUTES, VARIANTS } from "../../data/sample";

// 07 键盘漫游：点中任一规格按钮后，用 ←→ 同行切换、↑↓ 跨行跳转（自动跳过置灰项）。
const Sku = createSkuSelector([createKeyboardNavPlugin()]);

export default function KeyboardScenario() {
  return (
    <div style={{ background: "#fff", borderRadius: 2, padding: 14, color: "#1f2328", width: "100%" }}>
      <Sku attributes={ATTRIBUTES} variants={VARIANTS} />
    </div>
  );
}
