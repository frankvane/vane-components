import React from "react";
import { createSkuSelector } from "vane-sku";
import { ATTRIBUTES, VARIANTS } from "../../data/sample";

// 01 禁用推导：内核内置的组合矩阵 + 禁用推导。缺 blue-l 变体，选「蓝」后 L 自动置灰。
const Sku = createSkuSelector([]);

export default function DisableScenario() {
  return (
    <div style={{ background: "#fff", borderRadius: 2, padding: 14, color: "#1f2328", width: "100%" }}>
      <Sku attributes={ATTRIBUTES} variants={VARIANTS} />
    </div>
  );
}
