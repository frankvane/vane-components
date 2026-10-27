/**
 * P3-C 验收页：4 个「拆分 / 重构」级插件 + 真实样本。
 *
 * 这一页要回答的是单测回答不了的事：
 *
 * 1. **`import("react-syntax-highlighter")` 与两条主题子路径**在 dev 下能不能解析
 *    （子路径 + 无 `exports` 字段的包 + 我们自己写的 `declare module`，只有跑起来才知道）。
 * 2. **Markdown 的 `allowHtml` 默认关**是不是真的关 —— 下面有一个人造样本
 *    `xss-demo.md`，里面写了 `<img onerror>`。默认模式下你能看到标签本身（被转义），
 *    打开开关后它才会真的执行。这是安全边界，必须肉眼确认。
 * 3. **CSV 的编码 / 分隔符识别**是不是真的生效 —— 样本里有逗号、分号、Tab 三种，
 *    还有一段 GBK 中文。
 * 4. **EPUB 的两级校验**：正常样本能翻页；`fake-book.epub` 是个普通 zip 改了后缀
 *    （魔数一模一样，靠魔数区分不了），必须落到「找不到 META-INF/container.xml」的
 *    明确报错上，而不是让 epub.js 内部抛一句 "Error loading book"。
 */
import { useState } from "react";
import {
  FilePreviewCore,
  resolvePreview,
  withPlugins,
  type FileInfo,
  type FilePreviewPlugin,
} from "vane-file-preview";
import { createCodePreviewPlugin } from "vane-file-preview/custom-plugins/CodePreviewPlugin";
import { createMarkdownPreviewPlugin } from "vane-file-preview/custom-plugins/MarkdownPreviewPlugin";
import { createCsvPreviewPlugin } from "vane-file-preview/custom-plugins/CsvPreviewPlugin";
import { createEpubPreviewPlugin } from "vane-file-preview/custom-plugins/EpubPreviewPlugin";
import { createDownloadPlugin } from "vane-file-preview/custom-plugins/DownloadPlugin";

interface Sample extends FileInfo {
  note: string;
  group: "code" | "table" | "book";
}

const sample = (
  group: Sample["group"],
  name: string,
  type: string,
  extension: string,
  size: number,
  note: string
): Sample => ({
  group,
  name,
  type,
  extension,
  size,
  url: `/samples/${name}`,
  note,
});

const FILES: Sample[] = [
  sample("code", "sample.js", "text/javascript", "js", 1208, "JS · 单行注释 / 字符串"),
  sample("code", "sample.ts", "text/typescript", "ts", 1368, "TS · 类型标注"),
  sample("code", "sample.tsx", "text/tsx", "tsx", 5471, "TSX · JSX + hooks"),
  sample("code", "sample.vue", "text/plain", "vue", 3302, "Vue SFC · 模板 + script + style"),
  sample("code", "sample.css", "text/css", "css", 1464, "CSS"),
  sample("code", "sample.html", "text/html", "html", 6373, "HTML"),
  sample("code", "sample.md", "text/markdown", "md", 195239, "Markdown · 190KB 真实文档"),
  sample("code", "xss-demo.md", "text/markdown", "md", 420, "⚠ HTML 注入样本（验证 allowHtml 默认关）"),
  sample("table", "sample-data.csv", "text/csv", "csv", 963, "CSV · 逗号分隔"),
  sample("table", "sample-data-semicolon.csv", "text/csv", "csv", 567, "CSV · 分号分隔（自动识别）"),
  sample("table", "sales-data.tsv", "text/tab-separated-values", "tsv", 984, "TSV · Tab 分隔"),
  sample("table", "gbk-data.csv", "text/csv", "csv", 0, "CSV · GBK 编码（检测并转码）"),
  sample("book", "sample.epub", "application/epub+zip", "epub", 188879, "EPUB · 翻页 + 目录"),
  sample(
    "book",
    "fake-book.epub",
    "application/epub+zip",
    "epub",
    97668,
    "普通 ZIP 改名成 .epub（魔数相同，缺 container.xml → 明确报错）"
  ),
];

const COMMON: FilePreviewPlugin[] = [
  createCodePreviewPlugin(),
  createCsvPreviewPlugin(),
  createEpubPreviewPlugin(),
  createDownloadPlugin(),
];

/** allowHtml 关 / 开两套装配 —— 切换时换组件，不重建插件数组 */
const SAFE_PLUGINS = [createMarkdownPreviewPlugin(), ...COMMON];
const HTML_PLUGINS = [createMarkdownPreviewPlugin({ allowHtml: true }), ...COMMON];

const PreviewSafe = withPlugins(FilePreviewCore, { plugins: SAFE_PLUGINS });
const PreviewHtml = withPlugins(FilePreviewCore, { plugins: HTML_PLUGINS });

const GROUP_LABEL: Record<Sample["group"], string> = {
  code: "代码与文档",
  table: "表格",
  book: "电子书",
};

export function CodeDemo() {
  const [index, setIndex] = useState(0);
  const [allowHtml, setAllowHtml] = useState(false);

  const file = FILES[index];
  const plugins = allowHtml ? HTML_PLUGINS : SAFE_PLUGINS;
  const winner = resolvePreview(plugins, file);
  const Preview = allowHtml ? PreviewHtml : PreviewSafe;

  return (
    <section style={{ display: "grid", gap: 12 }}>
      {(["code", "table", "book"] as const).map((group) => (
        <div key={group} style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#9aa0a6", letterSpacing: "0.04em" }}>
            {GROUP_LABEL[group]}
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FILES.map((f, i) =>
              f.group !== group ? null : (
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
              )
            )}
          </div>
        </div>
      ))}

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
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="checkbox"
            checked={allowHtml}
            onChange={(e) => setAllowHtml(e.target.checked)}
          />
          Markdown allowHtml
        </label>
        <span style={{ color: "#8a8a8a" }}>
          默认关闭：文件里的原始 HTML 被转义成文本。勾上后同样的文件会真的执行
          `onerror` —— 这就是为什么默认要关。
        </span>
      </div>

      <div
        data-card-stage
        style={{
          height: 560,
          border: "1px solid #e6e6e6",
          borderRadius: 10,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <Preview file={file} />
      </div>

      <p style={{ margin: 0, fontSize: 12, color: "#8a8a8a", lineHeight: 1.7 }}>
        当前：<code>{file.name}</code> · {file.type || "MIME 未知"} · {file.note}
        <br />
        渲染它的插件：
        <strong style={{ color: winner ? "#1f2329" : "#d1242f" }}>
          {winner ? ` ${winner.name}` : "（无 · unsupported 面板）"}
        </strong>
      </p>
    </section>
  );
}
