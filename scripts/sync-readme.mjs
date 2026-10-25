#!/usr/bin/env node
/**
 * 文档同步：docs/components/<pkg>/index.md → packages/<pkg>/README.md
 *
 * 规则：
 *  - npm README = 固定首屏头（徽章 + 安装 + 30 秒上手）+ docs 正文
 *  - 只有 docs/components/<pkg>/ 是唯一源，禁止直接手改 packages/<pkg>/README.md
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const packagesDir = path.join(root, "packages");

const dirs = (await readdir(packagesDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && d.name !== "templates")
  .map((d) => d.name);

for (const dir of dirs) {
  const pkgPath = path.join(packagesDir, dir, "package.json");
  const docPath = path.join(root, "docs", "components", dir, "index.md");
  if (!existsSync(pkgPath) || !existsSync(docPath)) continue;

  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  const body = await readFile(docPath, "utf-8");

  const header = [
    `<p align="center">`,
    `  <a href="https://www.npmjs.com/package/${pkg.name}"><img src="https://img.shields.io/npm/v/${pkg.name}.svg" alt="npm version" /></a>`,
    `  <a href="https://www.npmjs.com/package/${pkg.name}"><img src="https://img.shields.io/npm/dm/${pkg.name}.svg" alt="npm downloads" /></a>`,
    `  <a href="https://chinavane.netlify.app/"><img src="https://img.shields.io/badge/demo-online-brightgreen.svg" alt="demo" /></a>`,
    `</p>`,
    ``,
  ].join("\n");

  await writeFile(path.join(packagesDir, dir, "README.md"), `${header}${body}`, "utf-8");
  console.log(`${pkg.name}: README 已同步`);
}
