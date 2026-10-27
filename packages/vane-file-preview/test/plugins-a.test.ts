/**
 * P3 · A 批 6 个轻量插件（Image / Pdf / Video / Audio / Download / Office）
 *
 * 三条闸门，各自防一类「文档与实现分叉」：
 *
 * 1. **工厂契约**：`createXxxPlugin()` 必须返回 `{ name, hooks }`，`priority` 是数字，
 *    六个名字不重复。这条防「忘了给某插件加 name」这种会静默毁掉路由的错。
 *
 * 2. **doc.json ↔ 源码对账**：doc.json 声明的 `config` 字段集合必须与工厂返回的
 *    `config` 键集合**完全相等**，且每个 `default` 与运行时值对得上。
 *    这是本项目最容易被忽略的一类漂移 —— 改代码加了个选项、忘了写文档，
 *    文档站上就少一行说明，而没有任何地方会报错。
 *
 * 3. **路由矩阵（A 批 6×N）**：真插件而非合成插件。17×17 的完整矩阵要等
 *    P3 全部迁完（B/C 批还需要 optional peer，此刻装不齐）。用合成插件冒充真插件
 *    是假绿灯 —— 声明一写错，mock 与真实实现一起错。
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { createImagePreviewPlugin } from "../src/custom-plugins/ImagePreviewPlugin";
import { createPdfPreviewPlugin } from "../src/custom-plugins/PdfPreviewPlugin";
import { createVideoPreviewPlugin } from "../src/custom-plugins/VideoPreviewPlugin";
import { createAudioPreviewPlugin } from "../src/custom-plugins/AudioPreviewPlugin";
import { createDownloadPlugin } from "../src/custom-plugins/DownloadPlugin";
import { createOfficePreviewPlugin } from "../src/custom-plugins/OfficePreviewPlugin";
import { resolvePreview } from "../src/components/FilePreviewPlugin/plugins/resolve";
import type {
  FileInfo,
  FilePreviewPlugin,
} from "../src/components/FilePreviewPlugin/plugins/types";

const here = path.dirname(fileURLToPath(import.meta.url));
const pluginsRoot = path.resolve(here, "../src/custom-plugins");

interface Case {
  dir: string;
  create: (config?: never) => FilePreviewPlugin;
  priority: number;
}

const CASES: Case[] = [
  { dir: "ImagePreviewPlugin", create: createImagePreviewPlugin, priority: 10 },
  { dir: "PdfPreviewPlugin", create: createPdfPreviewPlugin, priority: 10 },
  { dir: "VideoPreviewPlugin", create: createVideoPreviewPlugin, priority: 10 },
  { dir: "AudioPreviewPlugin", create: createAudioPreviewPlugin, priority: 10 },
  { dir: "DownloadPlugin", create: createDownloadPlugin, priority: -1 },
  { dir: "OfficePreviewPlugin", create: createOfficePreviewPlugin, priority: 7 },
];

const file = (over: Partial<FileInfo> = {}): FileInfo => ({
  name: "a.bin",
  size: 1,
  type: "",
  extension: "",
  url: "blob:a",
  ...over,
});

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

describe("A 批插件 · 工厂契约", () => {
  it.each(CASES)("$dir 返回 { name, hooks } 且优先级正确", ({ dir, create, priority }) => {
    const plugin = create();
    expect(plugin.name).toBe(dir);
    expect(plugin.hooks).toBeTypeOf("object");
    expect(typeof plugin.hooks.render).toBe("function");
    // 注释掉的 renderToolbar 也算一种错：工具栏是这类插件的招牌
    expect(typeof plugin.hooks.renderToolbar).toBe("function");
    expect(plugin.priority).toBe(priority);
    expect(plugin.description).toBeTruthy();
  });

  it("六个插件的 name 互不重复", () => {
    const names = CASES.map((c) => c.create().name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("只有 DownloadPlugin 声明 canHandle（其余靠类型/扩展名匹配）", () => {
    const withCanHandle = CASES.filter((c) => Boolean(c.create().hooks.canHandle));
    expect(withCanHandle.map((c) => c.dir)).toEqual(["DownloadPlugin"]);
  });

  it("priorityOf 只由 OfficePreviewPlugin 提供", () => {
    const withPriorityOf = CASES.filter(
      (c) => typeof c.create().hooks.priorityOf === "function"
    );
    expect(withPriorityOf.map((c) => c.dir)).toEqual(["OfficePreviewPlugin"]);
  });
});

describe("A 批插件 · doc.json 与源码对账", () => {
  /** doc.json 的 default 是给人看的字符串：`"true"` / `"5"` / `"\"auto\""` / `"-"` */
  const literal = (raw: string) => raw.replace(/^"(.*)"$/, "$1");

  it.each(CASES)("$dir 的 doc.json 字段齐全且与运行时 config 一致", ({ dir, create }) => {
    const raw = readFileSync(path.join(pluginsRoot, dir, "doc.json"), "utf-8");
    const doc = JSON.parse(raw) as {
      name: string;
      description: string;
      since: string;
      tags: string[];
      config: { name: string; type: string; default: string; description: string }[];
      example: string;
      features: string[];
      useCases: string[];
      notes: string[];
    };

    // ---- 基础字段 ----
    expect(doc.name).toBe(create().name);
    expect(doc.description.length).toBeGreaterThan(10);
    expect(doc.since).toMatch(/^\d+\.\d+\.\d+$/);
    expect(doc.tags.length).toBeGreaterThan(0);
    expect(doc.example).toContain(doc.name);
    expect(doc.features.length).toBeGreaterThan(0);
    expect(doc.useCases.length).toBeGreaterThan(0);
    // notes 是这个项目刻意保留的「限制说明」位置：没有已知限制就别写插件
    expect(doc.notes.length).toBeGreaterThan(0);

    // ---- config 字段集合必须与运行时完全一致 ----
    const runtimeConfig = (create().config ?? {}) as Record<string, unknown>;
    const docKeys = doc.config.map((c) => c.name).sort();
    expect(docKeys, `${dir} 的 doc.json config 字段与代码不一致`).toEqual(
      Object.keys(runtimeConfig).sort()
    );

    // ---- 每个 default 与运行时默认值对得上 ----
    for (const entry of doc.config) {
      expect(entry.type, `${dir}.${entry.name} 缺 type`).toBeTruthy();
      expect(entry.description, `${dir}.${entry.name} 缺 description`).toBeTruthy();
      if (entry.default === "-") continue;
      expect(
        literal(entry.default),
        `${dir}.${entry.name} 的默认值与代码不一致`
      ).toBe(String(runtimeConfig[entry.name]));
    }
  });
});

