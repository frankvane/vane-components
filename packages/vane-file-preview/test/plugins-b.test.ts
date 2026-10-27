/**
 * P3 · B 批 7 个「带 optional peer」的插件
 *
 * 与 A 批同样的两条闸门（工厂契约 / doc.json 对账），加 B 批独有的两条：
 *
 * 3. **`docxMode` 路由**：`MammothDocxPlugin` 与 `DocxPreviewPlugin` 都声明 `.docx`，
 *    靠 `canHandle` 互斥。迁移前两个都算 priority，赢家取决于注册顺序 ——
 *    这里把三种 docxMode 取值 × 两种注册顺序都跑一遍，顺序必须不影响结果。
 *
 * 4. **重依赖必须是「延迟加载」而不是「顶层静态 import」**：断言每个插件的源码里
 *    出现的是 `import("pkg")` 形态。这条防的是「有人图省事改回 `import JSZip from "jszip"`」，
 *    那会让「没装依赖」重新变成整页崩溃。
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { createZipPreviewPlugin } from "../src/custom-plugins/ZipPreviewPlugin";
import { createJsonPreviewPlugin } from "../src/custom-plugins/JsonPreviewPlugin";
import { createXmlPreviewPlugin } from "../src/custom-plugins/XmlPreviewPlugin";
import { createXlsxPreviewPlugin } from "../src/custom-plugins/XlsxPreviewPlugin";
import { createPptxPreviewPlugin } from "../src/custom-plugins/PptxPreviewPlugin";
import { createDocxPreviewPlugin } from "../src/custom-plugins/DocxPreviewPlugin";
import { createMammothDocxPlugin } from "../src/custom-plugins/MammothDocxPlugin";
import { createOfficePreviewPlugin } from "../src/custom-plugins/OfficePreviewPlugin";
import { createDownloadPlugin } from "../src/custom-plugins/DownloadPlugin";
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
  /** 这个插件动态加载的重依赖（必须出现在源码的 import() 里） */
  heavyDeps: string[];
}

