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

  const pkg = JSON.parse(await readFile(path.join(packagesDir, dir, "package.json"), "utf-8"));
  const pluginDirs = (await readdir(customDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .sort();

  const rows = [];
  for (const pd of pluginDirs) {
    const docFile = path.join(customDir, pd.name, "doc.json");
    if (!existsSync(docFile)) continue;
    const doc = await readDocJson(docFile);
    if (!doc) continue;
    rows.push(
      `| [${doc.name}](./${pd.name}) | ${doc.description} | ${configCell(doc.config)} | ${doc.since ?? "-"} | ${(doc.tags ?? []).join(", ")} |`
    );
  }

  if (rows.length === 0) continue;
  total += rows.length;

  const table = [
    "| 插件 | 说明 | 配置 | 引入版本 | 标签 |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");

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
  const next = `${content.slice(0, start)}${BEGIN}\n${table}\n${END}${content.slice(end + END.length)}`;
  await writeFile(docFile, next, "utf-8");
  console.log(`${pkg.name}: ${rows.length} 个插件已写入 plugins.md`);
}

console.log(`\n共处理 ${total} 个插件。`);
