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

/**
 * 把「指向同目录 .md 文档」的相对链接重定向到仓库里真实所在的
 * `docs/components/<pkg>/<file>`，使 GitHub / npm 上的 README 链接可解析。
 *
 * 背景：README 由本脚本从 `docs/components/<pkg>/index.md` 拷进
 * `packages/<pkg>/README.md`。文档站（vitepress）直接用 index.md 源，
 * `](api.md)` 指向同目录文档，正常；但同一段被放进包目录后，
 * `](api.md)` 会解析成 `packages/<pkg>/api.md`（该文件根本不存在），
 * GitHub / npm 全部 404。真实文档在 `docs/components/<pkg>/`，故在此改写。
 *
 * 仅改写：无 scheme、不以 `/` 或 `../` 开头、以 `.md` 结尾（可带 `#anchor`）
 * 的链接；绝对链接、图片、`#anchor` 等一律原样保留。幂等：已是 `../` 的不重复改写。
 */
function rewriteDocLinks(body, pkgDir) {
  return body.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (full, text, url) => {
    if (/^(https?:|mailto:|\/\/|\.\.\/|\/)/.test(url)) return full;
    const m = url.match(/^(\.{0,1}\/?)([^)#]+?)(\.md)?(#.*)?$/);
    if (!m) return full;
    const file = m[2] + (m[3] || "");
    const anchor = m[4] || "";
    if (!/\.md$/.test(file)) return full;
    return `[${text}](../../docs/components/${pkgDir}/${file}${anchor})`;
  });
}

const dirs = (await readdir(packagesDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && d.name !== "templates")
  .map((d) => d.name);

for (const dir of dirs) {
  const pkgPath = path.join(packagesDir, dir, "package.json");
  const docPath = path.join(root, "docs", "components", dir, "index.md");
  if (!existsSync(pkgPath) || !existsSync(docPath)) continue;

  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  const body = rewriteDocLinks(await readFile(docPath, "utf-8"), dir);

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
