/**
 * P1-4 回归：大文件必须在 fetch / 解析之前被拦住。
 *
 * 原缺陷：Code / Csv / Xlsx / Zip / Pptx 都直接 `fetch → arrayBuffer → 解析`，
 * 没有体积门控；Code 的「过高亮上限」还拿 `text.length`（字符）和字节数比。
 */
import { describe, expect, it, vi } from "vitest";

import { createCsvPreviewPlugin } from "../src/custom-plugins/CsvPreviewPlugin";
import { createCodePreviewPlugin } from "../src/custom-plugins/CodePreviewPlugin";
import { renderPreview, waitFor } from "./helpers";
import type { FileInfo } from "../src/components/FilePreviewPlugin/plugins/types";

const file = (over: Partial<FileInfo> = {}): FileInfo => ({
  name: "a.txt",
  size: 1,
  type: "text/plain",
  extension: "txt",
  url: "blob:a",
  ...over,
});

describe("P1-4 · 体积门控", () => {
  it("CSV 超过 maxFileSize 时在 fetch 之前失败", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const h = renderPreview([createCsvPreviewPlugin({ maxFileSize: 1024 })], {
      file: file({ name: "big.csv", type: "text/csv", extension: "csv", size: 4096 }),
    });

    await waitFor(() =>
      (h.container.textContent ?? "").includes("超过表格解析上限")
    );
    // 原实现会先把 4KB 读进来再解析；门控必须发生在 fetch 之前
    expect(fetchMock).not.toHaveBeenCalled();
    h.unmount();
  });

  it("Code 的高亮阈值按字节判断（file.size），不是 text.length", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("hi", { status: 200 }))
    );

    const h = renderPreview(
      [createCodePreviewPlugin({ maxBytes: 2 * 1024 * 1024 })],
      {
        file: file({
          name: "big.log",
          type: "text/plain",
          extension: "log",
          size: 3 * 1024 * 1024,
        }),
      }
    );

    await waitFor(() => h.container.querySelector("[data-vfp-code-plain]") !== null);
    expect(h.container.textContent).toContain("超过高亮上限");
    h.unmount();
  });
});
