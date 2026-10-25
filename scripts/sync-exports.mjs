#!/usr/bin/env node
/**
 * 把自动发现的入口写回各组件包的 package.json exports。
 * 用法: pnpm sync:exports   （新增/删除插件后必须跑一次）
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateExports } from "../internal/build-config/discover-entries.mjs";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const packagesDir = path.join(root, "packages");

const dirs = (await readdir(packagesDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && d.name !== "templates")
  .map((d) => d.name);

for (const dir of dirs) {
  const pkgPath = path.join(packagesDir, dir, "package.json");
  if (!existsSync(pkgPath)) continue;
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));

  // 只处理发布的库（private: true 的内部包跳过）
  if (pkg.private) continue;
  if (!existsSync(path.join(packagesDir, dir, "src", "index.ts"))) continue;

  const exportsMap = generateExports(path.join(packagesDir, dir));
  pkg.exports = { ...pkg.exports, ...exportsMap };
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
  console.log(`${pkg.name}: exports 已同步（${Object.keys(exportsMap).length} 个子路径）`);
}
