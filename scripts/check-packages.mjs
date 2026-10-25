#!/usr/bin/env node
/**
 * 包卫生检查（CI 必过）。
 * 检查项：
 *   1. react / react-dom 只在 peerDependencies，不进 dependencies
 *   2. 必须存在 exports 且 "." 带 types + import
 *   3. sideEffects === false
 *   4. files 包含 dist
 *   5. README 首屏必须出现 npm install <pkg>
 *   6. dist 存在时检查 gzip 体积是否超过预算（package.json 的 vane.sizeBudgetKb，默认 12KB）
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const packagesDir = path.join(root, "packages");

const results = [];
let failed = 0;

function record(pkg, level, message) {
  results.push({ pkg, level, message });
  if (level === "FAIL") failed += 1;
}

const dirs = (await readdir(packagesDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && d.name !== "templates")
  .map((d) => d.name);

for (const dir of dirs) {
  const pkgPath = path.join(packagesDir, dir, "package.json");
  if (!existsSync(pkgPath)) continue;
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  const deps = Object.keys(pkg.dependencies ?? {});
  const peers = Object.keys(pkg.peerDependencies ?? {});

  if (deps.includes("react") || deps.includes("react-dom")) {
    record(pkg.name, "FAIL", "react/react-dom 出现在 dependencies，必须移到 peerDependencies");
  }
  if (!peers.includes("react")) {
    record(pkg.name, "FAIL", "peerDependencies 缺少 react");
  }
  if (!pkg.exports?.["."]) {
    record(pkg.name, "FAIL", '缺少 exports["."]');
  } else {
    const dot = pkg.exports["."];
    if (!dot.types || !dot.import) record(pkg.name, "FAIL", 'exports["."] 缺少 types 或 import');
  }
  if (pkg.sideEffects !== false) {
    record(pkg.name, "WARN", "sideEffects 不是 false，tree-shaking 会受影响");
  }
  if (!Array.isArray(pkg.files) || !pkg.files.includes("dist")) {
    record(pkg.name, "WARN", "files 未包含 dist");
  }

  const readmePath = path.join(packagesDir, dir, "README.md");
  if (!existsSync(readmePath)) {
    record(pkg.name, "WARN", "缺少 README.md（可跑 pnpm docs:sync 生成）");
  } else {
    const readme = await readFile(readmePath, "utf-8");
    if (!readme.includes(`npm install ${pkg.name}`)) {
      record(pkg.name, "FAIL", `README 首屏缺少 "npm install ${pkg.name}"`);
    }
  }

  // 体积预算
  const budgetKb = pkg.vane?.sizeBudgetKb ?? 12;
  const entry = path.join(packagesDir, dir, "dist", "index.js");
  if (existsSync(entry)) {
    const raw = await readFile(entry);
    const gz = gzipSync(raw).length / 1024;
    if (gz > budgetKb) {
      record(pkg.name, "FAIL", `dist/index.js gzip ${gz.toFixed(1)}KB 超过预算 ${budgetKb}KB`);
    } else {
      record(pkg.name, "PASS", `gzip ${gz.toFixed(1)}KB / 预算 ${budgetKb}KB`);
    }
  }
}

const width = Math.max(...results.map((r) => r.pkg.length), 10);
for (const r of results) {
  const icon = r.level === "FAIL" ? "✗" : r.level === "WARN" ? "!" : "·";
  console.log(`${icon} ${r.pkg.padEnd(width)}  ${r.message}`);
}

if (failed > 0) {
  console.error(`\n${failed} 项 FAIL，请修复后再发布。`);
  process.exit(1);
}
console.log("\n包卫生检查通过。");
