import React, { useMemo } from "react";
import { createSkuSelector } from "vane-sku";
import { createSkuCodePlugin } from "vane-sku/custom-plugins/SkuCodePlugin";
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
 * 10 · 货号展示 SkuCode（插件功能）
 * 单装这一个：命中变体后用等宽字体展示货号，前缀文案可换。
 * 「一行字但每家都要」的长尾需求，做成插件而不是塞进 core。
 */
export const meta: DemoMeta = {
  slug: "sku-code",
  title: "货号展示 SkuCode",
  group: "plugin",
  plugin: "SkuCode",
  intro: "命中变体后用等宽字体展示货号；前缀文案可换（货号 / SKU / 商品编码）。",
  why: "客服对单、用户报修、订单核对都靠这串编码；「一行字但每家都要」的需求就该是插件。",
  plugs: [{ fn: "createSkuCodePlugin", cfg: "label: '{{label}}'", why: "命中后渲染货号行（等宽字体）" }],
  props: [
    "attributes={attributes}",
    "variants={variants}",
    "defaultSelection={{ 颜色: 'red', 尺码: 's' }}",
  ],
  note: "core 的「选中摘要」里本就含编码；本插件用于需要单独突出、便于复制核对编码的场景。",
  controls: [
    {
      key: "label",
      label: "前缀文案",
      kind: "select",
      init: "货号",
      options: [
        { label: "货号", value: "货号" },
        { label: "SKU", value: "SKU" },
        { label: "商品编码", value: "商品编码" },
      ],
    },
  ],
  stageHeight: 260,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const label = String(cfg.label);

  const Sku = useMemo(() => createSkuSelector([createSkuCodePlugin({ label })]), [label]);

  return (
    <div style={CARD}>
      <Sku
        attributes={ATTRIBUTES}
        variants={VARIANTS}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
        onChange={(_sel, v) => v && log(`命中 ${v.sku}`, "event")}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "#5b6064" }}>
        未选全时不占位——货号只在命中后出现，别让半选状态看到错误的编码。
      </p>
    </div>
  );
}
