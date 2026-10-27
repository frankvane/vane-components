#!/usr/bin/env node
/**
 * 从每个插件的 doc.json 生成：
 *   1. docs/components/<pkg>/plugins.md 的插件目录表（AUTO 标记之间）
 *   2. 控制台插件清单摘要
 *
 * 约定：插件文档是数据（doc.json），不是手写 markdown。
 * 新增插件 → 写 doc.json → 跑本脚本 → 表格和文档站导航自动更新。
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const packagesDir = path.join(root, "packages");

const BEGIN = "<!-- AUTO-GENERATED:BEGIN";
const END = "<!-- AUTO-GENERATED:END -->";

function configCell(config) {
  if (!config || config.length === 0) return "-";
  return config
    .map((c) => `\`${c.name}\`${c.default ? ` = ${c.default}` : ""}`)
    .join("<br/>");
}

/**
 * 从源码里取 priority。
 *
 * 它是「行为」不是「文档」，正文放在 doc.json 里会与实现分叉（改代码忘改文档）。
 * 这里直接读源码字面量：所有插件的 config 都是 `{ priority: N, ... }` 的形式。
 */
async function readPriority(dir) {
  for (const name of ["index.ts", "index.tsx"]) {
    const file = path.join(dir, name);
    if (!existsSync(file)) continue;
    const code = await readFile(file, "utf-8");
    const m = code.match(/\bpriority:\s*(\d+)/);
    if (m) return Number(m[1]);
  }
  return null;
}

/**
 * 找插件目录的 doc.json。
 *
 * 两个位置都要看：多数包的插件在 `src/custom-plugins/<Name>/`，vane-card 的实现
 * 仍在旧位置 `src/components/CardPlugin/custom-plugins/<Name>/`，只在
 * `src/custom-plugins/<Name>/` 放了转发薄壳（没有 doc.json）。
 */
function resolvePluginDir(pkgDir, name) {
  const candidates = [
    path.join(pkgDir, "src", "custom-plugins", name),
    path.join(pkgDir, "src", "components", "CardPlugin", "custom-plugins", name),
  ];
  return candidates.find((dir) => existsSync(path.join(dir, "doc.json"))) ?? null;
}


async function readDocJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf-8"));
  } catch (error) {
    console.warn(`  跳过无法解析的 doc.json: ${file}`, error.message);
    return null;
  }
}

const dirs = (await readdir(packagesDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && d.name !== "templates")
  .map((d) => d.name);

let total = 0;

for (const dir of dirs) {
  const customDir = path.join(packagesDir, dir, "src", "custom-plugins");
  if (!existsSync(customDir)) continue;

  const pkgDir = path.join(packagesDir, dir);
  const pkg = JSON.parse(await readFile(path.join(pkgDir, "package.json"), "utf-8"));
  const pluginDirs = (await readdir(customDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .sort();

  const rows = [];
  for (const pd of pluginDirs) {
    const pluginDir = resolvePluginDir(pkgDir, pd.name);
    if (!pluginDir) continue;
    const doc = await readDocJson(path.join(pluginDir, "doc.json"));
    if (!doc) continue;
    const priority = await readPriority(pluginDir);
    rows.push({
      cells: [
        `[${doc.name}](./${pd.name})`,
        doc.description,
        configCell(doc.config),
        doc.since ?? "-",
        (doc.tags ?? []).join(", "),
      ],
      priority,
    });
  }

  if (rows.length === 0) continue;
  total += rows.length;

  const docFile = path.join(root, "docs", "components", pkg.name, "plugins.md");
  if (!existsSync(docFile)) {
    console.warn(`  ${pkg.name}: 缺少 docs/components/${pkg.name}/plugins.md，跳过`);
    continue;
  }

  const content = await readFile(docFile, "utf-8");
  const start = content.indexOf(BEGIN);
  const end = content.indexOf(END);
  if (start < 0 || end < 0) {
    console.warn(`  ${pkg.name}: plugins.md 缺少 AUTO-GENERATED 标记，跳过`);
    continue;
  }

  // 是否输出 priority 列由标记行决定：
  //   默认          插件 | 说明 | 配置 | 引入版本 | 标签
  //   BEGIN priority 插件 | priority | 说明 | 配置 | 引入版本 | 标签
  // 这样各包文档的列可以不同，而不必为某一包改生成器（vane-card 的排序语义
  // 是 priority/order 双轴，必须把 priority 摆在最显眼处）。
  const markerLine = content.slice(start, content.indexOf("\n", start));
  const withPriority = /\bpriority\b/.test(markerLine);
  const table = [
    withPriority
      ? "| 插件 | priority | 说明 | 配置 | 引入版本 | 标签 |"
      : "| 插件 | 说明 | 配置 | 引入版本 | 标签 |",
    withPriority ? "| --- | --- | --- | --- | --- | --- |" : "| --- | --- | --- | --- | --- |",
    ...rows.map((r) =>
      withPriority
        ? `| ${r.cells[0]} | ${r.priority ?? "-"} | ${r.cells.slice(1).join(" | ")} |`
        : `| ${r.cells.join(" | ")} |`
    ),
  ].join("\n");
  const next = `${content.slice(0, start)}${markerLine}\n${table}\n${END}${content.slice(end + END.length)}`;
  await writeFile(docFile, next, "utf-8");
  console.log(`${pkg.name}: ${rows.length} 个插件已写入 plugins.md`);
}

console.log(`\n共处理 ${total} 个插件。`);
