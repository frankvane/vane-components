import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * 入口自动发现（构建配置与发布脚本共用同一份实现，避免两边漂移）。
 *
 * 约定：源码路径 == 发布子路径（JS 与 d.ts 输出路径天然一致，仅差扩展名）
 *   src/index.ts                   → "."                   → dist/index.js
 *   src/core.ts                    → "./core"              → dist/core.js
 *   src/bus/index.ts               → "./bus"               → dist/bus/index.js
 *   src/custom-plugins/X/index.ts  → "./custom-plugins/X"  → dist/custom-plugins/X/index.js
 *   src/presets/social-feed/index.ts → "./presets/social-feed" → dist/presets/social-feed/index.js
 *
 * components/ 是组件内部目录，不发布为入口。
 *
 * 体积约定：根入口只聚合核心 + 插件系统 + 类型，不桶导出全部插件/配方——
 * 插件与配方一律走子路径按需引入（ADR-6：体积靠 tree-shaking 与显式导入解决）。
 */
const NON_ENTRY_DIRS = new Set(["components", "custom-plugins", "entries", "presets", "styles"]);

const ENTRY_CANDIDATES = ["index.ts", "index.tsx"];

export function discoverEntries(root) {
  const src = path.join(root, "src");
  const entries = {};

  const rootEntry = firstExisting(ENTRY_CANDIDATES.map((f) => path.join(src, f)));
  if (rootEntry) entries.index = `src/${path.basename(rootEntry)}`;

  // src/<name>.ts → "./<name>"（src 根级入口文件，如 core.ts / plugins.ts）
  for (const file of readdirSync(src)) {
    if (/\.tsx?$/.test(file) && !ENTRY_CANDIDATES.includes(file)) {
      entries[file.replace(/\.tsx?$/, "")] = `src/${file}`;
    }
  }

  // src/entries/core.ts（文件形态）与 src/entries/core/index.ts（目录形态）
  // 都映射为 "./entries/<name>"（包内组织形态，不是公开 API 的首选）
  const entriesDir = path.join(src, "entries");
  if (existsSync(entriesDir)) {
    for (const file of readdirSync(entriesDir)) {
      if (/\.tsx?$/.test(file)) entries[`entries/${file.replace(/\.tsx?$/, "")}`] = `src/entries/${file}`;
    }
    for (const dir of listDirs(entriesDir)) {
      const entry = firstExisting(ENTRY_CANDIDATES.map((f) => path.join(entriesDir, dir, f)));
      if (entry) entries[`entries/${dir}`] = `src/entries/${dir}/${path.basename(entry)}`;
    }
  }

  // src/custom-plugins/<Name>/index.ts → "./custom-plugins/<Name>"
  for (const dir of listDirs(path.join(src, "custom-plugins"))) {
    const entry = firstExisting(ENTRY_CANDIDATES.map((f) => path.join(src, "custom-plugins", dir, f)));
    if (entry) entries[`custom-plugins/${dir}`] = `src/custom-plugins/${dir}/${path.basename(entry)}`;
  }

  // src/custom-plugins/index.ts → "./custom-plugins"（桶文件：全量引入逃生口，
  // 常规场景仍推荐逐插件子路径导入以保持最小体积）
  const barrel = path.join(src, "custom-plugins", "index.ts");
  if (existsSync(barrel)) entries["custom-plugins"] = "src/custom-plugins/index.ts";

  // src/presets/<name>/index.ts → "./presets/<name>"（配方按需引入，避免根入口膨胀）
  for (const dir of listDirs(path.join(src, "presets"))) {
    const entry = firstExisting(ENTRY_CANDIDATES.map((f) => path.join(src, "presets", dir, f)));
    if (entry) entries[`presets/${dir}`] = `src/presets/${dir}/${path.basename(entry)}`;
  }

  // src/<dir>/index.ts → "./<dir>"（组件内部目录除外）
  for (const dir of listDirs(src)) {
    if (NON_ENTRY_DIRS.has(dir)) continue;
    const entry = firstExisting(ENTRY_CANDIDATES.map((f) => path.join(src, dir, f)));
    if (entry) entries[dir] = `src/${dir}/${path.basename(entry)}`;
  }

  return entries;
}

/** 入口源码路径 → 发布子路径（"./xxx" 或 "."） */
export function srcToSubpath(srcPath) {
  // src/index.ts → "."；src/bus/index.ts → "./bus"；src/entries/core.ts → "./entries/core"
  const rel = srcPath
    .replace(/^src\//, "")
    .replace(/\.tsx?$/, "")
    .replace(/(^|\/)index$/, "$1")
    .replace(/\/$/, "");
  return rel === "" ? "." : `./${rel}`;
}

/** 入口源码路径 → dist 下的产物相对路径（JS 与 d.ts 仅差扩展名，保证一致） */
export function entryOutputPaths(srcPath) {
  const rel = srcPath.replace(/^src\//, "").replace(/\.tsx?$/, "");
  return { js: `${rel}.js`, dts: `${rel}.d.ts` };
}

/** 由入口表生成 package.json 的 exports 字段 */
export function generateExports(root) {
  const entries = discoverEntries(root);
  const exportsMap = {};

  for (const srcPath of Object.values(entries)) {
    const { js, dts } = entryOutputPaths(srcPath);
    exportsMap[srcToSubpath(srcPath)] = {
      types: `./dist/${dts}`,
      import: `./dist/${js}`,
    };
  }

  // custom-plugins 通配符：新增插件后即使不重新生成 exports 也能被导入
  if (Object.keys(entries).some((k) => k.startsWith("custom-plugins/"))) {
    exportsMap["./custom-plugins/*"] = {
      types: "./dist/custom-plugins/*/index.d.ts",
      import: "./dist/custom-plugins/*/index.js",
    };
  }

  if (existsSync(path.join(root, "src", "styles"))) {
    exportsMap["./style.css"] = "./dist/style.css";
  }

  return exportsMap;
}

function firstExisting(candidates) {
  return candidates.find((p) => existsSync(p));
}

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}
