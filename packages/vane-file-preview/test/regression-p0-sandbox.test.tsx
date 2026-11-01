/**
 * P0-1 回归：PDF / Office 的 iframe 必须带安全边界。
 *
 * 原缺陷：两处 iframe 都没有 `sandbox`。只要文件被服务端按扩展名误标成
 * `text/html`（或者消费方传同源 `blob:`），iframe 里的脚本就会在宿主源执行。
 */
import { describe, expect, it } from "vitest";
import { act } from "react";

import { createPdfPreviewPlugin } from "../src/custom-plugins/PdfPreviewPlugin";
import { createOfficePreviewPlugin } from "../src/custom-plugins/OfficePreviewPlugin";
import { flush, renderPreview } from "./helpers";
import type { FileInfo } from "../src/components/FilePreviewPlugin/plugins/types";

const PDF: FileInfo = {
  name: "doc.pdf",
  size: 2048,
  type: "application/pdf",
  extension: "pdf",
  url: "blob:pdf",
};

const OFFICE_WEB: FileInfo = {
  name: "report.xlsx",
  size: 2048,
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  extension: "xlsx",
  url: "https://cdn.example.com/report.xlsx",
};

describe("P0-1 · iframe 最小权限 sandbox", () => {
  it("PDF 默认 sandbox 不含 allow-same-origin，且是 no-referrer", async () => {
    const h = renderPreview([createPdfPreviewPlugin()], { file: PDF });
    await flush();

    const frame = h.container.querySelector("iframe");
    expect(frame).not.toBeNull();
    expect(frame?.getAttribute("sandbox")).toBe("allow-scripts");
    // allow-scripts + allow-same-origin 组合等于没加 sandbox
    expect(frame?.getAttribute("sandbox")).not.toContain("allow-same-origin");
    expect(frame?.getAttribute("referrerpolicy")).toBe("no-referrer");
    h.unmount();
  });

  it("PDF 允许可信来源显式关闭 sandbox（配置项可用）", async () => {
    const h = renderPreview([createPdfPreviewPlugin({ sandbox: false })], {
      file: PDF,
    });
    await flush();

    const frame = h.container.querySelector("iframe");
    expect(frame).not.toBeNull();
    expect(frame?.getAttribute("sandbox")).toBeNull();
    h.unmount();
  });

  it("PDF enableToolbar=false 时补回缩放控件（P2-5，工具栏不再只有一个下载）", async () => {
    const h = renderPreview([createPdfPreviewPlugin({ enableToolbar: false })], {
      file: PDF,
    });
    await flush();

    const frame = h.container.querySelector("iframe");
    const zoomIn = Array.from(h.container.querySelectorAll("button")).find(
      (b) => b.getAttribute("title") === "放大"
    );
    expect(zoomIn).toBeTruthy();

    act(() => zoomIn?.click());
    expect(frame?.style.zoom).toBe("1.1");
    h.unmount();
  });

  it("Office 查看器 iframe 也带 sandbox 与 no-referrer", async () => {
    const h = renderPreview([createOfficePreviewPlugin()], {
      file: OFFICE_WEB,
    });
    await flush();

    const frame = h.container.querySelector("iframe");
    expect(frame).not.toBeNull();
    const sandbox = frame?.getAttribute("sandbox") ?? "";
    expect(sandbox).toContain("allow-scripts");
    expect(frame?.getAttribute("referrerpolicy")).toBe("no-referrer");
    h.unmount();
  });
});
