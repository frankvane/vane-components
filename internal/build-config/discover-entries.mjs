import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * 入口自动发现（构建配置与发布脚本共用同一份实现，避免两边漂移）。
 *
 * 约定：源码路径 == 发布子路径（JS 与 d.ts 输出路径天然一致，仅差扩展名）
 *   src/index.ts                   → "."                   → dist/index.js
 *   src/entries/core.ts            → "./entries/core"      → dist/entries/core.js
 *   src/bus/index.ts               → "./bus"               → dist/bus/index.js
 *   src/custom-plugins/X/index.ts  → "./custom-plugins/X"  → dist/custom-plugins/X/index.js
 *
 * components/ 是组件内部目录，不发布为入口。
 */
const NON_ENTRY_DIRS = new Set(["components", "custom-plugins", "entries", "styles"]);

const ENTRY_CANDIDATES = ["index.ts", "index.tsx"];

export function discoverEntries(root) {
  const src = path.join(root, "src");
  const entries = {};

  const rootEntry = firstExisting(ENTRY_CANDIDATES.map((f) => path.join(src, f)));
  if (rootEntry) entries.index = `src/${path.basename(rootEntry)}`;

  // src/entries/*.ts → "./entries/<name>"
  const entriesDir = path.join(src, "entries");
  if (existsSync(entriesDir)) {
    for (const file of readdirSync(entriesDir)) {
      if (/\.tsx?$/.test(file)) entries[`entries/${file.replace(/\.tsx?$/, "")}`] = `src/entries/${file}`;
    }
  }

  // src/custom-plugins/<Name>/index.ts → "./custom-plugins/<Name>"
  for (const dir of listDirs(path.join(src, "custom-plugins"))) {
    const entry = firstExisting(ENTRY_CANDIDATES.map((f) => path.join(src, "custom-plugins", dir, f)));
    if (entry) entries[`custom-plugins/${dir}`] = `src/custom-plugins/${dir}/${path.basename(entry)}`;
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
