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
import { existsSync, readFileSync } from "node:fs";
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

/**
 * sideEffects 的两种合法写法：
 *   false                —— 纯 JS 包
 *   ["**\/*.css"]        —— 带样式文件的包：CSS 本身有副作用，声明成 false 会被
 *                           webpack/Rspack 在生产构建里把 `import "pkg/style.css"` 整条摇掉。
 * 其余写法（true / 混入 JS 的数组）都算问题。
 */
function isSideEffectFree(value) {
  if (value === false) return true;
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every((pattern) => typeof pattern === "string" && pattern.includes(".css"));
}

/** 递归收集 dist 下所有 .js（全量并集口径用） */
async function collectJs(dir, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await collectJs(full, acc);
    else if (full.endsWith(".js")) acc.push(full);
  }
  return acc;
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
  if (!isSideEffectFree(pkg.sideEffects)) {
    record(pkg.name, "WARN", "sideEffects 不是 false（也不是仅豁免 *.css 的数组），tree-shaking 会受影响");
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

  // 体积预算：入口 + 其静态引入的 chunk（多入口构建下 rollup 会拆出共享 chunk，
  // 只量 index.js 会严重低估真实导入成本）
  const budgetKb = pkg.vane?.sizeBudgetKb ?? 12;
  const entry = path.join(packagesDir, dir, "dist", "index.js");
  if (existsSync(entry)) {
    // 去重：入口可能用多条 import 语句引用同一个 chunk（rollup 把来自不同源文件的
    // 同名导出拆成多条 import），运行时该 chunk 只加载一次，重复计入会高估真实体积。
    const files = new Set([entry]);
    const source = await readFile(entry, "utf-8");
    for (const m of source.matchAll(/from\s*["'](\.\/chunks\/[^"']+\.js)["']/g)) {
      const chunk = path.join(packagesDir, dir, "dist", m[1].replace(/^\.\//, ""));
      if (existsSync(chunk)) files.add(chunk);
    }
    const gz =
      [...files].reduce((sum, f) => sum + gzipSync(readFileSync(f)).length, 0) / 1024;
    if (gz > budgetKb) {
      record(pkg.name, "FAIL", `入口导入图 gzip ${gz.toFixed(1)}KB 超过预算 ${budgetKb}KB`);
    } else {
      record(pkg.name, "PASS", `入口导入图 gzip ${gz.toFixed(1)}KB / 预算 ${budgetKb}KB`);
    }
  }

  // 子路径 core 预算（可选，vane.coreSizeBudgetKb）：只量 dist/core.js 这一支。
  // 「只要内核、插件自己写」是最轻的用法，得单独有条线，否则会被根入口的余量掩盖。
  const coreBudgetKb = pkg.vane?.coreSizeBudgetKb;
  const coreEntry = path.join(packagesDir, dir, "dist", "core.js");
  if (typeof coreBudgetKb === "number" && existsSync(coreEntry)) {
    const files = new Set([coreEntry]);
    const source = await readFile(coreEntry, "utf-8");
    for (const m of source.matchAll(/from\s*["'](\.\/chunks\/[^"']+\.js|\.\/[A-Za-z0-9_.-]+\.js)["']/g)) {
      const chunk = path.join(packagesDir, dir, "dist", m[1].replace(/^\.\//, ""));
      if (existsSync(chunk)) files.add(chunk);
    }
    const gz = [...files].reduce((sum, f) => sum + gzipSync(readFileSync(f)).length, 0) / 1024;
    if (gz > coreBudgetKb) {
      record(pkg.name, "FAIL", `core 子路径 gzip ${gz.toFixed(1)}KB 超过预算 ${coreBudgetKb}KB`);
    } else {
      record(pkg.name, "PASS", `core 子路径 gzip ${gz.toFixed(1)}KB / 预算 ${coreBudgetKb}KB`);
    }
  }

  // 子路径预算（可选，vane.subpathBudgets：{ "./gallery": 14 }）：
  // 递归闭包测量「入口 + 其全部相对引用（含 ../chunks）」，用于守住「新增子特性
  // 不撑大根入口」的承诺（B7）。注意：入口对共享 chunk 的引用可能是 ../chunks/xxx，
  // 不能只匹配 ./chunks/，否则会低估（假 PASS）。
  const subpathBudgets = pkg.vane?.subpathBudgets;
  if (subpathBudgets && typeof subpathBudgets === "object") {
    for (const [sub, subBudgetKb] of Object.entries(subpathBudgets)) {
      if (typeof subBudgetKb !== "number") continue;
      const subEntry = path.join(
        packagesDir,
        dir,
        "dist",
        sub.replace(/^\.\//, ""),
        "index.js"
      );
      if (!existsSync(subEntry)) continue;
      const seen = new Set();
      const collect = (file) => {
        if (seen.has(file)) return;
        seen.add(file);
        if (!existsSync(file)) return;
        const src = readFileSync(file, "utf-8");
        for (const m of src.matchAll(/from\s*["'](\.[^"']+\.js)["']/g)) {
          collect(path.resolve(path.dirname(file), m[1]));
        }
      };
      collect(subEntry);
      const subGz =
        [...seen].reduce(
          (sum, f) => sum + (existsSync(f) ? gzipSync(readFileSync(f)).length : 0),
          0
        ) / 1024;
      if (subGz > subBudgetKb) {
        record(
          pkg.name,
          "FAIL",
          `${sub} 子路径闭包 gzip ${subGz.toFixed(1)}KB 超过预算 ${subBudgetKb}KB`
        );
      } else {
        record(
          pkg.name,
          "PASS",
          `${sub} 子路径闭包 gzip ${subGz.toFixed(1)}KB / 预算 ${subBudgetKb}KB`
        );
      }
    }
  }

  // 全量并集预算（可选，vane.fullSizeBudgetKb）：把 dist 下所有 .js 一起去重压缩。
  // 根入口瘦身之后，「只量入口」已经不能代表「最坏情况」—— 一个把插件和复合组件
  // 全用上的页面，成本接近全量并集。两个口径都设上限，才能同时守住「单卡轻」和
  // 「全量不失控」。
  const fullBudgetKb = pkg.vane?.fullSizeBudgetKb;
  const distDir = path.join(packagesDir, dir, "dist");
  if (typeof fullBudgetKb === "number" && existsSync(distDir)) {
    const all = await collectJs(distDir);
    const gz = gzipSync(Buffer.concat(all.map((f) => readFileSync(f)))).length / 1024;
    if (gz > fullBudgetKb) {
      record(pkg.name, "FAIL", `全量并集 gzip ${gz.toFixed(1)}KB 超过预算 ${fullBudgetKb}KB`);
    } else {
      record(pkg.name, "PASS", `全量并集 gzip ${gz.toFixed(1)}KB / 预算 ${fullBudgetKb}KB`);
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