describe("A 批插件 · 路由（真插件，6×N）", () => {
  const plugins = CASES.map((c) => c.create());
  const winnerOf = (f: FileInfo) => resolvePreview(plugins, f)?.name ?? null;

  it("按 MIME 路由到对应插件", () => {
    expect(winnerOf(file({ name: "a.png", type: "image/png", extension: "png" }))).toBe(
      "ImagePreviewPlugin"
    );
    expect(
      winnerOf(file({ name: "a.pdf", type: "application/pdf", extension: "pdf" }))
    ).toBe("PdfPreviewPlugin");
    expect(winnerOf(file({ name: "a.mp4", type: "video/mp4", extension: "mp4" }))).toBe(
      "VideoPreviewPlugin"
    );
    expect(
      winnerOf(file({ name: "a.mp3", type: "audio/mpeg", extension: "mp3" }))
    ).toBe("AudioPreviewPlugin");
    expect(winnerOf(file({ name: "a.docx", type: DOCX_MIME, extension: "docx" }))).toBe(
      "OfficePreviewPlugin"
    );
  });

  it("MIME 为空时靠扩展名兜底（浏览器对陌生格式常给空字符串）", () => {
    expect(winnerOf(file({ name: "a.webp", type: "", extension: "webp" }))).toBe(
      "ImagePreviewPlugin"
    );
    expect(
      winnerOf(file({ name: "a.xlsx", type: "", extension: "xlsx" }))
    ).toBe("OfficePreviewPlugin");
  });

  it("扩展名带不带点都能匹配", () => {
    expect(winnerOf(file({ name: "a.png", type: "", extension: ".png" }))).toBe(
      "ImagePreviewPlugin"
    );
  });

  it("`.ogg` 的歧义按 MIME 判：audio/ogg 归音频，video/ogg 归视频", () => {
    // 这两个断言是 P3-A 真浏览器验收抓到的回归：
    // `.ogg` 是容器格式，Vorbis 音频与 Theora 视频同名。迁移前 Video 插件
    // 靠 `supportedExtensions: [".ogg"]` 把一段 Vorbis 音频抢走，渲染成黑底视频框
    // （工具栏写着 "OGG Video"）。修法两条：Video 不再声明 `.ogg`；
    // resolve 让 MIME 命中压过「只有扩展名像」。
    expect(winnerOf(file({ name: "a.ogg", type: "audio/ogg", extension: "ogg" }))).toBe(
      "AudioPreviewPlugin"
    );
    expect(winnerOf(file({ name: "a.ogg", type: "video/ogg", extension: "ogg" }))).toBe(
      "VideoPreviewPlugin"
    );
    // MIME 完全没有时，`.ogg` 默认当音频（绝大多数情况）
    expect(winnerOf(file({ name: "a.ogg", type: "", extension: "ogg" }))).toBe(
      "AudioPreviewPlugin"
    );
  });

  it("MIME 命中压过仅扩展名命中（同 priority 时）", () => {
    // 构造：两个插件都 priority 10，一个声明 video/*，一个声明 .mp4
    // 文件是 video/mp4 → 前者 MIME 命中(strength 2)，后者只有扩展名(strength 1)
    const byMime = {
      name: "ByMime",
      priority: 10,
      supportedTypes: ["video/*"],
      hooks: { render: () => null },
    } as FilePreviewPlugin;
    const byExt = {
      name: "ByExt",
      priority: 10,
      supportedExtensions: [".mp4"],
      hooks: { render: () => null },
    } as FilePreviewPlugin;

    const mp4 = file({ name: "a.mp4", type: "video/mp4", extension: "mp4" });
    // 扩展名那个写在前面，仍然应该输给 MIME 命中的
    expect(resolvePreview([byExt, byMime], mp4)?.name).toBe("ByMime");
    // 反过来（MIME 为空）时只剩扩展名命中，ByExt 赢
    const noMime = file({ name: "a.mp4", type: "", extension: "mp4" });
    expect(resolvePreview([byExt, byMime], noMime)?.name).toBe("ByExt");
  });

  it("priority 仍然压过匹配置信度（显式意图最高优先）", () => {
    const highPriorityExtOnly = {
      name: "HighPriority",
      priority: 20,
      supportedExtensions: [".mp4"],
      hooks: { render: () => null },
    } as FilePreviewPlugin;
    const lowPriorityMime = {
      name: "LowPriority",
      priority: 5,
      supportedTypes: ["video/*"],
      hooks: { render: () => null },
    } as FilePreviewPlugin;
    const mp4 = file({ name: "a.mp4", type: "video/mp4", extension: "mp4" });
    expect(resolvePreview([lowPriorityMime, highPriorityExtOnly], mp4)?.name).toBe(
      "HighPriority"
    );
  });

  it("没有对应插件时落到 DownloadPlugin（兜底）", () => {
    expect(
      winnerOf(file({ name: "a.zip", type: "application/zip", extension: "zip" }))
    ).toBe("DownloadPlugin");
    expect(
      winnerOf(
        file({ name: "a.xyz", type: "application/x-nonsense", extension: "xyz" })
      )
    ).toBe("DownloadPlugin");
  });

  it("装了 DownloadPlugin 就永远有赢家（unsupported 面板不再出现）", () => {
    // 这是兜底插件的设计后果，写成断言是为了让未来改它的人先看到这条语义
    expect(
      winnerOf(file({ name: "a.xyz", type: "application/x-nonsense", extension: "xyz" }))
    ).not.toBeNull();
  });

  it("不装 DownloadPlugin 时没人认领的类型返回 null", () => {
    const noFallback = CASES.filter((c) => c.dir !== "DownloadPlugin").map((c) =>
      c.create()
    );
    const winner = resolvePreview(
      noFallback,
      file({ name: "a.xyz", type: "application/x-nonsense", extension: "xyz" })
    );
    expect(winner).toBeNull();
  });

  it("preferDocxOnline 只在 docx 上提优先级，不抢 xlsx 的活", () => {
    const office = createOfficePreviewPlugin({ preferDocxOnline: true });
    const docx = file({ name: "a.docx", type: DOCX_MIME, extension: "docx" });
    const xlsx = file({ name: "a.xlsx", type: XLSX_MIME, extension: "xlsx" });
    expect(office.hooks.priorityOf?.(docx)).toBe(9);
    expect(office.hooks.priorityOf?.(xlsx)).toBe(7);
  });
});
