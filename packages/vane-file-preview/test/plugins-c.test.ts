/**
 * P3 · C 批 4 个「拆分 / 重构」级插件
 *
 * 除了与 A/B 批同样的两条闸门（工厂契约 / doc.json 对账），这批多三条：
 *
 * 3. **重依赖必须动态加载**，且要扫**整个插件目录**（Code 的 `import()` 落在
 *    `themes.ts` 里，只扫 `index.tsx` 会放过它）。
 * 4. **priority 必须留出空档**：`.csv` 同时被 Code(4) 与 Csv(8) 认领，
 *    `.md` 同时被 Code(4) 与 Markdown(9) 认领 —— 靠 priority 分胜负，
 *    一旦有人把 Code 提到 8，`.csv` 就会随机换渲染器。
 * 5. **`.txt` 不再被 CSV 抢走**：迁移前 Csv 声明了 `text/plain` + `.txt`，
 *    打开一个 README.txt 得到的是「表格是空的」面板。
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { createCodePreviewPlugin } from "../src/custom-plugins/CodePreviewPlugin";
import { createMarkdownPreviewPlugin } from "../src/custom-plugins/MarkdownPreviewPlugin";
import { createCsvPreviewPlugin } from "../src/custom-plugins/CsvPreviewPlugin";
import {
  createEpubPreviewPlugin,
  createSimpleReactReaderEpubPlugin,
} from "../src/custom-plugins/EpubPreviewPlugin";
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
  heavyDeps: string[];
}

const CASES: Case[] = [
  {
    dir: "CodePreviewPlugin",
    create: createCodePreviewPlugin,
    priority: 4,
    heavyDeps: [
      "react-syntax-highlighter",
      "react-syntax-highlighter/dist/esm/styles/prism/one-light",
      "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus",
    ],
  },
  {
    dir: "MarkdownPreviewPlugin",
    create: createMarkdownPreviewPlugin,
    priority: 9,
    heavyDeps: ["react-markdown", "remark-gfm", "remark-breaks", "rehype-highlight"],
  },
  {
    dir: "CsvPreviewPlugin",
    create: createCsvPreviewPlugin,
    priority: 8,
    heavyDeps: ["papaparse"],
  },
  {
    dir: "EpubPreviewPlugin",
    create: createEpubPreviewPlugin,
    priority: 8,
    heavyDeps: ["react-reader"],
  },
];

/** 插件目录下所有源码（Code 的 import() 在 themes.ts，只读 index.tsx 会漏） */
function readPluginSources(dir: string): string {
  return readdirSync(path.join(pluginsRoot, dir), { withFileTypes: true })
    .filter((e) => e.isFile() && /\.tsx?$/.test(e.name))
    .map((e) => readFileSync(path.join(pluginsRoot, dir, e.name), "utf-8"))
    .join("\n");
}

const file = (over: Partial<FileInfo> = {}): FileInfo => ({
  name: "a.bin",
  size: 1,
  type: "",
  extension: "",
  url: "blob:a",
  ...over,
});

const all = (): FilePreviewPlugin[] => CASES.map((c) => c.create());
const winnerOf = (f: FileInfo, list: FilePreviewPlugin[] = all()) =>
  resolvePreview(list, f)?.name ?? null;

