import React from "react";
import { createSkuSelector } from "vane-sku";
import { ATTRIBUTES, VARIANTS } from "../../data/sample";

// 06 缺货是否参与推导：green-l 库存 0。默认 ignoreOutOfStock=true 被置灰；
// 关闭后 green-l 可选（仍会标红「缺货」）。
const Sku = createSkuSelector([]);

export default function IgnoreStockScenario() {
  return (
    <div style={{ display: "grid", gap: 10, width: "100%" }}>
      <div>
        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>ignoreOutOfStock = true（默认）</div>
        <div style={{ background: "#fff", borderRadius: 2, padding: 12, color: "#1f2328" }}>
          <Sku attributes={ATTRIBUTES} variants={VARIANTS} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>ignoreOutOfStock = false</div>
        <div style={{ background: "#fff", borderRadius: 2, padding: 12, color: "#1f2328" }}>
          <Sku attributes={ATTRIBUTES} variants={VARIANTS} ignoreOutOfStock={false} />
        </div>
      </div>
    </div>
  );
}
