import React, { useMemo } from "react";
import { createSkuSelector } from "vane-sku";
import { createPriceRangePlugin } from "vane-sku/custom-plugins/PriceRangePlugin";
import { createPriceLinkPlugin } from "vane-sku/custom-plugins/PriceLinkPlugin";
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
 * 00 · 最小可用选择器（基础功能）
 * 裸 Core 起步：只有按钮组 + 禁用推导 + 选中摘要。两个开关按需叠价格区间 / 价格联动，
 * 组件类型随开关在 useMemo 里增删插件重建 —— 5 行装配出能用的选择器。
 */
export const meta: DemoMeta = {
  slug: "quickstart",
  title: "最小可用选择器",
  group: "basic",
  capability: "core-assembly",
  intro: "5 行装配出能用的选择器：Core（按钮组 + 禁用推导 + 摘要）起步，按需叠价格插件。",
  why: "先跑通内核，再增量叠插件——规格选择的长尾需求多，全塞进内核只会越来越难改。",
  plugs: [
    { fn: "createPriceRangePlugin", why: "未选全时兜底显示价格区间，价格区不空窗" },
    { fn: "createPriceLinkPlugin", cfg: "discountText: '限时8折'", why: "命中变体后显示单价与原价删除线" },
  ],
  props: ["attributes={attributes}", "variants={variants}"],
  controls: [
    { key: "withRange", label: "加价格区间", kind: "switch", init: false },
    { key: "withLink", label: "加价格联动", kind: "switch", init: false },
  ],
  stageHeight: 300,
};

export default function Stage({ cfg }: DemoStageProps) {
  const withRange = Boolean(cfg.withRange);
  const withLink = Boolean(cfg.withLink);

  // 组件类型随开关增删插件重建：拖控件 = 换装配（选择态随之重置，符合「换配置重头选」直觉）
  const Sku = useMemo(
    () =>
      createSkuSelector([
        ...(withRange ? [createPriceRangePlugin()] : []),
        ...(withLink ? [createPriceLinkPlugin({ discountText: "限时8折" })] : []),
      ]),
    [withRange, withLink]
  );

  return (
    <div style={CARD}>
      <Sku attributes={ATTRIBUTES} variants={VARIANTS} />
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "#5b6064" }}>
        两个开关都关就是裸 Core：选「蓝」后 L 置灰，摘要告诉你命中的变体。
      </p>
    </div>
  );
}
