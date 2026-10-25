import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * 入口自动发现（构建配置与发布脚本共用同一份实现，避免两边漂移）。
 *
 * 约定：源码路径 == 发布子路径
 *   src/index.ts                   → "."                 → dist/index.js
 *   src/entries/core.ts            → "./core"            → dist/core.js
 *   src/custom-plugins/X/index.ts  → "./custom-plugins/X" → dist/custom-plugins/X.js
 */
export function discoverEntries(root) {
  const src = path.join(root, "src");
  const entries = {};

  if (existsSync(path.join(src, "index.ts"))) entries.index = "src/index.ts";

  const entriesDir = path.join(src, "entries");
  if (existsSync(entriesDir)) {
    for (const file of readdirSync(entriesDir)) {
      if (file.endsWith(".ts")) entries[file.replace(/\.ts$/, "")] = `src/entries/${file}`;
    }
  }

  for (const dir of listDirs(path.join(src, "custom-plugins"))) {
    const entry = path.join(src, "custom-plugins", dir, "index.ts");
    if (existsSync(entry)) entries[`custom-plugins/${dir}`] = `src/custom-plugins/${dir}/index.ts`;
  }

  for (const comp of listDirs(path.join(src, "components"))) {
    const compound = path.join(src, "components", comp, "compound", "index.ts");
    if (existsSync(compound)) entries.compound = `src/components/${comp}/compound/index.ts`;
  }

  return entries;
}

/** 由入口表生成 package.json 的 exports 字段 */
export function generateExports(root) {
  const entries = discoverEntries(root);
  const customKeys = Object.keys(entries).filter((k) => k.startsWith("custom-plugins/"));

  const exportsMap = {
    ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
  };

  if (customKeys.length > 0) {
    exportsMap["./custom-plugins/*"] = {
      types: "./dist/custom-plugins/*/index.d.ts",
      import: "./dist/custom-plugins/*/index.js",
    };
  }

  for (const key of Object.keys(entries)) {
    if (key === "index") continue;
    exportsMap[`./${key}`] = {
      types: key.includes("/") ? `./dist/${key}/index.d.ts` : `./dist/${key}.d.ts`,
      import: key.includes("/") ? `./dist/${key}/index.js` : `./dist/${key}.js`,
    };
  }

  if (existsSync(path.join(root, "src", "styles"))) {
    exportsMap["./style.css"] = "./dist/style.css";
  }

  return exportsMap;
}

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}
