/**
 * **17 × N 路由矩阵** —— 全部插件都在场时的赢家。
 *
 * 前面 A/B/C 三批各自只测自己那 6/7/4 个插件，所以「跨批次的抢文件」一直没人验：
 * `.csv` 同时被 Code(4) 与 Csv(8) 认领、`.md` 被 Code(4) 与 Markdown(9) 认领、
 * `.docx` 被 Office(7) / Mammoth(8) / DocxPreview(8) 三方认领。
 * 单批测试里这些对手根本不在数组里，测出来的绿是假绿。
 *
 * 两条判据：
 *
 * 1. **每个真实文件恰好一个赢家，且是预期的那个。**
 * 2. **顺序无关**：把插件数组整个反转，赢家不能变。
 *    这条专门抓「priority 平手 → 靠声明顺序」—— 迁移前 `.docx` 就踩过一次
 *    （把 Office 挪到数组第一位，赢家就换了渲染器），而那时没有任何测试会红。
 */

import { describe, expect, it } from "vitest";

import { createAllPlugins, PLUGIN_FACTORIES } from "../src/custom-plugins";
import { resolvePreview } from "../src/components/FilePreviewPlugin/plugins/resolve";
import type { FileInfo } from "../src/components/FilePreviewPlugin/plugins/types";

const PLUGINS = createAllPlugins();
const REVERSED = [...PLUGINS].reverse();

const cases: Array<[name: string, type: string, extension: string, winner: string | null]> = [
  // ---- media ----
  ["a.png", "image/png", "png", "ImagePreviewPlugin"],
  ["a.jpg", "image/jpeg", "jpg", "ImagePreviewPlugin"],
  ["a.webp", "image/webp", "webp", "ImagePreviewPlugin"],
  ["a.svg", "image/svg+xml", "svg", "ImagePreviewPlugin"],
  ["a.mp4", "video/mp4", "mp4", "VideoPreviewPlugin"],
  ["a.webm", "video/webm", "webm", "VideoPreviewPlugin"],
  ["a.mp3", "audio/mpeg", "mp3", "AudioPreviewPlugin"],
  // .ogg 是容器：MIME 说音频就该给音频插件（P3-A 的 matchStrength 修复）
  ["a.ogg", "audio/ogg", "ogg", "AudioPreviewPlugin"],
  ["a.ogv", "video/ogg", "ogv", "VideoPreviewPlugin"],
  // ---- document ----
  ["a.pdf", "application/pdf", "pdf", "PdfPreviewPlugin"],
  ["a.dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template", "dotx", "OfficePreviewPlugin"],
  ["a.docm", "application/vnd.ms-word.document.macroenabled.12", "docm", "OfficePreviewPlugin"],
  // docx 默认走 mammoth；多一个 docxMode 用例在下面的专用测试里
  ["a.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx", "MammothDocxPlugin"],
  ["a.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx", "XlsxPreviewPlugin"],
  ["a.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx", "PptxPreviewPlugin"],
  ["a.epub", "application/epub+zip", "epub", "EpubPreviewPlugin"],
  ["a.md", "text/markdown", "md", "MarkdownPreviewPlugin"],
  // ---- data ----
  ["a.json", "application/json", "json", "JsonPreviewPlugin"],
  ["a.xml", "text/xml", "xml", "XmlPreviewPlugin"],
  ["a.rss", "application/rss+xml", "rss", "XmlPreviewPlugin"],
  ["a.csv", "text/csv", "csv", "CsvPreviewPlugin"],
  ["a.tsv", "text/tab-separated-values", "tsv", "CsvPreviewPlugin"],
  // ---- archive ----
  ["a.zip", "application/zip", "zip", "ZipPreviewPlugin"],
  // ---- other ----
  ["a.ts", "text/typescript", "ts", "CodePreviewPlugin"],
  ["a.tsx", "text/tsx", "tsx", "CodePreviewPlugin"],
  ["a.vue", "text/plain", "vue", "CodePreviewPlugin"],
  ["a.html", "text/html", "html", "CodePreviewPlugin"],
  ["a.yaml", "text/yaml", "yaml", "CodePreviewPlugin"],
  ["README.txt", "text/plain", "txt", "CodePreviewPlugin"],
  ["Dockerfile", "", "dockerfile", "CodePreviewPlugin"],
  // 谁都不认 → 兜底下载（DownloadPlugin priority -1）
  ["mystery.dat", "application/x-unknown", "dat", "DownloadPlugin"],
  ["a.rar", "application/x-rar-compressed", "rar", "DownloadPlugin"],
];

const info = (name: string, type: string, extension: string): FileInfo => ({
  name,
  type,
  extension,
  size: 1024,
  url: `blob:${name}`,
});

describe("路由矩阵 · 17 个插件全在场", () => {
  it("矩阵覆盖全部 17 个插件（DocxPreviewPlugin 由 docxMode 用例覆盖）", () => {
    expect(Object.keys(PLUGIN_FACTORIES)).toHaveLength(17);
    const covered = new Set(cases.map(([, , , winner]) => winner));
    // 静态表里缺 DocxPreviewPlugin（它只能靠 file.docxMode 命中），所以是 16
    expect(covered.size).toBe(16);
    expect(covered.has("DocxPreviewPlugin")).toBe(false);
  });

  it.each(cases)("%s → %s", (name, type, extension, winner) => {
    const file = info(name, type, extension);
    expect(resolvePreview(PLUGINS, file)?.name ?? null).toBe(winner);
  });

  it.each(cases)("%s 的赢家与插件声明顺序无关", (name, type, extension, winner) => {
    const file = info(name, type, extension);
    expect(
      resolvePreview(REVERSED, file)?.name ?? null,
      `${name} 在数组反转后换了赢家 —— 说明存在 priority 平手，赢家由声明顺序决定`
    ).toBe(winner);
  });

  it("docx 的赢家由 docxMode 决定，两种模式都顺序无关", () => {
    const docxType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const mammoth = info("a.docx", docxType, "docx");
    const preview = { ...mammoth, docxMode: "docx-preview" as const };

    expect(resolvePreview(PLUGINS, mammoth)?.name).toBe("MammothDocxPlugin");
    expect(resolvePreview(REVERSED, mammoth)?.name).toBe("MammothDocxPlugin");
    expect(resolvePreview(PLUGINS, preview)?.name).toBe("DocxPreviewPlugin");
    expect(resolvePreview(REVERSED, preview)?.name).toBe("DocxPreviewPlugin");
  });

  it("关掉赢家后落到兜底下载；连兜底也关掉才是真的 unsupported", () => {
    const md = info("a.md", "text/markdown", "md");
    const withoutMarkdown = PLUGINS.map((p) =>
      p.name === "MarkdownPreviewPlugin" ? { ...p, enabled: false } : p
    );
    // Code 不声明 .md（见 P3-C），于是只剩兜底
    expect(resolvePreview(withoutMarkdown, md)?.name).toBe("DownloadPlugin");

    const noFallback = withoutMarkdown.filter((p) => p.name !== "DownloadPlugin");
    expect(resolvePreview(noFallback, md)).toBeNull();
  });
});