const CASES: Case[] = [
  {
    dir: "ZipPreviewPlugin",
    create: createZipPreviewPlugin,
    priority: 9,
    heavyDeps: ["jszip"],
  },
  {
    dir: "JsonPreviewPlugin",
    create: createJsonPreviewPlugin,
    priority: 6,
    heavyDeps: ["@uiw/react-json-view"],
  },
  {
    dir: "XmlPreviewPlugin",
    create: createXmlPreviewPlugin,
    priority: 6,
    heavyDeps: ["react-xml-viewer"],
  },
  {
    dir: "XlsxPreviewPlugin",
    create: createXlsxPreviewPlugin,
    priority: 8,
    heavyDeps: ["xlsx"],
  },
  {
    dir: "PptxPreviewPlugin",
    create: createPptxPreviewPlugin,
    priority: 8,
    heavyDeps: ["jszip"],
  },
  {
    dir: "DocxPreviewPlugin",
    create: createDocxPreviewPlugin,
    priority: 8,
    heavyDeps: ["docx-preview"],
  },
  {
    dir: "MammothDocxPlugin",
    create: createMammothDocxPlugin,
    priority: 8,
    heavyDeps: ["mammoth/mammoth.browser"],
  },
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
const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const docx = (mode?: "mammoth" | "docx-preview") =>
  file({ name: "a.docx", type: DOCX_MIME, extension: "docx", docxMode: mode });

describe("B 批插件 · 工厂契约", () => {
  it.each(CASES)("$dir 返回 { name, hooks } 且优先级正确", ({ dir, create, priority }) => {
    const plugin = create();
    expect(plugin.name).toBe(dir);
    expect(typeof plugin.hooks.render).toBe("function");
    expect(typeof plugin.hooks.renderToolbar).toBe("function");
    expect(plugin.priority).toBe(priority);
    expect(plugin.description).toBeTruthy();
  });

  it("七个插件的 name 互不重复，且都是 PascalCase", () => {
    const names = CASES.map((c) => c.create().name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(/^[A-Z][A-Za-z]+$/);
  });

  it("只有两个 docx 插件声明 canHandle（其余靠类型/扩展名）", () => {
    const withCanHandle = CASES.filter((c) => Boolean(c.create().hooks.canHandle));
    expect(withCanHandle.map((c) => c.dir).sort()).toEqual([
      "DocxPreviewPlugin",
      "MammothDocxPlugin",
    ]);
  });
});

describe("B 批插件 · 重依赖是动态 import", () => {
  it.each(CASES)("$dir 用 import() 而不是顶层 import", ({ dir, heavyDeps }) => {
    // 源码可能在 index.tsx（B 批全部如此）；读不到就明确失败，不要静默跳过
    const source = readFileSync(path.join(pluginsRoot, dir, "index.tsx"), "utf-8");

    for (const dep of heavyDeps) {
      expect(
        source.includes(`import("${dep}")`),
        `${dir} 里没有 import("${dep}") —— 重依赖必须动态加载，否则没装依赖时会整页崩`
      ).toBe(true);
    }

    // 顶层 import 的形态：`import X from "dep"` / `import * as X from "dep"` / `import "dep"`
    for (const dep of heavyDeps) {
      const staticImport = new RegExp(
        `^\\s*import\\s[^;]*from\\s*["']${dep.replace(/[/.]/g, "\\$&")}["']`,
        "m"
      );
      expect(staticImport.test(source), `${dir} 仍然在顶层静态 import "${dep}"`).toBe(
        false
      );
    }
  });
});

describe("B 批插件 · doc.json 与源码对账", () => {
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

    expect(doc.name).toBe(create().name);
    expect(doc.description.length).toBeGreaterThan(10);
    expect(doc.since).toMatch(/^\d+\.\d+\.\d+$/);
    expect(doc.tags.length).toBeGreaterThan(0);
    expect(doc.example).toContain(doc.name);
    expect(doc.features.length).toBeGreaterThan(0);
    expect(doc.useCases.length).toBeGreaterThan(0);
    expect(doc.notes.length).toBeGreaterThan(0);

    const runtimeConfig = (create().config ?? {}) as Record<string, unknown>;
    expect(
      doc.config.map((c) => c.name).sort(),
      `${dir} 的 doc.json config 字段与代码不一致`
    ).toEqual(Object.keys(runtimeConfig).sort());

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

describe("B 批插件 · 路由", () => {
  const plugins = CASES.map((c) => c.create());
  const winnerOf = (f: FileInfo, list: FilePreviewPlugin[] = plugins) =>
    resolvePreview(list, f)?.name ?? null;

  it("按 MIME 路由到对应插件", () => {
    expect(winnerOf(file({ name: "a.zip", type: "application/zip", extension: "zip" }))).toBe(
      "ZipPreviewPlugin"
    );
    expect(
      winnerOf(file({ name: "a.json", type: "application/json", extension: "json" }))
    ).toBe("JsonPreviewPlugin");
    expect(winnerOf(file({ name: "a.xml", type: "text/xml", extension: "xml" }))).toBe(
      "XmlPreviewPlugin"
    );
    expect(winnerOf(file({ name: "a.xlsx", type: XLSX_MIME, extension: "xlsx" }))).toBe(
      "XlsxPreviewPlugin"
    );
    expect(winnerOf(file({ name: "a.pptx", type: PPTX_MIME, extension: "pptx" }))).toBe(
      "PptxPreviewPlugin"
    );
  });

  it("docx 由 docxMode 决定，且与注册顺序无关", () => {
    const mammoth = createMammothDocxPlugin();
    const preview = createDocxPreviewPlugin();
    const office = createOfficePreviewPlugin();

    const forward = [mammoth, preview, office];
    const backward = [office, preview, mammoth];

    // 默认走 mammoth（未设 docxMode）
    expect(winnerOf(docx(), forward)).toBe("MammothDocxPlugin");
    expect(winnerOf(docx(), backward)).toBe("MammothDocxPlugin");
    // 显式 mammoth
    expect(winnerOf(docx("mammoth"), forward)).toBe("MammothDocxPlugin");
    // 显式 docx-preview —— 这一次必须是 docx-preview 拿，不论声明顺序
    expect(winnerOf(docx("docx-preview"), forward)).toBe("DocxPreviewPlugin");
    expect(winnerOf(docx("docx-preview"), backward)).toBe("DocxPreviewPlugin");
  });

  it("关掉 mammoth 插件后 docx 落到 Office 在线预览", () => {
    const list = [
      createMammothDocxPlugin({ enabled: false }),
      createDocxPreviewPlugin(),
      createOfficePreviewPlugin(),
    ];
    expect(winnerOf(docx(), list)).toBe("OfficePreviewPlugin");
  });

  it("关掉 docx-preview 插件后即使 docxMode 指向它也落空（交给兜底）", () => {
    const list = [
      createDocxPreviewPlugin({ enabled: false }),
      createDownloadPlugin(),
    ];
    expect(winnerOf(docx("docx-preview"), list)).toBe("DownloadPlugin");
  });

  it(".rar / .7z 不再被 ZipPreviewPlugin 认领（jszip 解不开）", () => {
    expect(
      winnerOf(file({ name: "a.rar", type: "application/x-rar-compressed", extension: "rar" }))
    ).toBeNull();
    expect(
      winnerOf(file({ name: "a.7z", type: "application/x-7z-compressed", extension: "7z" }))
    ).toBeNull();
  });

  it(".svg 归图片插件，不归 XmlPreviewPlugin", () => {
    // Xml 插件刻意不再声明 .svg —— SVG 是图片，源码视图是次要需求
    expect(winnerOf(file({ name: "a.svg", type: "image/svg+xml", extension: "svg" }))).toBe(
      null
    );
  });
});
