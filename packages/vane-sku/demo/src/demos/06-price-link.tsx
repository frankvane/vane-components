import React, { useMemo } from "react";
import { createSkuSelector } from "vane-sku";
import { createPriceLinkPlugin } from "vane-sku/custom-plugins/PriceLinkPlugin";
import type { DemoMeta, DemoStageProps } from "./types";
import { ATTRIBUTES, VARIANTS, DISCOUNT_TEXTS } from "../data/sample";

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 2,
  padding: 14,
  color: "#1f2328",
  width: "100%",
};

/**
 * 06 · 价格联动 PriceLink（插件功能）
 * 单装这一个：命中变体后显示单价，原价更高时自动画删除线，
 * 折扣文案（促销角标）由控件现场换——拖 select = 改配置。
 */
export const meta: DemoMeta = {
  slug: "price-link",
  title: "价格联动 PriceLink",
  group: "plugin",
  plugin: "PriceLink",
  intro: "命中变体后显示单价；原价更高时自动画删除线，折扣文案可选（预选了 red/s：¥199 + 删除线 ¥299）。",
  why: "选完规格看价是决策临门一脚；把「准确价格」的渲染抽成插件，促销文案改配置就行、不用改页面。",
  plugs: [
    { fn: "createPriceLinkPlugin", cfg: "discountText: '{{discount}}'", why: "把命中变体的价格渲染进 overlay 段" },
  ],
  props: [
    "attributes={attributes}",
    "variants={variants}",
    "defaultSelection={{ 颜色: 'red', 尺码: 's' }}",
  ],
  note: "只有 originalPrice > price 才画删除线；变体没写 originalPrice 就只显示现价，不做假促销。",
  controls: [
    {
      key: "discount",
      label: "折扣文案",
      kind: "select",
      init: "限时8折",
      options: DISCOUNT_TEXTS,
      hint: "选「无（不传）」时插件不渲染角标",
    },
  ],
  stageHeight: 280,
};

export default function Stage({ cfg }: DemoStageProps) {
  const discount = String(cfg.discount);

  const Sku = useMemo(
    () => createSkuSelector([createPriceLinkPlugin({ discountText: discount || undefined })]),
    [discount]
  );

  return (
    <div style={CARD}>
      <Sku attributes={ATTRIBUTES} variants={VARIANTS} defaultSelection={{ 颜色: "red", 尺码: "s" }} />
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "#5b6064" }}>
        换「蓝 S」看看：blue-s 没写 originalPrice，就只有现价、没有删除线。
      </p>
    </div>
  );
}
