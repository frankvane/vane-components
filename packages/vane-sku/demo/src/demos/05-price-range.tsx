import React, { useMemo } from "react";
import { createSkuSelector } from "vane-sku";
import { createPriceRangePlugin } from "vane-sku/custom-plugins/PriceRangePlugin";
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
 * 05 · 价格区间 PriceRange（插件功能）
 * 单装这一个：未选全（或组合无货）时按当前选择过滤变体取 min/max，
 * 显示「¥199–¥269」这样的区间，区间随选择收窄；命中变体后退场。
 */
export const meta: DemoMeta = {
  slug: "price-range",
  title: "价格区间 PriceRange",
  group: "plugin",
  plugin: "PriceRange",
  intro: "未选全时按当前选择过滤变体取 min/max，显示 ¥199–¥269 这样的区间；区间随选择收窄。",
  why: "价格区不能空窗：PriceLink 只在命中后出单价，用户选一半时最想看的是「这东西大概多少钱」。",
  plugs: [
    { fn: "createPriceRangePlugin", cfg: "showWhenMatched: {{keep}}", why: "负责未命中时的价格区间展示" },
  ],
  props: ["attributes={attributes}", "variants={variants}"],
  note: "与 PriceLink 同走 renderOverlay，靠 order（PriceRange=5）排在前；命中后自动返回 null，两者同装不重影。",
  controls: [{ key: "keep", label: "命中后仍显区间", kind: "switch", init: false }],
  stageHeight: 280,
};

export default function Stage({ cfg }: DemoStageProps) {
  const keep = Boolean(cfg.keep);

  const Sku = useMemo(
    () => createSkuSelector([createPriceRangePlugin({ showWhenMatched: keep })]),
    [keep]
  );

  return (
    <div style={CARD}>
      <Sku attributes={ATTRIBUTES} variants={VARIANTS} />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        先只选「颜色」：区间立刻收窄到该色的 min–max；选全后区间退场（打开开关则保留）。
      </p>
    </div>
  );
}
