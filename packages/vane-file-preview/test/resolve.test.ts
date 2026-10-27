/**
 * P2 · 单赢家路由
 *
 * 这里测的是**算法**（通配、优先级、canHandle 互斥、兜底、平手），用合成插件。
 * 「17 个真实插件 × 17 种文件」的矩阵在 P3 迁完插件后单独测
 * （`test/resolve-matrix.test.ts`）—— 那时能 import 真插件，才不会因为
 * 「mock 声明与真实声明漂移」而给出假绿灯。
 */
import { describe, it, expect } from "vitest";
import {
  accepts,
  matchExtension,
  matchMimeType,
  priorityOf,
  resolvePreview,
  unsupportedMessage,
} from "../src/components/FilePreviewPlugin/plugins/resolve";
import type {
  FileInfo,
  FilePreviewPlugin,
} from "../src/components/FilePreviewPlugin/plugins/types";

const file = (over: Partial<FileInfo> = {}): FileInfo => ({
  name: "a.txt",
  size: 1,
  type: "text/plain",
  extension: ".txt",
  url: "blob:a",
  ...over,
});

const plugin = (
  name: string,
  over: Partial<FilePreviewPlugin> = {}
): FilePreviewPlugin => ({ name, hooks: {}, ...over });

describe("matchMimeType", () => {
  it("精确匹配", () => {
    expect(matchMimeType("application/pdf", "application/pdf")).toBe(true);
    expect(matchMimeType("application/pdf", "application/zip")).toBe(false);
  });

  it("image/* 只匹配 image 家族", () => {
    expect(matchMimeType("image/png", "image/*")).toBe(true);
    expect(matchMimeType("video/mp4", "image/*")).toBe(false);
  });

  it("*/* 匹配一切（DownloadPlugin 的兜底写法）", () => {
    expect(matchMimeType("application/octet-stream", "*/*")).toBe(true);
    expect(matchMimeType("", "*/*")).toBe(true);
  });
});

describe("matchExtension", () => {
  it("带点和不带的都能对上（endsWith 而不是 ==）", () => {
    expect(matchExtension(".pdf", ".pdf")).toBe(true);
    expect(matchExtension("pdf", ".pdf")).toBe(true);
    expect(matchExtension(".tar.gz", ".gz")).toBe(true);
  });

  it("大小写无关", () => {
    expect(matchExtension(".PDF", ".pdf")).toBe(true);
  });

  it("`.*` 匹配不到任何东西 —— 那不是通配符", () => {
    // DownloadPlugin 的 supportedExtensions 里写着 ".*"，容易误以为它是通配。
    // 它真正生效靠 supportedTypes: ["*/*"]。
    expect(matchExtension(".txt", ".*")).toBe(false);
  });
});

describe("accepts", () => {
  it("canHandle 优先且互斥：声明了它就不再叠加类型匹配", () => {
    // 这是 DocxPreviewPlugin 的实际形态：canHandle 里读 config.enabled 与 docxMode。
    // 如果此处再叠加 supportedTypes，那个开关就会被类型匹配绕过 —— 关了也能命中。
    const p = plugin("X", {
      supportedTypes: ["text/plain"],
      hooks: { canHandle: () => false },
    });
    expect(accepts(p, file({ type: "text/plain" }))).toBe(false);
  });

  it("没有 canHandle 时看 supportedTypes", () => {
    const p = plugin("X", { supportedTypes: ["text/*"] });
    expect(accepts(p, file({ type: "text/plain" }))).toBe(true);
    expect(accepts(p, file({ type: "application/pdf" }))).toBe(false);
  });

  it("没有 canHandle 时也看 supportedExtensions", () => {
    const p = plugin("X", { supportedExtensions: [".pdf"] });
    expect(accepts(p, file({ type: "application/octet-stream", extension: ".pdf" }))).toBe(
      true
    );
  });

  it("enabled: false 的插件不参与路由，哪怕 canHandle 返回 true", () => {
    const p = plugin("X", { enabled: false, hooks: { canHandle: () => true } });
    expect(accepts(p, file())).toBe(false);
  });

  it("什么都没有声明 → 不认", () => {
    expect(accepts(plugin("X"), file())).toBe(false);
  });
});

describe("priorityOf", () => {
  it("priorityOf(file) 覆盖声明式 priority", () => {
    const p = plugin("X", {
      priority: 7,
      hooks: { priorityOf: () => 9 },
    });
    expect(priorityOf(p, file())).toBe(9);
  });

  it("兼容旧钩子名 getPriority（P3 迁完后删除）", () => {
    const p = plugin("X", {
      priority: 7,
      hooks: { getPriority: () => 3 } as never,
    });
    expect(priorityOf(p, file())).toBe(3);
  });

  it("都没有时取声明式 priority，再没有就是 0", () => {
    expect(priorityOf(plugin("X", { priority: 5 }), file())).toBe(5);
    expect(priorityOf(plugin("X"), file())).toBe(0);
  });
});

describe("resolvePreview", () => {
  it("只有一个认领者 → 就是它", () => {
    const p = plugin("Only", { supportedTypes: ["text/*"] });
    expect(resolvePreview([p], file())).toBe(p);
  });

  it("多个认领者 → 优先级高的赢", () => {
    const low = plugin("Low", { supportedTypes: ["text/*"], priority: 3 });
    const high = plugin("High", { supportedTypes: ["text/*"], priority: 9 });
    expect(resolvePreview([low, high], file())?.name).toBe("High");
    // 顺序反过来结论不变
    expect(resolvePreview([high, low], file())?.name).toBe("High");
  });

  it("平手时保持声明顺序（稳定排序）", () => {
    const a = plugin("A", { supportedTypes: ["text/*"], priority: 5 });
    const b = plugin("B", { supportedTypes: ["text/*"], priority: 5 });
    expect(resolvePreview([a, b], file())?.name).toBe("A");
    expect(resolvePreview([b, a], file())?.name).toBe("B");
  });

  it("兜底插件永远输给专精插件（DownloadPlugin 形态）", () => {
    const download = plugin("Download", {
      supportedTypes: ["*/*"],
      supportedExtensions: [".*"],
      priority: -1,
    });
    const csv = plugin("Csv", { supportedTypes: ["text/csv"], priority: 7 });
    expect(resolvePreview([download, csv], file({ type: "text/csv" }))?.name).toBe(
      "Csv"
    );
    // 没人认领的怪格式才落到兜底
    expect(
      resolvePreview([download, csv], file({ type: "application/x-weird" }))?.name
    ).toBe("Download");
  });

  it("一个都不认 → null", () => {
    const p = plugin("Pdf", { supportedTypes: ["application/pdf"] });
    expect(resolvePreview([p], file())).toBeNull();
    expect(resolvePreview([], file())).toBeNull();
  });

  it("空 type 也走扩展名，不会被空 MIME 骗过去", () => {
    const p = plugin("Md", { supportedTypes: ["text/markdown"], supportedExtensions: [".md"] });
    // 浏览器对陌生格式常给空 type
    expect(
      resolvePreview([p], file({ name: "x.md", type: "", extension: ".md" }))?.name
    ).toBe("Md");
  });
});

describe("unsupportedMessage", () => {
  it("type 为空时退回扩展名，不输出「不支持的文件类型：」这种半截话", () => {
    expect(unsupportedMessage(file({ type: "", extension: ".xyz" }))).toContain(".xyz");
  });

  it("连扩展名都没有时说「未知类型」", () => {
    expect(unsupportedMessage(file({ type: "", extension: "" }))).toContain("未知类型");
  });
});
