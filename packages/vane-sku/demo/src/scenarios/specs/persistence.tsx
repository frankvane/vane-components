import React from "react";
import { createSkuSelector } from "vane-sku";
import { createStatePersistencePlugin } from "vane-sku/custom-plugins/StatePersistence";
import { ATTRIBUTES, VARIANTS } from "../../data/sample";

// 11 状态持久化：StatePersistence 把选择写进 localStorage，挂载时读回。
// 点「重挂载（模拟刷新）」——组件销毁重建后仍停在上次选的规格；清空选择会自动删键。
const KEY = "vane-sku:demo:selection";
const Sku = createSkuSelector([createStatePersistencePlugin({ key: KEY })]);

export default function PersistenceScenario() {
  const [mountKey, setMountKey] = React.useState(0);
  const [stored, setStored] = React.useState("（空）");

  const read = React.useCallback(() => {
    setStored(window.localStorage.getItem(KEY) ?? "（空）");
  }, []);
  // 每次重挂载后读一次存储，展示「还原自 localStorage」
  React.useEffect(read, [read, mountKey]);

  return (
    <div style={{ display: "grid", gap: 10, width: "100%" }}>
      <div style={{ background: "#fff", borderRadius: 2, padding: 14, color: "#1f2328" }}>
        <Sku key={mountKey} attributes={ATTRIBUTES} variants={VARIANTS} onChange={read} />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          data-testid="scenario-remount"
          onClick={() => setMountKey((k) => k + 1)}
          style={{
            padding: "5px 12px",
            borderRadius: 2,
            background: "rgba(255,255,255,.06)",
            border: "1px solid var(--line, #2a2723)",
            color: "var(--text, #e8e2d9)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          重挂载（模拟刷新）
        </button>
        <code
          data-testid="scenario-stored"
          style={{
            padding: "5px 10px",
            borderRadius: 2,
            background: "var(--surface-2, #171513)",
            border: "1px solid var(--line, #2a2723)",
            color: "#ffb86b",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
          }}
        >
          localStorage[{JSON.stringify(KEY)}] = {stored}
        </code>
      </div>
    </div>
  );
}
