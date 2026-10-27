/**
 * P3 · A 批插件的渲染冒烟（真插件 → 真装配器 → 真 Core）
 *
 * 为什么光有 `plugins-a.test.ts` 不够：那里只验声明（name / priority / doc.json），
 * 拿不到「render 钩子真的能跑」。而且这一类插件最容易踩的坑是**在 render 里写 hooks**
 * （迁移前 `DownloadPlugin` 就是：`render` 里直接 `React.useEffect`），
 * 声明完全正确、路由完全正确，一渲染就炸或者换文件就炸。
 *
 * 所以这里每个插件都真渲染一次，并且专门测「赢家从 Download 换成别的插件」——
 * 那是 hook 数量变化的路径，也是那条 bug 的现场。
 */
import { describe, expect, it } from "vitest";

import { createImagePreviewPlugin } from "../src/custom-plugins/ImagePreviewPlugin";
import { createPdfPreviewPlugin } from "../src/custom-plugins/PdfPreviewPlugin";
import { createVideoPreviewPlugin } from "../src/custom-plugins/VideoPreviewPlugin";
import { createAudioPreviewPlugin } from "../src/custom-plugins/AudioPreviewPlugin";
import { createDownloadPlugin } from "../src/custom-plugins/DownloadPlugin";
import { createOfficePreviewPlugin } from "../src/custom-plugins/OfficePreviewPlugin";
import { flush, renderPreview } from "./helpers";
import type { FileInfo } from "../src/components/FilePreviewPlugin/plugins/types";

const file = (over: Partial<FileInfo> = {}): FileInfo => ({
  name: "a.bin",
  size: 2048,
  type: "",
  extension: "bin",
  url: "blob:a",
  ...over,
});

const IMAGE = file({ name: "cat.png", type: "image/png", extension: "png" });
const PDF = file({ name: "doc.pdf", type: "application/pdf", extension: "pdf" });
const VIDEO = file({ name: "clip.mp4", type: "video/mp4", extension: "mp4" });
const AUDIO = file({ name: "song.mp3", type: "audio/mpeg", extension: "mp3" });
const OFFICE = file({
  name: "report.docx",
  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  extension: "docx",
});
const UNKNOWN = file({ name: "x.xyz", type: "application/x-nonsense", extension: "xyz" });

describe("A 批插件 · 渲染冒烟", () => {
  it("Image：渲染出 <img>，工具栏显示缩放百分比", async () => {
    const h = renderPreview([createImagePreviewPlugin()], { file: IMAGE });
    await flush();
    expect(h.container.querySelector("img")).not.toBeNull();
    expect(h.container.querySelector("[data-vfp-toolbar]")?.textContent).toContain("100%");
    h.unmount();
  });

  it("Pdf：渲染出 iframe，src 指向文件 URL", async () => {
    const h = renderPreview([createPdfPreviewPlugin()], { file: PDF });
    await flush();
    const frame = h.container.querySelector("iframe");
    expect(frame?.getAttribute("src")).toBe(PDF.url);
    h.unmount();
  });

  it("Pdf：enableToolbar=false 时 URL 追加查看器参数", async () => {
    const h = renderPreview([createPdfPreviewPlugin({ enableToolbar: false })], {
      file: PDF,
    });
    await flush();
    const src = h.container.querySelector("iframe")?.getAttribute("src") ?? "";
    expect(src).toContain("#toolbar=0");
    h.unmount();
  });

  it("Video：渲染出 <video>，工具栏给出格式标签", async () => {
    const h = renderPreview([createVideoPreviewPlugin()], { file: VIDEO });
    await flush();
    expect(h.container.querySelector("video")).not.toBeNull();
    expect(h.container.querySelector("[data-vfp-toolbar]")?.textContent).toContain(
      "MP4 Video"
    );
    h.unmount();
  });

  it("Audio：渲染出 <audio> 且显示文件名", async () => {
    const h = renderPreview([createAudioPreviewPlugin()], { file: AUDIO });
    await flush();
    expect(h.container.querySelector("audio")).not.toBeNull();
    expect(h.container.textContent).toContain("song.mp3");
    h.unmount();
  });

  it("Office：blob: URL 不渲染 iframe，改给「无法在线预览」说明", async () => {
    const h = renderPreview([createOfficePreviewPlugin()], { file: OFFICE });
    await flush();
    // blob: 只存在当前页面内存，在线查看器取不到 —— 别渲染一个必然超时的 iframe
    expect(h.container.querySelector("[data-vfp-office-unreachable]")).not.toBeNull();
    expect(h.container.querySelector("iframe")).toBeNull();
    expect(h.container.textContent).toContain("公网可访问");
    h.unmount();
  });

  it("Office：公网 URL 才渲染 iframe，且带上查看器域名", async () => {
    const h = renderPreview([createOfficePreviewPlugin()], {
      file: file({
        name: "report.xlsx",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        extension: "xlsx",
        url: "https://cdn.example.com/report.xlsx",
      }),
    });
    await flush();
    const src = h.container.querySelector("iframe")?.getAttribute("src") ?? "";
    expect(src).toContain("view.officeapps.live.com");
    // 目标 URL 必须被编码进去
    expect(src).toContain(encodeURIComponent("https://cdn.example.com/report.xlsx"));
    h.unmount();
  });

  it("Download：未知格式渲染下载卡片", async () => {
    const h = renderPreview([createDownloadPlugin()], { file: UNKNOWN });
    await flush();
    expect(h.container.textContent).toContain("下载文件");
    expect(h.container.textContent).toContain("x.xyz");
    h.unmount();
  });

  it("赢家从 Download 换成 Image 时不崩（hook 数量变化的回归）", async () => {
    // 迁移前 DownloadPlugin 在 render 钩子里调 React.useEffect：
    // 这个 hook 会被注册到 withPlugins 身上，赢家一换、调用次数一变就抛
    // “Rendered fewer hooks than expected”。这条用例守的就是那次修复。
    const plugins = [
      createImagePreviewPlugin(),
      createPdfPreviewPlugin(),
      createDownloadPlugin(),
    ];
    const h = renderPreview(plugins, { file: UNKNOWN });
    await flush();
    expect(h.container.textContent).toContain("下载文件");

    await h.rerender({ file: IMAGE });
    expect(h.container.querySelector("img")).not.toBeNull();

    // 再换回兜底，来回一次才算真的稳
    await h.rerender({ file: UNKNOWN });
    expect(h.container.textContent).toContain("下载文件");
    h.unmount();
  });
});
