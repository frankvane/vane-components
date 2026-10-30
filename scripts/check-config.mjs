#!/usr/bin/env node
/**
 * 配置一致性门禁（P7）。
 *
 * 结构标准化（P0–P5）统一了「插件三件套 / entries 聚合 / demo 范式」，但包级脚手架
 * （vite/vitest/tsconfig/eslint/package.json scripts）此前各包各写、逐渐漂移——
 * 表现为：include 不统一（demo 漏检）、vitest 外壳各异、build/test 脚本不一致、
 * profile 缺 sync:exports。本脚本把「该一致的」逐条卡住，防止再漂移。
 *
 * 只卡「脚手架层」；以下差异是功能性的、允许存在：
 *   - vite.config external（core 是否外部化 / 重型依赖 external）
 *   - tsconfig paths（demo 按消费者视角写包名）
 *   - package.json 的 name/description/keywords/exports/vane 体积预算
 *   - README.md / CHANGELOG.md（由 sync-readme / changeset 生成）
 */
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const packagesDir = path.join(root, "packages");

// 非组件包：templates 是模板，plugin-core 是内核基座（无 demo，脚手架层不适用组件包标准）
const NON_COMPONENT_DIRS = new Set(["templates", "plugin-core"]);

// 与 check-packages.mjs 同口径动态扫描：新包自动纳入，避免硬编码清单漏扫造成门禁假绿
const COMPONENT_PKGS = (await readdir(packagesDir, { withFileTypes: true }))
  .filter(
    (d) =>
      d.isDirectory() &&
      !NON_COMPONENT_DIRS.has(d.name) &&
      existsSync(path.join(packagesDir, d.name, "package.json")),
  )
  .map((d) => d.name);

const CANON_INCLUDE = ["src", "src/**/*.json", "test", "demo/src"];
const CANON_ESLINT = `import vane from "@vane/eslint-config";\n\nexport default vane;\n`;
const REQUIRED_SCRIPTS = {
  dev: "vite --config demo/vite.config.ts",
  build: "vite build --mode lib",
  "build:demo": "vite build --config demo/vite.config.ts",
  typecheck: "tsc --noEmit -p tsconfig.json",
  test: "vitest run",
  lint: "eslint .",
  "sync:exports": "node ../../scripts/sync-exports.mjs",
};

const results = [];
let failed = 0;
function record(pkg, level, message) {
  results.push({ pkg, level, message });
  if (level === "FAIL") failed += 1;
}

const norm = (s) => s.replace(/\s+/g, "");

function extractInclude(text) {
  const m = text.match(/"include"\s*:\s*\[([^\]]*)\]/);
  if (!m) return null;
  return m[1]
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

for (const name of COMPONENT_PKGS) {
  const base = path.join(packagesDir, name);
  if (!existsSync(base)) continue;

  // 1) eslint.config.js 内容一致
  const eslintPath = path.join(base, "eslint.config.js");
  if (existsSync(eslintPath)) {
    const got = norm(await readFile(eslintPath, "utf-8"));
    if (got !== norm(CANON_ESLINT)) record(name, "FAIL", "eslint.config.js 与标准不一致");
    else record(name, "PASS", "eslint 一致");
  } else {
    record(name, "FAIL", "缺少 eslint.config.js");
  }

  // 2) tsconfig include 一致
  const tscPath = path.join(base, "tsconfig.json");
  if (existsSync(tscPath)) {
    const inc = extractInclude(await readFile(tscPath, "utf-8"));
    if (!inc) record(name, "FAIL", "tsconfig 缺少 include");
    else if (inc.join(",") !== CANON_INCLUDE.join(","))
      record(name, "FAIL", `tsconfig include 不一致：${JSON.stringify(inc)}`);
    else record(name, "PASS", "tsconfig include 一致");
  }

  // 3) vitest 外壳使用 createVitestConfig + happy-dom
  const vitestPath = path.join(base, "vitest.config.ts");
  if (existsSync(vitestPath)) {
    const got = await readFile(vitestPath, "utf-8");
    if (/createVitestConfig\s*\(\s*\{\s*environment:\s*"happy-dom"\s*\}\s*\)/.test(got) && /from\s*"@vane\/vitest-config"/.test(got)) {
      record(name, "PASS", "vitest 外壳标准");
    } else {
      record(name, "FAIL", "vitest.config.ts 未使用 createVitestConfig({environment:'happy-dom'})");
    }
  }

  // 4) vite 外壳使用 createLibConfig + publicDir:false
  const vitePath = path.join(base, "vite.config.ts");
  if (existsSync(vitePath)) {
    const got = await readFile(vitePath, "utf-8");
    if (/createLibConfig\s*\(/.test(got) && /publicDir:\s*false/.test(got)) {
      record(name, "PASS", "vite 外壳标准");
    } else {
      record(name, "FAIL", "vite.config.ts 未遵循标准外壳（createLibConfig + publicDir:false）");
    }
  }

  // 5) package.json scripts 一致
  const pjPath = path.join(base, "package.json");
  if (existsSync(pjPath)) {
    const pj = JSON.parse(await readFile(pjPath, "utf-8"));
    const scripts = pj.scripts ?? {};
    const bad = [];
    for (const [key, expected] of Object.entries(REQUIRED_SCRIPTS)) {
      if (!(key in scripts)) bad.push(`缺 ${key}`);
      else if (scripts[key] !== expected) bad.push(`${key}="${scripts[key]}"（应为 "${expected}"）`);
    }
    if (bad.length) record(name, "FAIL", `scripts 不一致：${bad.join("；")}`);
    else record(name, "PASS", "scripts 一致");
  }
}

const width = Math.max(...results.map((r) => r.pkg.length), 12);
for (const r of results) {
  const icon = r.level === "FAIL" ? "✗" : "·";
  console.log(`${icon} ${r.pkg.padEnd(width)}  ${r.message}`);
}

if (failed > 0) {
  console.error(`\n${failed} 项配置不一致，请统一后再提交。`);
  process.exit(1);
}
console.log("\n配置一致性检查通过。");
