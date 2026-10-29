import React from "react";
import { createSkuSelector } from "vane-sku";
import { createAnalyticsPlugin } from "vane-sku/custom-plugins/Analytics";
import type { AnalyticsEvent } from "vane-sku/custom-plugins/Analytics";
import { ATTRIBUTES, VARIANTS } from "../../data/sample";

// 09 埋点上报：Analytics 双通道出口（onEvent 回调 + sku:analytics 总线），这里用回调画事件流水。
// 工厂在模块级创建（钩子要读闭包）；事件出口指向可替换的 handler，让每个实例有自己的日志。
let pushEvent: ((e: AnalyticsEvent) => void) | null = null;
const Sku = createSkuSelector([createAnalyticsPlugin({ onEvent: (e) => pushEvent?.(e) })]);

const EVENT_LABEL: Record<AnalyticsEvent["name"], string> = {
  "sku:mount": "挂载",
  "sku:change": "命中",
  "sku:invalid": "未命中",
};
const EVENT_COLOR: Record<AnalyticsEvent["name"], string> = {
  "sku:mount": "#6b7280",
  "sku:change": "#16a34a",
  "sku:invalid": "#dc2626",
};

export default function AnalyticsScenario() {
  const [log, setLog] = React.useState<AnalyticsEvent[]>([]);
  // 渲染期装配 handler（幂等赋值）：保证挂载瞬间发出的 sku:mount 也能被接住
  pushEvent = (e) => setLog((prev) => [e, ...prev].slice(0, 6));

  return (
    <div style={{ display: "grid", gap: 10, width: "100%" }}>
      <div style={{ background: "#fff", borderRadius: 2, padding: 14, color: "#1f2328" }}>
        <Sku attributes={ATTRIBUTES} variants={VARIANTS} />
      </div>
      <div
        data-testid="scenario-analytics-log"
        style={{
          display: "grid",
          gap: 4,
          padding: "8px 10px",
          borderRadius: 2,
          background: "var(--surface-2, #171513)",
          border: "1px solid var(--line, #2a2723)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          minHeight: 32,
        }}
      >
        {log.length === 0 ? (
          <span style={{ color: "var(--text-3, #8a857c)" }}>等待事件…（点规格按钮试试）</span>
        ) : (
          log.map((e, i) => (
            <div key={`${e.at}-${i}`} style={{ display: "flex", gap: 8 }}>
              <span style={{ color: EVENT_COLOR[e.name] }}>{EVENT_LABEL[e.name]}</span>
              <span style={{ color: "var(--text-2, #b5afa4)" }}>
                {JSON.stringify(e.selection)}
                {e.variant ? ` → ${e.variant.sku}` : ""}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
