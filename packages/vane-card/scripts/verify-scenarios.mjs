#!/usr/bin/env node
/**
 * 示例静态校验（不需要浏览器、不进 CI 的单测集，属于「文档类一致性」闸门）
 *
 * 校验四件事，全是「人一定会忘」的那种：
 *  1. 场景文件 `NN-slug.tsx` 的 `meta.id` 必须等于去掉序号的文件名 —— 否则侧栏锚点与 URL 对不上；
 *  2. 编号从 01 起连续，不缺号；
 *  3. `meta.plugs` 与源码**双向**一致：写了插件却没 import、或 import 了却不在 meta 里，都算错；
 *  4. 22 个官方插件每个都至少有一页逐项示例（`meta.plugin`），一个不漏。
 *
 * 用法：node scripts/verify-scenarios.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCEN_DIR = path.join(ROOT, "demo/src/scenarios");
const DEMO_DIR = path.join(ROOT, "demo/src/demos/catalog");
const PLUGIN_DIR = path.join(ROOT, "src/components/CardPlugin/custom-plugins");

const problems = [];
const fail = (msg) => problems.push(msg);

// ---------- 1 & 2：文件名、id、编号 ----------
const files = fs
  .readdirSync(SCEN_DIR)
  .filter((f) => /^\d+-.*\.tsx$/.test(f))
  .sort();

if (files.length === 0) fail("scenarios 目录里没有任何 NN-*.tsx");

files.forEach((file, i) => {
  const expectNo = String(i + 1).padStart(2, "0");
  const actualNo = file.slice(0, 2);
  if (actualNo !== expectNo) fail(`${file}：编号不连续，应为 ${expectNo}`);
  const slug = file.replace(/^\d+-/, "").replace(/\.tsx$/, "");
  const src = fs.readFileSync(path.join(SCEN_DIR, file), "utf-8");
  const id = /id:\s*"([\w-]+)"/.exec(src)?.[1];
  if (id !== slug) fail(`${file}：meta.id 是 "${id}"，应等于文件名 "${slug}"`);
});

// ---------- 3：plugs ↔ 源码双向 ----------
/** 允许出现在源码里、但不算「官方插件」的局部插件 */
const LOCAL_OK = new Set(["createBusLogger", "createProbe", "createLocalPlugin"]);

for (const file of files) {
  const src = fs.readFileSync(path.join(SCEN_DIR, file), "utf-8");
  const metaBlock = src.slice(src.indexOf("export const meta"), src.indexOf("export default"));

  const declared = [...metaBlock.matchAll(/fn:\s*"([\w]+)"/g)].map((m) => m[1]);
  const used = [...new Set([...src.matchAll(/\b(create[A-Z]\w+Plugin|createBusLogger)\b/g)].map((m) => m[1]))]
    // 去掉 import 行里出现但没被调用的（后面会用「调用点」再核一次）
    .filter((fn) => new RegExp(`${fn}\\s*\\(`).test(src))
    .filter((fn) => !LOCAL_OK.has(fn) || declared.includes(fn));

  for (const fn of used) {
    if (!declared.includes(fn)) fail(`${file}：源码调用了 ${fn}()，但 meta.plugs 里没登记`);
  }
  for (const fn of declared) {
    if (!used.includes(fn)) fail(`${file}：meta.plugs 声明了 ${fn}，但源码里没调用`);
  }
}

// ---------- 4：22 个插件都有逐项示例 ----------
const pluginDirs = fs
  .readdirSync(PLUGIN_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const demoFiles = fs.readdirSync(DEMO_DIR).filter((f) => f.endsWith(".tsx"));
const demoSource = demoFiles.map((f) => fs.readFileSync(path.join(DEMO_DIR, f), "utf-8")).join("\n");

const covered = new Set(
  [...demoSource.matchAll(/plugin:\s*"([\w]+)"/g)].map((m) => m[1])
);

for (const dir of pluginDirs) {
  if (!covered.has(dir)) fail(`插件 ${dir} 没有逐项示例（demo/src/demos/catalog/*.tsx 里缺 plugin: "${dir}"）`);
}

const slugs = [...demoSource.matchAll(/slug:\s*"([\w-]+)"/g)].map((m) => m[1]);
const dupSlug = slugs.filter((s, i) => slugs.indexOf(s) !== i);
if (dupSlug.length) fail(`示例 slug 重复：${[...new Set(dupSlug)].join(", ")}`);

// ---------- 汇总 ----------
const total = files.length;
console.log(`场景 ${total} 个 · 插件 ${pluginDirs.length} 个 · 逐项示例 ${slugs.length} 页`);
console.log(`插件覆盖 ${covered.size}/${pluginDirs.length}`);

if (problems.length) {
  console.error(`\n发现 ${problems.length} 个问题：`);
  for (const p of problems) console.error(" - " + p);
  process.exit(1);
}
console.log("\n✓ 场景编号 / id / plugs 双向 / 插件覆盖 全部通过。");
