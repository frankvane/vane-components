/**
 * P3-B 验收页：7 个「带 optional peer」的插件 + 真实样本。
 *
 * 这一页要回答的三件事，单测回答不了：
 *
 * 1. **依赖真的能从 CDN/本地 node_modules 动态加载出来吗** ——
 *    `import("jszip")` 在 dev 下的解析路径、`import("mammoth/mammoth.browser")`
 *    这种子路径，只有跑起来才知道。
 * 2. **docx 的两种模式是不是真的换了渲染器** —— mammoth 给语义 HTML，
 *    docx-preview 给带版式的分页 DOM，肉眼一眼能分出来；看「渲染它的插件」那行也行。
 * 3. **Xlsx 的 Sheet 页签是不是真的能点** —— 迁移前它写死「Sheet: 1」。
 *
 * 装配写在模块顶层（迁移前 13 个示例页里 11 个写在函数体内，每次渲染重建整棵子树）。
 * docxMode 两套装配各自预生成一个组件，切换时换组件而不是换数组。
 */
import { useState } from "react";
import {
  FilePreviewCore,
  resolvePreview,
  withPlugins,
  type FileInfo,
  type FilePreviewPlugin,
} from "vane-file-preview";
import { createZipPreviewPlugin } from "vane-file-preview/custom-plugins/ZipPreviewPlugin";
import { createJsonPreviewPlugin } from "vane-file-preview/custom-plugins/JsonPreviewPlugin";
import { createXmlPreviewPlugin } from "vane-file-preview/custom-plugins/XmlPreviewPlugin";
import { createXlsxPreviewPlugin } from "vane-file-preview/custom-plugins/XlsxPreviewPlugin";
import { createPptxPreviewPlugin } from "vane-file-preview/custom-plugins/PptxPreviewPlugin";
import { createDocxPreviewPlugin } from "vane-file-preview/custom-plugins/DocxPreviewPlugin";
import { createMammothDocxPlugin } from "vane-file-preview/custom-plugins/MammothDocxPlugin";
import { createDownloadPlugin } from "vane-file-preview/custom-plugins/DownloadPlugin";

interface Sample extends FileInfo {
  note: string;
  /** 这一项要不要跟 docxMode 走 */
  usesDocxMode?: boolean;
}

const sample = (
  name: string,
  type: string,
  extension: string,
  size: number,
  note: string,
  usesDocxMode = false
): Sample => ({
  name,
  type,
  extension,
  size,
  url: `/samples/${name}`,
  note,
  usesDocxMode,
});

const FILES: Sample[] = [
  sample("sample.json", "application/json", "json", 1605, "JSON · 折叠 / 搜索 / 导出"),
  sample(
    "package.json",
    "application/json",
    "json",
    870,
    "package.json · 真实嵌套结构（scripts / deps 多层）"
  ),
  sample("sample.xml", "text/xml", "xml", 1033, "XML · 可折叠 + 行号"),
  sample("sample.rss", "application/rss+xml", "rss", 911, "RSS · 同 XML 插件"),
  sample(
    "sample.xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "xlsx",
    13060,
    "XLSX · 多个 Sheet 页签可点"
  ),
  sample(
    "sample.pptx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "pptx",
    2090655,
    "PPTX · 只有文本大纲，没有版式"
  ),
  sample(
    "sample.docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "docx",
    20817,
    "DOCX · 切换下面两个模式看差别",
    true
  ),
  sample("sample.zip", "application/zip", "zip", 97668, "ZIP · 条目列表"),
  sample("mystery.dat", "application/x-unknown", "dat", 0, "未知格式 · 落到兜底下载"),
];

const COMMON: FilePreviewPlugin[] = [
  createJsonPreviewPlugin(),
  createXmlPreviewPlugin(),
  createXlsxPreviewPlugin(),
  createPptxPreviewPlugin(),
  createZipPreviewPlugin(),
  createDownloadPlugin(),
];

const WITH_MAMMOTH = [createMammothDocxPlugin(), ...COMMON];
const WITH_DOCX_PREVIEW = [createDocxPreviewPlugin(), ...COMMON];

const PreviewMammoth = withPlugins(FilePreviewCore, { plugins: WITH_MAMMOTH });
const PreviewDocxPreview = withPlugins(FilePreviewCore, {
  plugins: WITH_DOCX_PREVIEW,
});

type DocxMode = "mammoth" | "docx-preview";

export function DocumentsDemo() {
  const [index, setIndex] = useState(0);
  const [docxMode, setDocxMode] = useState<DocxMode>("mammoth");

  const base = FILES[index];
  const file: Sample =
    base.usesDocxMode && base.extension === "docx"
      ? { ...base, docxMode }
      : base;

  const plugins = docxMode === "mammoth" ? WITH_MAMMOTH : WITH_DOCX_PREVIEW;
  const winner = resolvePreview(plugins, file);
  const Preview = docxMode === "mammoth" ? PreviewMammoth : PreviewDocxPreview;

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {FILES.map((f, i) => (
          <button
            key={f.name}
            onClick={() => setIndex(i)}
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              border: `1px solid ${i === index ? "#1f2329" : "#d8d8d8"}`,
              background: i === index ? "#1f2329" : "#fff",
              color: i === index ? "#fff" : "#1f2329",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 12,
          color: "#57606a",
          flexWrap: "wrap",
        }}
      >
        <span>DOCX 模式：</span>
        {(["mammoth", "docx-preview"] as DocxMode[]).map((mode) => (
          <label key={mode} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input
              type="radio"
              name="docx-mode"
              checked={docxMode === mode}
              onChange={() => setDocxMode(mode)}
            />
            {mode}
          </label>
        ))}
        <span style={{ color: "#8a8a8a" }}>
          （只影响 .docx；mammoth = 语义 HTML，docx-preview = 还原版式与分页）
        </span>
      </div>

      <div
        data-card-stage
        style={{
          height: 520,
          border: "1px solid #e6e6e6",
          borderRadius: 10,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <Preview file={file} />
      </div>

      <p style={{ margin: 0, fontSize: 12, color: "#8a8a8a", lineHeight: 1.7 }}>
        当前：<code>{file.name}</code> · {file.type || "MIME 未知"} · {base.note}
        <br />
        渲染它的插件：
        <strong style={{ color: winner ? "#1f2329" : "#d1242f" }}>
          {winner ? ` ${winner.name}` : "（无 · unsupported 面板）"}
        </strong>
      </p>
    </section>
  );
}
