/**
 * B 批插件的「成功路径」冒烟：真插件 → 真装配器 → 真 Core，
 * 依赖用**真的**（jszip / xlsx 都装在 devDependencies），只把 `fetch` 打桩。
 *
 * 为什么要测到这一层：B 批与 A 批的结构差异全在「动态加载 + sharedData 跨子树通信」上，
 * 声明测试证明不了这两件事。特别是 Xlsx 的 Sheet 页签 ——
 * 正文把 sheetNames 写进 sharedData、工具栏读它，点页签再 `forceUpdate()`
 * 把两边拉起来。这条链路任何一环断了，页签都会退化成迁移前那个写死的「Sheet: 1」。
 */
import { describe, expect, it, vi } from "vitest";
import JSZip from "jszip";
import * as XLSX from "xlsx";

import { createZipPreviewPlugin } from "../src/custom-plugins/ZipPreviewPlugin";
import { createXlsxPreviewPlugin } from "../src/custom-plugins/XlsxPreviewPlugin";
import { createPptxPreviewPlugin } from "../src/custom-plugins/PptxPreviewPlugin";
import { renderPreview, waitFor } from "./helpers";
import type { FileInfo } from "../src/components/FilePreviewPlugin/plugins/types";

const file = (over: Partial<FileInfo> = {}): FileInfo => ({
  name: "a.bin",
  size: 2048,
  type: "",
  extension: "bin",
  url: "blob:a",
  ...over,
});

/** 把一段二进制喂给 fetch（happy-dom 没有网络，也不该有） */
function stubFetchWith(body: ArrayBuffer | Uint8Array): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body as BodyInit, { status: 200 }))
  );
}

describe("B 批插件 · 成功路径", () => {
  it("Zip：真 jszip 解出条目，目录在前", async () => {
    const zip = new JSZip();
    zip.file("readme.txt", "hello");
    zip.folder("src");
    const buf = await zip.generateAsync({ type: "arraybuffer" });
    stubFetchWith(buf);

    const h = renderPreview([createZipPreviewPlugin()], {
      file: file({ name: "a.zip", type: "application/zip", extension: "zip" }),
    });
    await waitFor(() => (h.container.textContent ?? "").includes("readme.txt"));

    const text = h.container.textContent ?? "";
    expect(h.container.querySelector("[data-vfp-missing]")).toBeNull();
    expect(text).toContain("readme.txt");
    expect(text).toContain("src/");
    // 目录在文件前面
    expect(text.indexOf("src/")).toBeLessThan(text.indexOf("readme.txt"));
    h.unmount();
  });

  it("Zip：maxFiles 生效，超出部分只提示总数", async () => {
    const zip = new JSZip();
    for (let i = 0; i < 5; i += 1) zip.file(`f${i}.txt`, "x");
    const buf = await zip.generateAsync({ type: "arraybuffer" });
    stubFetchWith(buf);

    const h = renderPreview([createZipPreviewPlugin({ maxFiles: 2 })], {
      file: file({ name: "a.zip", type: "application/zip", extension: "zip" }),
    });
    await waitFor(() => (h.container.textContent ?? "").includes("还有 3 项未列出"));

    const text = h.container.textContent ?? "";
    expect(text).toContain("还有 3 项未列出");
    h.unmount();
  });

  it("Xlsx：多 Sheet 渲染页签，点击切换正文", async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["名称", "数量"],
        ["苹果", 3],
      ]),
      "一月"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([["名称", "数量"], ["香蕉", 9]]),
      "二月"
    );
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    stubFetchWith(buf);

    const h = renderPreview([createXlsxPreviewPlugin()], {
      file: file({
        name: "a.xlsx",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        extension: "xlsx",
      }),
    });
    await waitFor(() => (h.container.textContent ?? "").includes("苹果"));

    const tabs = Array.from(
      h.container.querySelectorAll("[data-vfp-toolbar] button")
    ) as HTMLButtonElement[];
    const feb = tabs.find((b) => b.textContent === "二月");
    expect(feb, "工具栏应有两个 sheet 页签").toBeTruthy();

    feb?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await waitFor(() => (h.container.textContent ?? "").includes("香蕉"));

    expect(h.container.textContent).toContain("香蕉");
    expect(h.container.textContent).not.toContain("苹果");
    h.unmount();
  });

  it("Pptx：抽 slide 文本并标注「文本大纲」", async () => {
    // 造一个最小 pptx：只要 ppt/slides/slide1.xml / slide2.xml
    const zip = new JSZip();
    zip.file(
      "ppt/slides/slide1.xml",
      `<?xml version="1.0"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:t>季度汇报</a:t></a:p><a:p><a:t>营收增长 12%</a:t></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`
    );
    zip.file(
      "ppt/slides/slide2.xml",
      `<?xml version="1.0"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:t>第二页标题</a:t></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`
    );
    const buf = await zip.generateAsync({ type: "arraybuffer" });
    stubFetchWith(buf);

    const h = renderPreview([createPptxPreviewPlugin()], {
      file: file({
        name: "a.pptx",
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        extension: "pptx",
      }),
    });
    // jszip 动态 import → fetch → 解包 → 逐页 DOMParser，链路比 Zip 长，
    // 所以等条件而不是等固定轮数
    await waitFor(() => h.container.querySelector("[data-vfp-pptx-outline]") !== null);

    const text = h.container.textContent ?? "";
    // 口径声明必须在，否则用户会以为版式渲染坏了
    expect(h.container.querySelector("[data-vfp-pptx-outline]")).not.toBeNull();
    expect(text).toContain("文本大纲");
    expect(text).toContain("季度汇报");
    h.unmount();
  });
});
