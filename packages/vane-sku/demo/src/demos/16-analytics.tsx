import React, { useMemo } from "react";
import { createSkuSelector } from "vane-sku";
import { createAnalyticsPlugin } from "vane-sku/custom-plugins/AnalyticsPlugin";
import type { AnalyticsEvent } from "vane-sku/custom-plugins/AnalyticsPlugin";
import type { DemoMeta, DemoStageProps } from "./types";
import { ATTRIBUTES, VARIANTS } from "../data/sample";

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 2,
  padding: 14,
  color: "#1f2328",
  width: "100%",
};

const EVENT_LABEL: Record<AnalyticsEvent["name"], string> = {
  "sku:mount": "挂载",
  "sku:change": "命中",
  "sku:invalid": "未命中",
};

/**
 * 16 · 埋点上报 Analytics（插件功能）
 * 事件型插件：三类事件（挂载 / 命中 / 未命中）双通道出口——
 * onEvent 回调 + sku:analytics 总线，不渲染任何 UI。这里把 onEvent
 * 接到右栏日志：右栏的每一行就是一次真实上报。
 */
export const meta: DemoMeta = {
  slug: "analytics",
  title: "埋点上报 Analytics",
  group: "plugin",
  plugin: "Analytics",
  intro: "三类事件（挂载 / 命中 / 未命中）双通道出口：onEvent 回调 + sku:analytics 总线。右栏日志就是上报流水。",
  why: "规格选择是转化漏斗的关键一步；「哪些组合被点了、哪些根本选不出来」对选品和补库存都是硬数据。",
  plugs: [
    {
      fn: "createAnalyticsPlugin",
      cfg: "onlyMatched: {{onlyMatched}}, onEvent: (e) => track(e)",
      why: "只做事件出口，不渲染任何 UI；接哪家 SDK 由宿主决定",
    },
  ],
  props: ["attributes={attributes}", "variants={variants}"],
  note: "默认未命中也上报——「用户点得到却选不出」的坏组合恰恰最该被发现。",
  controls: [{ key: "onlyMatched", label: "只上报命中", kind: "switch", init: false, nonLayout: true }],
  stageHeight: 280,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const onlyMatched = Boolean(cfg.onlyMatched);

  const Sku = useMemo(
    () =>
      createSkuSelector([
        createAnalyticsPlugin({
          onlyMatched,
          onEvent: (e) =>
            log(
              `${EVENT_LABEL[e.name]} · ${JSON.stringify(e.selection)}${e.variant ? ` → ${e.variant.sku}` : ""}`,
              e.name === "sku:invalid" ? "warn" : e.name === "sku:mount" ? "info" : "event"
            ),
        }),
      ]),
    [onlyMatched, log]
  );

  return (
    <div style={CARD}>
      <Sku attributes={ATTRIBUTES} variants={VARIANTS} />
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "#5b6064" }}>
        只选颜色（未选全）记「未命中」，选全记「命中」，进页面记「挂载」——三种事件都会进右栏。
      </p>
    </div>
  );
}
