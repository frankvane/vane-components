/**
 * 构建产物闸门：重依赖**必须**留在 dist 外面。
 *
 * ## 为什么这条必须由测试守，而不是靠「看构建日志」
 *
 * 迁移前的包 985.97 kB / gzip 196 KB，而构建日志全绿 —— 因为 rollup 把
 * `mammoth`、`xlsx`、41 套 prism 主题**整库内联**了，不报错、不警告。
 * 根因是 `external: ["mammoth"]` 这类写法**匹配不到子路径**：
 *   `"mammoth"` ≠ `"mammoth/mammoth.browser"`
 *   `"@uiw/react-json-view"` ≠ `"@uiw/react-json-view/light"`
 * 于是「写了 external 却等于没写」。
 *
 * 现在 external 全部改成 `/^pkg(\/|$)/` 正则（见 vite.config.ts），
 * 这条测试负责在**改回字符串**的那天立刻变红。
 *
 * ## 三道判据
 *
 * 1. 每个重依赖的 `import("x")` 必须原样出现在 dist 里 —— 说明它被当成外部模块了。
 * 2. dist 里不得出现各库的体积特征串（类名 / CSS 变量前缀 / 生成的 class）。
 * 3. **单文件 ≤ 60KB、全部 ≤ 220KB**。这条是兜底：不管将来换哪个库，
 *    只要整库被内联，体积一定会跳一个数量级，签名没覆盖到的库也逃不掉。
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(here, "../dist");

function collectJs(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectJs(full, acc);
    else if (full.endsWith(".js")) acc.push(full);
  }
  return acc;
}

/** 每个重依赖应该出现在哪个入口文件里（源码路径 == 发布子路径） */
const DYNAMIC_IMPORTS: Array<[entry: string, dep: string]> = [
  ["custom-plugins/ZipPreviewPlugin/index.js", "jszip"],
  ["custom-plugins/PptxPreviewPlugin/index.js", "jszip"],
  ["custom-plugins/JsonPreviewPlugin/index.js", "@uiw/react-json-view"],
  ["custom-plugins/JsonPreviewPlugin/index.js", "@uiw/react-json-view/light"],
  ["custom-plugins/JsonPreviewPlugin/index.js", "@uiw/react-json-view/dark"],
  ["custom-plugins/XmlPreviewPlugin/index.js", "react-xml-viewer"],
  ["custom-plugins/XlsxPreviewPlugin/index.js", "xlsx"],
  ["custom-plugins/DocxPreviewPlugin/index.js", "docx-preview"],
  ["custom-plugins/MammothDocxPlugin/index.js", "mammoth/mammoth.browser"],
];

/**
 * 各库的「体积特征串」。
 *
 * 刻意避开包名本身：`mammoth` / `xlsx` / `docx-preview` 这些词在
 * `import("…")` 与 `docxMode === "docx-preview"` 里合法出现，
 * 按包名扫会一直是假阳性。这里用只有**整库内联**才会出现的内部标识：
 */
const FORBIDDEN_SIGNATURES = [
  "JSZip", // jszip 的类名
  "SheetJS", // xlsx 的 banner
  "--w-rjv-", // @uiw/react-json-view 的 CSS 变量前缀
  "docx-wrapper", // docx-preview 生成的容器 class
];

const MAX_FILE_BYTES = 60 * 1024;
const MAX_TOTAL_BYTES = 220 * 1024;

const hasDist = existsSync(distDir);

describe("dist 闸门 · 重依赖不得内联", () => {
  it.skipIf(!hasDist)("dist 存在（先跑 pnpm build）", () => {
    expect(hasDist).toBe(true);
  });

  it.skipIf(!hasDist)("每个重依赖都保留为 import() 外部模块", () => {
    for (const [entry, dep] of DYNAMIC_IMPORTS) {
      const file = path.join(distDir, entry);
      expect(existsSync(file), `${entry} 不存在`).toBe(true);
      const code = readFileSync(file, "utf-8");
      expect(
        code.includes(`import("${dep}")`),
        `${entry} 里没有 import("${dep}") —— 依赖被内联了（external 大概率写成了包名而不是正则）`
      ).toBe(true);
    }
  });

  it.skipIf(!hasDist)("dist 里没有各重依赖的体积特征串", () => {
    for (const file of collectJs(distDir)) {
      const code = readFileSync(file, "utf-8");
      for (const sig of FORBIDDEN_SIGNATURES) {
        expect(
          code.includes(sig),
          `${path.relative(distDir, file)} 里出现了 "${sig}" —— 说明该库被整库内联`
        ).toBe(false);
      }
    }
  });

  it.skipIf(!hasDist)("单文件与总量都在预算内（内联会跳一个数量级）", () => {
    const files = collectJs(distDir);
    let total = 0;
    for (const file of files) {
      const { size } = statSync(file);
      total += size;
      expect(
        size,
        `${path.relative(distDir, file)} = ${(size / 1024).toFixed(1)}KB，超过单文件上限 60KB`
      ).toBeLessThanOrEqual(MAX_FILE_BYTES);
    }
    expect(
      total,
      `dist 全部 .js 合计 ${(total / 1024).toFixed(1)}KB，超过 220KB 上限`
    ).toBeLessThanOrEqual(MAX_TOTAL_BYTES);
  });
});
