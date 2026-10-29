import React from "react";
import { createSkuSelector } from "vane-sku";
import type { ScenarioMeta } from "./types";
import { ATTRIBUTES, VARIANTS } from "../data/sample";

/**
 * 04 · 卡片内轻量选规格（对标 vane-card 的 SKUPlugin）
 *
 * 只装内核：规格按钮组（含禁用推导）+ 选中摘要，一件长尾都不带。
 * 演示「插件式引擎」的减法 —— 不需要的价格浮层 / 限购 / 数量完全不付代价。
 */
export const meta: ScenarioMeta = {
  id: "minimal",
  title: "卡片内轻量选规格",
  group: "轻量嵌入",
  ref: { label: "vane-card", url: "https://github.com/frankvane/vane-components" },
  pain: "卡片里只需要选规格，不要一堆浮层花活",
  plugs: [],
  props: [],
  note: "对标 vane-card 的 SKUPlugin（卡片内轻量选规格）：那边每个选项永远可点、错配只是不命中、没有限购校验；vane-sku 裸内核 = 规格按钮组 + 选中摘要，但禁用推导仍在（选「蓝」后 L 依旧置灰）。要价格 / 限购 / 数量这些长尾，这边装插件即可，不用换引擎。",
};

// 这一版只用内核：组合矩阵 + 禁用推导 + 规格按钮组，0 个插件
const Sku = createSkuSelector([]);

export default function MinimalSkuScenario() {
  return (
    <div
      className="sku-card"
      style={{
        maxWidth: 300,
        margin: "0 auto",
        background: "#fff",
        padding: 14,
        borderRadius: 3,
        color: "#1f2328",
      }}
    >
      <Sku attributes={ATTRIBUTES} variants={VARIANTS} />
    </div>
  );
}
