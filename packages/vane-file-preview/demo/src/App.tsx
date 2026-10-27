import { useState, type CSSProperties } from "react";
import { BasicDemo } from "./pages/BasicDemo";
import { DocumentsDemo } from "./pages/DocumentsDemo";

const shell: CSSProperties = {
  maxWidth: 880,
  margin: "0 auto",
  padding: "48px 24px 96px",
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  color: "#1f2329",
};

type Tab = "media" | "documents";

const TABS: Array<{ id: Tab; label: string; hint: string }> = [
  {
    id: "media",
    label: "A 批 · 轻量 6 个",
    hint: "Image / Pdf / Video / Audio / Office / Download，全部零重依赖",
  },
  {
    id: "documents",
    label: "B 批 · 文档与数据 7 个",
    hint: "Json / Xml / Xlsx / Pptx / Zip / Docx×2，重依赖走 dynamic import",
  },
];

export function App() {
  const [tab, setTab] = useState<Tab>("media");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <main style={shell}>
      <h1 style={{ fontSize: 24, margin: "0 0 6px", letterSpacing: "-0.01em" }}>
        vane-file-preview
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "#8a8a8a" }}>
        P3 已迁入 13 个插件，页面按子路径引入。样本是{" "}
        <code>demo/public/samples/</code> 里的真文件 —— data URL 骗得过图片，
        骗不过 PDF 查看器、视频解码器与 xlsx 解析器。
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: `1px solid ${tab === t.id ? "#1f2329" : "#d8d8d8"}`,
              background: tab === t.id ? "#1f2329" : "#fff",
              color: tab === t.id ? "#fff" : "#1f2329",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p style={{ margin: "0 0 20px", fontSize: 12, color: "#8a8a8a" }}>
        {active.hint}
      </p>

      {tab === "media" ? <BasicDemo /> : <DocumentsDemo />}
    </main>
  );
}
