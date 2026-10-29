import React, { useMemo } from "react";
import { createSkuSelector } from "vane-sku";
import { createQuotaPlugin } from "vane-sku/custom-plugins/QuotaPlugin";
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
 * 08 · 限购校验 Quota（插件功能）
 * 单装这一个：red-s 声明 quota: 2。拖「已购件数」滑条：
 * 0/1 → 绿条「每人限购 2 件」；2 → 翻红「已达限购上限」，canPurchase 置 false。
 */
export const meta: DemoMeta = {
  slug: "quota",
  title: "限购校验 Quota",
  group: "plugin",
  plugin: "Quota",
  intro: "red-s 每人限购 2：拖「已购件数」到 2，提示条翻红「已达限购上限」，canPurchase 置 false。",
  why: "限量 / 秒杀要在点加购前就拦住；把「还能不能买」写进内核 state，加购按钮直接读、不用自己算。",
  plugs: [
    {
      fn: "createQuotaPlugin",
      cfg: "purchasedCount: {{purchased}}, onExceed: () => track('quota-exceed')",
      why: "渲染限购提示条并暴露 canPurchase 门控",
    },
  ],
  props: [
    "attributes={attributes}",
    "variants={variants}",
    "defaultSelection={{ 颜色: 'red', 尺码: 's' }}",
  ],
  note: "canPurchase 只在 onMount / onSkuChange 事件钩子里写入，不在渲染期 setState——避免渲染期改状态的循环告警。",
  controls: [{ key: "purchased", label: "已购件数", kind: "number", init: 1, min: 0, max: 2 }],
  stageHeight: 280,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const purchased = Number(cfg.purchased);

  const Sku = useMemo(
    () =>
      createSkuSelector([
        createQuotaPlugin({
          purchasedCount: purchased,
          onExceed: () => log(`已购 ${purchased} ≥ 限购 2：canPurchase = false`, "warn"),
        }),
      ]),
    [purchased, log]
  );

  return (
    <div style={CARD}>
      <Sku
        attributes={ATTRIBUTES}
        variants={VARIANTS}
        defaultSelection={{ 颜色: "red", 尺码: "s" }}
        onChange={(_sel, v) => v && log(`命中 ${v.sku} · quota ${v.quota ?? "（不限购）"}`, "event")}
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        只读 red-s（唯一声明 quota 的变体）：换到其它变体时限购条消失——未声明 quota 视为不限购。
      </p>
    </div>
  );
}
