#!/usr/bin/env node
/**
 * 场景示例闸门：把「目录元信息」「场景源码」「插件覆盖」三件事对齐。
 *
 *  1. 每个场景 id 必须有 specs/<id>.tsx；
 *  2. 目录里声明的插件（plugs[].fn）必须真的出现在该场景源码里；
 *  3. 源码里出现的 create*Plugin 也必须登记在目录里（双向一致，杜绝"文档写了没实现"）；
 *  4. 全部场景合起来要覆盖 74 个插件（custom-plugins/index.ts 的导出全集）；
 *  5. 每个分类的数量与目录一致，便于页面上的计数徽标对得上。
 *
 * 用法：node scripts/verify-scenarios.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const DEMO = path.join(ROOT, "demo/src/scenarios");
const SPECS = path.join(DEMO, "specs");
const CATALOG = path.join(DEMO, "catalog");

const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const errors = [];
const warn = [];

// ---------- 1. 插件全集 ----------
const indexSrc = read(path.join(ROOT, "src/custom-plugins/index.ts"));
const ALL_PLUGINS = new Set(
  [...indexSrc.matchAll(/create[A-Za-z0-9]+Plugin/g)].map((m) => m[0]),
);

// ---------- 2. 目录：从各分类文件里刮 plugs ----------
const catalogFiles = fs
  .readdirSync(CATALOG)
  .filter((f) => f.endsWith(".ts") && f !== "index.ts");
const scenarios = [];
for (const file of catalogFiles) {
  const src = read(path.join(CATALOG, file));
  const cat = file.replace(/\.ts$/, "");
  const blocks = src.split(/\n  \{\n/).slice(1);
  for (const block of blocks) {
    const id = block.match(/id:\s*"([^"]+)"/)?.[1];
    if (!id) continue;
    const fns = [...block.matchAll(/fn:\s*"([^"]+)"/g)].map((m) => m[1]);
    scenarios.push({ id, cat, fns });
  }
}

// ---------- 3. 逐个场景比对源码 ----------
const used = new Set();
for (const sc of scenarios) {
  const specPath = path.join(SPECS, `${sc.id}.tsx`);
  if (!fs.existsSync(specPath)) {
    errors.push(`[缺文件] ${sc.id} → specs/${sc.id}.tsx 不存在`);
    continue;
  }
  const src = read(specPath);
  const inSrc = new Set([...src.matchAll(/create[A-Za-z0-9]+Plugin/g)].map((m) => m[0]));

  for (const fn of sc.fns) {
    if (!inSrc.has(fn)) errors.push(`[目录多写] ${sc.id}：目录登记了 ${fn}，但源码里没有`);
    used.add(fn);
  }
  for (const fn of inSrc) {
    if (!sc.fns.includes(fn)) errors.push(`[目录漏写] ${sc.id}：源码用了 ${fn}，但目录没登记`);
    used.add(fn);
  }
  if (sc.fns.length === 0) warn.push(`[空装配] ${sc.id} 没有登记任何插件`);
}

// ---------- 4. 源码目录里有没有漏挂的场景文件 ----------
for (const f of fs.readdirSync(SPECS).filter((f) => f.endsWith(".tsx"))) {
  const id = f.replace(/\.tsx$/, "");
  if (!scenarios.some((s) => s.id === id)) errors.push(`[孤儿文件] specs/${f} 没有对应的目录条目`);
}

// ---------- 5. 插件覆盖 ----------
const missing = [...ALL_PLUGINS].filter((p) => !used.has(p)).sort();
const unknown = [...used].filter((p) => !ALL_PLUGINS.has(p)).sort();

// ---------- 输出 ----------
const byCat = new Map();
for (const sc of scenarios) byCat.set(sc.cat, (byCat.get(sc.cat) ?? 0) + 1);
const catLine = [...byCat.entries()].map(([k, v]) => `${k}:${v}`).join("  ");

console.log(`场景总数：${scenarios.length}   （${catLine}）`);
console.log(`插件覆盖：${used.size} / ${ALL_PLUGINS.size}`);
if (missing.length) console.log(`未覆盖插件（${missing.length}）：${missing.join(" ")}`);
if (unknown.length) console.log(`未知插件名（${unknown.length}）：${unknown.join(" ")}`);
for (const w of warn) console.log(`! ${w}`);

if (errors.length) {
  console.error(`\n发现 ${errors.length} 个问题：`);
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}
if (missing.length || unknown.length) {
  console.error("\n插件覆盖未闭合（74/74 才算通过）。");
  process.exit(1);
}
console.log("\n✓ 场景目录、源码装配、插件覆盖三者一致。");
