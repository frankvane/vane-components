#!/usr/bin/env node
/**
 * 新建一个插件式组件：pnpm new vane-xxx [--title "中文标题"] [--desc "一句话描述"]
 *
 * 做的事：
 *  1. 复制 packages/templates/plugin-component → packages/<pkg>
 *  2. 替换占位符（含目录名 __NAME__Plugin → XxxPlugin）
 *  3. 生成 docs/components/<pkg>/ 文档骨架
 */
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const templateDir = path.join(root, "packages", "templates", "plugin-component");

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const pkg = argv.find((a) => !a.startsWith("--") && a !== flag("title") && a !== flag("desc"));

function usage() {
  console.log(`
用法: pnpm new <vane-xxx> [--title "中文标题"] [--desc "一句话描述"]

示例: pnpm new vane-table --title "数据表格" --desc "插件式 React 数据表格"
`);
}

if (!pkg) {
  usage();
  process.exit(1);
}
if (!/^vane-[a-z0-9]+(-[a-z0-9]+)*$/.test(pkg)) {
  console.error(`包名不合法: ${pkg}（需匹配 vane-xxx-yyy）`);
  process.exit(1);
}

const target = path.join(root, "packages", pkg);
if (existsSync(target)) {
  console.error(`已存在: ${target}`);
  process.exit(1);
}

const kebab = pkg.replace(/^vane-/, "");
const pascal = kebab
  .split("-")
  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  .join("");
const umd = `Vane${pascal}`;
const title = flag("title") ?? pascal;
const desc = flag("desc") ?? `${title}（插件式 React 组件）`;

const replacements = {
  __PKG_NAME__: pkg,
  __NAME_KEBAB__: kebab,
  __NAME__: pascal,
  __UMD_NAME__: umd,
  __TITLE__: title,
  __DESC__: desc,
};

function replaceAll(text) {
  let out = text;
  for (const [key, value] of Object.entries(replacements)) out = out.split(key).join(value);
  return out;
}

function mapPath(rel) {
  return replaceAll(rel);
}

async function copyTree(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    // README.md 不复制：组件 README 由 docs:sync 从 docs/components/<pkg>/index.md 生成
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".DS_Store") continue;
    if (entry.name === "README.md") continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, mapPath(entry.name));
    if (entry.isDirectory()) await copyTree(src, dest);
    else await cp(src, dest);
  }
}

async function replaceInTree(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await replaceInTree(full);
      continue;
    }
    if (entry.name.endsWith(".json") || entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".md") || entry.name.endsWith(".html") || entry.name.endsWith(".tpl")) {
      const content = await readFile(full, "utf-8");
      await writeFile(full, replaceAll(content), "utf-8");
    }
  }
}

console.log(`创建 ${pkg} ...`);
await copyTree(templateDir, target);
await replaceInTree(target);

// package.json.tpl → package.json（内容已在 replaceInTree 中替换占位符）
const tplFile = path.join(target, "package.json.tpl");
if (existsSync(tplFile)) {
  await cp(tplFile, path.join(target, "package.json"));
  await rm(tplFile);
}

// 文档骨架
const docsDir = path.join(root, "docs", "components", pkg);
await mkdir(docsDir, { recursive: true });
for (const file of ["index.md", "api.md", "plugins.md", "recipes.md"]) {
  const src = path.join(target, "docs", file);
  if (existsSync(src)) await cp(src, path.join(docsDir, file));
}

console.log(`
完成 ✅
  ${target}
  ${docsDir}

下一步:
  pnpm install
  pnpm --filter ${pkg} dev        # 启动演示站
  pnpm --filter ${pkg} test       # 跑模板自带单测
  pnpm docs:plugins               # 生成插件目录与文档站导航
  pnpm docs:sync                  # 同步 npm README
`);
