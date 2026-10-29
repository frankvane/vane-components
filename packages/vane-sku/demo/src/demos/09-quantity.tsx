import React, { useMemo } from "react";
import { createSkuSelector } from "vane-sku";
import { createQuantityPlugin } from "vane-sku/custom-plugins/Quantity";
import type { DemoMeta, DemoStageProps } from "./types";
import { ATTRIBUTES, VARIANTS } from "../data/sample";

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 2,
  padding: 14,
  color: "#1f2328",
  width: "100%",
};

/**
 * 09 · 数量步进 Quantity（插件功能）
 * 单装这一个：上限 = min(库存, 限购)。red/s 库存 5 / 限购 2 → 步进到 2 封顶；
 * 换 blue/s（无限购）→ 上限 5。数量的每次变化都进右栏日志。
 */
export const meta: DemoMeta = {
  slug: "quantity",
  title: "数量步进 Quantity",
  group: "plugin",
  plugin: "Quantity",
  intro: "上限 = min(库存, 限购)：red/s 到 2 就封顶（限购 2），换 blue/s（无限购）上限变 5。",
  why: "别让用户选了 10 件、提交时才发现限购 2——上限在选数量那一刻就该说清楚。",
  plugs: [
    {
      fn: "createQuantityPlugin",
      cfg: "defaultValue: {{initQty}}, onChange: (q) => track(q)",
      why: "渲染数量步进器并把数量写进内核 state（key: quantity）",
    },
  ],
  props: [
    "attributes={attributes}",
    "variants={variants}",
    "defaultSelection={{ 颜色: 'red', 尺码: 's' }}",
  ],
  note: "数量依附于具体 SKU：未命中变体时步进器不渲染；切换变体后数量自动收敛到新上限内。",
  controls: [{ key: "initQty", label: "初始数量", kind: "number", init: 1, min: 1, max: 3 }],
  stageHeight: 280,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const initQty = Number(cfg.initQty);

  const Sku = useMemo(
    () =>
      createSkuSelector([
        createQuantityPlugin({ defaultValue: initQty, onChange: (q) => log(`数量 → ${q}`) }),
      ]),
    [initQty, log]
  );

  return (
    <div style={CARD}>
      <Sku
        key={initQty}
        attributes={ATTRIBUTES}
        variants={VARIANTS}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        点 + 到封顶，再换「蓝 S」：上限跳到库存 5，步进器跟随新变体重算。
      </p>
    </div>
  );
}
