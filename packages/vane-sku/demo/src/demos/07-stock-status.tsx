import React, { useMemo } from "react";
import { createSkuSelector } from "vane-sku";
import { createStockStatusPlugin } from "vane-sku/custom-plugins/StockStatus";
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
 * 07 · 库存状态 StockStatus（插件功能）
 * 单装这一个：命中变体后显示三态（现货 / 仅剩 N 件 / 缺货），
 * 阈值拖滑条实时变。这里故意传 ignoreOutOfStock={false}，
 * 让 stock=0 的 green-l 可点，才能看到「缺货」红条。
 */
export const meta: DemoMeta = {
  slug: "stock-status",
  title: "库存状态 StockStatus",
  group: "plugin",
  plugin: "StockStatus",
  intro: "命中变体后显示三态：现货 / 仅剩 N 件 / 缺货；低库存阈值拖滑条实时生效。",
  why: "「仅剩 3 件」是转化利器；阈值该由运营配，而不是写死在代码里等发版。",
  plugs: [
    { fn: "createStockStatusPlugin", cfg: "lowStockThreshold: {{threshold}}", why: "渲染库存三态提示条" },
  ],
  props: [
    "attributes={attributes}",
    "variants={variants}",
    "ignoreOutOfStock={false}",
    "defaultSelection={{ 颜色: 'red', 尺码: 's' }}",
    "onChange={handleChange}",
  ],
  note: "变体没声明 stock 时不渲染——不做无依据的库存承诺；这页传 ignoreOutOfStock={false} 是为了能点到 stock=0 的 green-l 看「缺货」态。",
  controls: [{ key: "threshold", label: "低库存阈值", kind: "number", init: 5, min: 1, max: 10 }],
  stageHeight: 280,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const threshold = Number(cfg.threshold);

  const Sku = useMemo(
    () => createSkuSelector([createStockStatusPlugin({ lowStockThreshold: threshold })]),
    [threshold]
  );

  return (
    <div style={CARD}>
      <Sku
        attributes={ATTRIBUTES}
        variants={VARIANTS}
        ignoreOutOfStock={false}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
        onChange={(_sel, v) => v && log(`命中 ${v.sku} · 库存 ${v.stock ?? "—"}`, "event")}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        red/s 库存 5：阈值 ≥5 显「仅剩 5 件」，拖到 1 变「现货」；点「绿 L」看缺货红条。
      </p>
    </div>
  );
}
