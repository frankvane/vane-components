import React from "react";
import { createSkuSelector } from "vane-sku";
import { createUrlSyncPlugin } from "vane-sku/custom-plugins/UrlSync";
import { ATTRIBUTES, VARIANTS } from "../../data/sample";

// 10 URL 同步：UrlSync 把选择写进查询串（?sku_颜色=red&sku_尺码=s）。
// 「把这个链接发给客服，他看到的就是我选的规格」——刷新 / 分享都能还原，清空时自动删参。
const Sku = createSkuSelector([createUrlSyncPlugin()]);

export default function UrlSyncScenario() {
  const [q, setQ] = React.useState(() => window.location.search || "（空）");

  return (
    <div style={{ display: "grid", gap: 10, width: "100%" }}>
      <div style={{ background: "#fff", borderRadius: 2, padding: 14, color: "#1f2328" }}>
        <Sku
          attributes={ATTRIBUTES}
          variants={VARIANTS}
          onChange={() => setQ(window.location.search || "（已清空）")}
        />
      </div>
      <code
        data-testid="scenario-url"
        style={{
          display: "block",
          padding: "8px 10px",
          borderRadius: 2,
          background: "var(--surface-2, #171513)",
          border: "1px solid var(--line, #2a2723)",
          color: "#ffb86b",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {q}
      </code>
      <p style={{ fontSize: 11, color: "var(--text-3, #8a857c)", margin: 0 }}>
        上方是实时查询串：选规格后出现 sku_ 前缀参数，复制地址栏链接打开即还原。
      </p>
    </div>
  );
}
