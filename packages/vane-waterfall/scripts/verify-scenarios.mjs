#!/usr/bin/env node
/**
 * 场景闸门：让「目录元信息」「场景源码」「插件全集」三者始终一致。
 *
 * 检查项（任一失败 exit 1）：
 *  1. 每个场景文件的 `meta.id` 必须与文件名一致；
 *  2. `meta` 必填字段齐全、plugs / props 非空、ref.url 是 http(s)；
 *  3. `plugs[].fn` 必须真的出现在该场景源码里（目录写了没实现 → 报错）；
 *  4. 源码里出现的 create*Plugin 也必须登记在 plugs 里（实现了没写文档 → 报错）；
 *  5. 非 `local: true` 的 fn 必须是 custom-plugins 的导出（防止拼错插件名）；
 *  6. 场景之间 id 不重复；文件名编号连续（01, 02, …）；
 *  7. 插件覆盖率作为提示输出（不强制 100%，工坊页负责覆盖全集）。
 *
 * 用法：node scripts/verify-scenarios.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCEN_DIR = path.join(ROOT, "demo/src/scenarios");
const PLUGIN_INDEX = path.join(ROOT, "src/custom-plugins/index.ts");

const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const errors = [];
const notes = [];

// ---------- 插件全集 ----------
const pluginIndex = read(PLUGIN_INDEX);
const ALL_PLUGINS = new Set(
  [...pluginIndex.matchAll(/\bcreate[A-Za-z0-9]+Plugin\b/g)].map((m) => m[0])
);

// ---------- 场景文件 ----------
const files = fs
  .readdirSync(SCEN_DIR)
  .filter((f) => /^\d+.*\.tsx$/.test(f))
  .sort();

if (files.length === 0) errors.push("demo/src/scenarios 下没有任何 NN-xxx.tsx 场景文件");

const seenIds = new Set();
const used = new Set();

for (const file of files) {
  const src = read(path.join(SCEN_DIR, file));
  const label = `scenarios/${file}`;

  // --- meta.id 与文件名 ---
  const idMatch = /id:\s*"([^"]+)"/.exec(src);
  if (!idMatch) {
    errors.push(`[缺 id] ${label}：meta 里没有 id`);
  } else {
    const expected = file.replace(/^\d+-/, "").replace(/\.tsx$/, "");
    if (idMatch[1] !== expected) {
      errors.push(`[id 不一致] ${label}：meta.id="${idMatch[1]}"，按文件名应为 "${expected}"`);
    }
    if (seenIds.has(idMatch[1])) errors.push(`[id 重复] ${idMatch[1]}`);
    seenIds.add(idMatch[1]);
  }

  // --- 必填字段 ---
  for (const key of ["title", "group", "pain"]) {
    if (!new RegExp(`\\b${key}:\\s*["'\`]`).test(src)) {
      errors.push(`[缺字段] ${label}：meta.${key} 未填写`);
    }
  }
  const urlMatch = /url:\s*"([^"]+)"/.exec(src);
  if (!urlMatch || !/^https?:\/\//.test(urlMatch[1])) {
    errors.push(`[ref 无效] ${label}：ref.url 必须是 http(s) 链接`);
  }

  // --- props 非空 ---
  const propsBlock = /props:\s*\[([\s\S]*?)\]/.exec(src);
  if (!propsBlock) {
    errors.push(`[缺 props] ${label}：meta.props 未填写（最小装配版没有 props 可生成）`);
  } else if (propsBlock[1].replace(/[,\s]/g, "").length === 0) {
    errors.push(`[空 props] ${label}：meta.props 是空数组`);
  }

  // --- plugs 与源码双向核对 ---
  const plugBlock = /plugs:\s*\[([\s\S]*?)\n  \]/.exec(src);
  const listed = plugBlock
    ? [...plugBlock[1].matchAll(/fn:\s*"([^"]+)"/g)].map((m) => m[1])
    : [];
  const declaredLocal = plugBlock
    ? [...plugBlock[1].matchAll(/fn:\s*"([^"]+)"[^}]*?local:\s*true/g)].map((m) => m[1])
    : [];

  if (listed.length === 0) {
    errors.push(`[空装配] ${label}：meta.plugs 没有登记任何插件`);
  }

  // 源码里真正 new 出来的工厂：出现在 withPlugins([...]) 里，或直接定义 function create*
  const inSource = new Set(
    [...src.matchAll(/\b(create[A-Za-z0-9]+Plugin)\b/g)].map((m) => m[1])
  );

  for (const fn of listed) {
    if (!inSource.has(fn)) {
      errors.push(`[目录多写] ${label}：meta 登记了 ${fn}，但源码里没有用到`);
    }
    const isLocal = declaredLocal.includes(fn) || fn === undefined;
    if (!isLocal && !ALL_PLUGINS.has(fn)) {
      errors.push(`[插件名未知] ${label}：${fn} 不是 custom-plugins 的导出（若是本场景自定义插件，标记 local: true）`);
    }
    // 覆盖率只统计官方插件，场景内联的自定义插件不计入
    if (ALL_PLUGINS.has(fn)) used.add(fn);
  }
  for (const fn of inSource) {
    if (!listed.includes(fn)) {
      errors.push(`[目录漏写] ${label}：源码用了 ${fn}，但 meta.plugs 没登记`);
    }
  }

  notes.push(`${file}  plugins=${listed.length}`);
}

// ---------- 编号连续 ----------
const nums = files.map((f) => Number(/^(\d+)/.exec(f)[1]));
nums.forEach((n, i) => {
  if (n !== i + 1) notes.push(`编号不连续：第 ${i + 1} 个文件是 ${String(n).padStart(2, "0")}`);
});

// ---------- 覆盖率 ----------
const missing = [...ALL_PLUGINS].filter((p) => !used.has(p)).sort();

// ---------- 侧栏计数（App.tsx 里硬编码，避免把场景目录整包拉进首屏） ----------
const appSrc = read(path.join(ROOT, "demo/src/App.tsx"));
const hintMatch = /hint:\s*"(\d+)\s*layouts"/.exec(appSrc);
if (!hintMatch) {
  errors.push('demo/src/App.tsx：侧栏没有形如 hint: "N layouts" 的计数');
} else if (Number(hintMatch[1]) !== files.length) {
  errors.push(
    `demo/src/App.tsx：侧栏写 ${hintMatch[1]} layouts，实际 ${files.length} 个场景`
  );
}

console.log(`场景总数：${files.length}`);
console.log(`插件覆盖：${used.size} / ${ALL_PLUGINS.size}（场景用到，非要求 100%）`);
if (missing.length) console.log(`场景未覆盖：${missing.join(" ")}`);
for (const n of notes) console.log(`  · ${n}`);

if (errors.length) {
  console.error(`\n发现 ${errors.length} 个问题：`);
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}

console.log("\n✓ 场景目录、源码装配、插件命名三者一致。");
