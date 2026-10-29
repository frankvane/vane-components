import React, { useMemo } from "react";
import { createSkuSelector } from "vane-sku";
import { createResetBarPlugin } from "vane-sku/custom-plugins/ResetBar";
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
 * 11 · 清空重选 ResetBar（插件功能）
 * 单装这一个：一键走 context.clearSelection() 整段重置，
 * 未选任何规格时按钮自动隐藏；onReset 回调接右栏日志。
 */
export const meta: DemoMeta = {
  slug: "reset-bar",
  title: "清空重选 ResetBar",
  group: "plugin",
  plugin: "ResetBar",
  intro: "选了一半想重来，一键清空：走 context.clearSelection()，未选任何规格时按钮自动隐藏。",
  why: "core 支持「再点同值取消」，但逐个取消很烦；移动端小屏上整体重置是高频操作。",
  plugs: [
    {
      fn: "createResetBarPlugin",
      cfg: "text: '{{text}}', onReset: () => track('reset')",
      why: "渲染清空按钮并整段重置选择",
    },
  ],
  props: ["attributes={attributes}", "variants={variants}", "onChange={handleChange}"],
  note: "依赖核心 context.clearSelection()（vane-sku 0.1.0 起提供）；onReset 在清空后触发，接埋点很顺手。",
  controls: [
    {
      key: "text",
      label: "按钮文案",
      kind: "select",
      init: "清空重选",
      options: [
        { label: "清空重选", value: "清空重选" },
        { label: "重新选择", value: "重新选择" },
        { label: "重置规格", value: "重置规格" },
      ],
    },
  ],
  stageHeight: 280,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const text = String(cfg.text);

  const Sku = useMemo(
    () =>
      createSkuSelector([
        createResetBarPlugin({
          text,
          onReset: () => log(`onReset · 选择已整段清空（按钮随空选择隐藏）`, "info"),
        }),
      ]),
    [text, log]
  );

  return (
    <div style={CARD}>
      <Sku
        attributes={ATTRIBUTES}
        variants={VARIANTS}
        onChange={(sel, v) =>
          log(
            v ? `命中 ${v.sku} · ${JSON.stringify(sel)}` : `未命中 · ${JSON.stringify(sel)}`,
            v ? "event" : "warn"
          )
        }
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        选两个规格 → 点「清空重选」：右栏记一次 onReset，按钮自己藏起来（没有选择可清了）。
      </p>
    </div>
  );
}
