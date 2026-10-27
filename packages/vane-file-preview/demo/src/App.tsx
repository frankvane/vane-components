import type { CSSProperties } from "react";
import { BasicDemo } from "./pages/BasicDemo";

const shell: CSSProperties = {
  maxWidth: 880,
  margin: "0 auto",
  padding: "48px 24px 96px",
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  color: "#1f2329",
};

export function App() {
  return (
    <main style={shell}>
      <h1 style={{ fontSize: 24, margin: "0 0 6px", letterSpacing: "-0.01em" }}>
        vane-file-preview
      </h1>
      <p style={{ margin: "0 0 28px", fontSize: 13, color: "#8a8a8a" }}>
        P2 · 装配器换成 <code>@vane/plugin-core</code>，路由抽成纯函数
        <code>resolvePreview()</code>。页面 import 的是包名，vite 把它 alias 到{" "}
        <code>src/</code>，删掉 <code>dist/</code> 也能构建。
      </p>

      <BasicDemo />
    </main>
  );
}