describe("C 批插件 · 工厂契约", () => {
  it.each(CASES)("$dir 返回 { name, hooks } 且优先级正确", ({ dir, create, priority }) => {
    const plugin = create();
    expect(plugin.name).toBe(dir);
    expect(typeof plugin.hooks.render).toBe("function");
    expect(typeof plugin.hooks.renderToolbar).toBe("function");
    expect(plugin.priority).toBe(priority);
    expect(plugin.description).toBeTruthy();
  });

  it("四个插件的 name 互不重复，且都是 PascalCase", () => {
    const names = CASES.map((c) => c.create().name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(/^[A-Z][A-Za-z]+$/);
  });

  it("EpubPreviewPlugin 保留旧名别名（归档 demo 里用的是 SimpleReactReader…）", () => {
    expect(createSimpleReactReaderEpubPlugin().name).toBe("EpubPreviewPlugin");
    expect(createSimpleReactReaderEpubPlugin).toBe(createEpubPreviewPlugin);
  });

  it("没有任何插件用 hooks.getPriority（这个钩子名不存在）", () => {
    for (const c of CASES) {
      const hooks = c.create().hooks as Record<string, unknown>;
      expect(hooks.getPriority, `${c.dir} 里还有 getPriority`).toBeUndefined();
    }
  });
});

describe("C 批插件 · 重依赖是动态 import", () => {
  it.each(CASES)("$dir 用 import() 而不是顶层 import", ({ dir, heavyDeps }) => {
    const source = readPluginSources(dir);

    for (const dep of heavyDeps) {
      expect(
        source.includes(`import("${dep}")`),
        `${dir} 里没有 import("${dep}") —— 重依赖必须动态加载`
      ).toBe(true);

      const staticImport = new RegExp(
        `^\\s*import\\s[^;]*from\\s*["']${dep.replace(/[/.]/g, "\\$&")}["']`,
        "m"
      );
      expect(staticImport.test(source), `${dir} 仍然在顶层静态 import "${dep}"`).toBe(
        false
      );
    }
  });

  it("rehype-raw 只在 allowHtml 的 loader 里出现（默认不加载）", () => {
    const source = readPluginSources("MarkdownPreviewPlugin");
    // 有 import()，但不是无条件 —— 它在 loadMarkdownWithRaw 里
    expect(source.includes('import("rehype-raw")')).toBe(true);
    expect(source).toContain("config.allowHtml ? loadMarkdownWithRaw : loadMarkdownSafe");
  });
});

describe("C 批插件 · doc.json 与源码对账", () => {
  const literal = (raw: string) => raw.replace(/^"(.*)"$/, "$1");

  it.each(CASES)("$dir 的 doc.json 字段齐全且与运行时 config 一致", ({ dir, create }) => {
    const doc = JSON.parse(
      readFileSync(path.join(pluginsRoot, dir, "doc.json"), "utf-8")
    ) as {
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

describe("C 批插件 · 路由", () => {
  it("按扩展名路由到对应插件", () => {
    expect(winnerOf(file({ name: "a.ts", type: "", extension: "ts" }))).toBe(
      "CodePreviewPlugin"
    );
    expect(winnerOf(file({ name: "a.md", type: "text/markdown", extension: "md" }))).toBe(
      "MarkdownPreviewPlugin"
    );
    expect(winnerOf(file({ name: "a.csv", type: "text/csv", extension: "csv" }))).toBe(
      "CsvPreviewPlugin"
    );
    expect(
      winnerOf(file({ name: "a.epub", type: "application/epub+zip", extension: "epub" }))
    ).toBe("EpubPreviewPlugin");
  });

  it("Code 排在最后：同是文本文件时 Markdown / CSV 优先", () => {
    const code = createCodePreviewPlugin();
    expect(code.priority).toBeLessThan(createMarkdownPreviewPlugin().priority ?? 0);
    expect(code.priority).toBeLessThan(createCsvPreviewPlugin().priority ?? 0);
  });

  it(".txt / text/plain 归 Code，不再被 CSV 抢走", () => {
    // 迁移前 Csv 声明了 text/plain + .txt，README.txt 会得到「表格是空的」
    expect(winnerOf(file({ name: "README.txt", type: "text/plain", extension: "txt" }))).toBe(
      "CodePreviewPlugin"
    );
  });

  it(".tsv 归 CSV（Tab 分隔表的常见扩展名）", () => {
    expect(
      winnerOf(
        file({ name: "a.tsv", type: "text/tab-separated-values", extension: "tsv" })
      )
    ).toBe("CsvPreviewPlugin");
  });

  it(".md 不会被 Code 抢走（Code 不再声明 .md）", () => {
    const onlyCode = [createCodePreviewPlugin()];
    expect(winnerOf(file({ name: "a.md", type: "text/markdown", extension: "md" }), onlyCode)).toBe(
      null
    );
  });
});
