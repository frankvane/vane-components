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
        P3-A · 前 6 个插件已迁入（Image / Pdf / Video / Audio / Office /
        Download），页面按子路径引入它们。样本是{" "}
        <code>demo/public/samples/</code> 里的真文件 —— data URL 骗得过图片，
        骗不过 PDF 查看器与视频解码器。
      </p>

      <BasicDemo />
    </main>
  );
}
