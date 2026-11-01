/**
 * P1-2 回归：DOCX 的 fetch → renderAsync 之间必须能失效。
 *
 * 原缺陷：清空 DOM 发生在 fetch 之后、renderAsync 之前，且 renderAsync 直接画到
 * 可见容器；用户在「A 还在解析」时切到 B，A 的渲染结果会盖到 B 上。
 */
import { describe, expect, it, vi } from "vitest";

import { createDocxPreviewPlugin } from "../src/custom-plugins/DocxPreviewPlugin";
import { flush, renderPreview, waitFor } from "./helpers";
import type { FileInfo } from "../src/components/FilePreviewPlugin/plugins/types";

const mockState = vi.hoisted(() => {
  let release: (() => void) | null = null;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  return {
    gate,
    calls: 0,
    release: () => release?.(),
  };
});

vi.mock("docx-preview", () => {
  const renderAsync = async (_data: unknown, host: HTMLElement) => {
    mockState.calls += 1;
    const call = mockState.calls;
    // 第一次（文件 A）故意卡住；第二次（文件 B）立刻完成
    if (call === 1) await mockState.gate;
    host.textContent = call === 1 ? "OLD-DOC" : "NEW-DOC";
  };
  return { default: { renderAsync }, renderAsync };
});

const A: FileInfo = {
  name: "a.docx",
  size: 10,
  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  extension: "docx",
  url: "blob:docx-a",
  docxMode: "docx-preview",
};

const B: FileInfo = { ...A, name: "b.docx", url: "blob:docx-b" };

describe("P1-2 · DOCX 异步竞态", () => {
  it("切到新文件后，旧文件晚到的渲染结果不会覆盖它", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }))
    );

    const h = renderPreview([createDocxPreviewPlugin()], { file: A });
    // 等 A 真的进到 renderAsync（此刻卡在 gate 上）
    await waitFor(() => mockState.calls >= 1);

    await h.rerender({ file: B });
    await waitFor(() => (h.container.textContent ?? "").includes("NEW-DOC"));

    // 放行 A 的渲染：alive 已为 false，它只画在游离容器里，不该出现在宿主 DOM
    mockState.release();
    await flush(5);

    const text = h.container.textContent ?? "";
    expect(text).toContain("NEW-DOC");
    expect(text).not.toContain("OLD-DOC");
    h.unmount();
  });
});
