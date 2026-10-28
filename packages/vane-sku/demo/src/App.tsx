import React from "react";
import { BasicDemo } from "./pages/BasicDemo";
import { Workshop } from "./pages/Workshop";
import { Scenarios } from "./pages/Scenarios";

const TABS = [
  { key: "basic", label: "快速上手", node: <BasicDemo /> },
  { key: "workshop", label: "工坊（含几何体检）", node: <Workshop /> },
  { key: "scenarios", label: "场景集", node: <Scenarios /> },
] as const;

export function App() {
  const [tab, setTab] = React.useState<string>("basic");

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 1180, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>vane-sku · 规格选择引擎</h1>
      <p style={{ color: "#6b7280", fontSize: 13, marginTop: 0 }}>
        组合矩阵 + 禁用推导为内核，价格联动 / 限购校验 / 规格切主图为按需插件
      </p>

      <nav style={{ display: "flex", gap: 8, margin: "14px 0 18px" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            data-testid={`tab-${t.key}`}
            onClick={() => setTab(t.key)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: tab === t.key ? "2px solid #2b7de9" : "1px solid #d0d4da",
              background: tab === t.key ? "#e8f0fe" : "#fff",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div data-testid="app-body">{TABS.find((t) => t.key === tab)?.node}</div>
    </div>
  );
}
