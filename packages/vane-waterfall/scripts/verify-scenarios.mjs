#!/usr/bin/env node
/**
 * 内容闸门：让「目录元信息」「源码」「插件全集」三者始终一致。
 *
 * 两套内容共用一份脚本，因为它们的一致性要求是同一套：
 *  - `demo/src/scenarios/` 组合场景（一卡多个插件）
 *  - `demo/src/demos/`     逐项示例（一插件一页）
 *
 * 检查项（任一失败 exit 1）：
 *  1. 文件名编号 ↔ `meta.id` / `meta.slug` 必须一致；
 *  2. 必填字段齐全，props / plugs 至少有一个；
 *  3. `plugs[].fn` 必须真的出现在该文件源码里（目录写了没实现 → 报错）；
 *  4. 源码里出现的 create*Plugin 也必须登记在 plugs 里（实现了没写文档 → 报错）；
 *  5. 非 `local: true` 的 fn 必须是 custom-plugins 的真实导出（防止拼错插件名）；
 *  6. 示例页的 `plugin` 必须是真实存在的插件目录，且 **26 个插件每个都要有一页**；
 *  7. 场景侧栏计数 `hint: "N layouts"` 必须与实际场景数一致。
 *
 * 用法：node scripts/verify-scenarios.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCEN_DIR = path.join(ROOT, "demo/src/scenarios");
const DEMO_DIR = path.join(ROOT, "demo/src/demos");
const PLUGIN_INDEX = path.join(ROOT, "src/custom-plugins/index.ts");

const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const errors = [];
const notes = [];

// ---------- 插件全集 ----------
const pluginIndex = read(PLUGIN_INDEX);
const ALL_PLUGINS = new Set(
  [...pluginIndex.matchAll(/\bcreate[A-Za-z0-9]+Plugin\b/g)].map((m) => m[0])
);

const PLUGIN_DIRS = fs
  .readdirSync(path.join(ROOT, "src/custom-plugins"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

/** plugs 与源码双向核对（场景与示例共用） */
function crossCheckPlugins({ src, listed, declaredLocal, label }) {
  const inSource = new Set([...src.matchAll(/\b(create[A-Za-z0-9]+Plugin)\b/g)].map((m) => m[1]));
  for (const fn of listed) {
    if (!inSource.has(fn)) {
      errors.push(`[目录多写] ${label}：meta 登记了 ${fn}，但源码里没有用到`);
    }
    if (!declaredLocal.includes(fn) && !ALL_PLUGINS.has(fn)) {
      errors.push(
        `[插件名未知] ${label}：${fn} 不是 custom-plugins 的导出（自定义插件请标 local: true）`
      );
    }
  }
  for (const fn of inSource) {
    if (!listed.includes(fn)) {
      errors.push(`[目录漏写] ${label}：源码用了 ${fn}，但 meta.plugs 没登记`);
    }
  }
}

// ============================================================
// 一、场景（组合视角）
// ============================================================

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

  crossCheckPlugins({ src, listed, declaredLocal, label });

  // 覆盖率只统计官方插件，场景内联的自定义插件不计入
  for (const fn of listed) if (ALL_PLUGINS.has(fn)) used.add(fn);

  notes.push(`${file}  plugins=${listed.length}`);
}

// ---------- 编号连续 ----------
files
  .map((f) => Number(/^(\d+)/.exec(f)[1]))
  .forEach((n, i) => {
    if (n !== i + 1) notes.push(`编号不连续：第 ${i + 1} 个文件是 ${String(n).padStart(2, "0")}`);
  });

// ---------- 覆盖率 ----------
const missing = [...ALL_PLUGINS].filter((p) => !used.has(p)).sort();

// ---------- 侧栏计数（App.tsx 里硬编码，避免把场景目录整包拉进首屏） ----------
const appSrc = read(path.join(ROOT, "demo/src/App.tsx"));
// 计数只认 /scenarios 那一条，避免撞上 "26 plugins"；单位词（layouts / plates…）随便改，
// 闸门管的是「数字与真实场景数是否一致」，不是文案。
const navEntry = /\{\s*to:\s*"\/scenarios"[\s\S]*?\}/.exec(appSrc);
const hintMatch = navEntry ? /hint:\s*"(\d+)\s*([^"0-9]+)"/.exec(navEntry[0]) : null;
if (!hintMatch) {
  errors.push('demo/src/App.tsx：/scenarios 导航项没有形如 hint: "N plates" 的计数');
} else if (Number(hintMatch[1]) !== files.length) {
  errors.push(
    `demo/src/App.tsx：侧栏写 ${hintMatch[1]} ${hintMatch[2].trim()}，实际 ${files.length} 个场景`
  );
}

// ============================================================
// 二、逐项示例（单点视角）
// 比场景多一条硬要求：26 个官方插件必须每个都有一页独立示例 ——
// 这正是「不能只靠工坊里勾选」的原因。
// ============================================================

const demoFiles = fs
  .readdirSync(DEMO_DIR)
  .filter((f) => /^\d+.*\.tsx$/.test(f))
  .sort();

if (demoFiles.length === 0) errors.push("demo/src/demos 下没有任何 NN-xxx.tsx 示例文件");

const demoSlugs = new Set();
const demoPlugged = new Set();
const demoNotes = [];
const GROUP_OK = new Set(["basic", "advanced", "plugin"]);

for (const file of demoFiles) {
  const src = read(path.join(DEMO_DIR, file));
  const label = `demos/${file}`;
  const expectedSlug = file.replace(/^\d+-/, "").replace(/\.tsx$/, "");

  // --- slug 与文件名 ---
  const slugMatch = /slug:\s*"([^"]+)"/.exec(src);
  if (!slugMatch) {
    errors.push(`[缺 slug] ${label}`);
  } else {
    if (slugMatch[1] !== expectedSlug) {
      errors.push(
        `[slug 不一致] ${label}：meta.slug="${slugMatch[1]}"，按文件名应为 "${expectedSlug}"`
      );
    }
    if (demoSlugs.has(slugMatch[1])) errors.push(`[slug 重复] ${slugMatch[1]}`);
    demoSlugs.add(slugMatch[1]);
  }

  // --- 分组 ---
  const groupMatch = /group:\s*"([^"]+)"/.exec(src);
  if (!groupMatch || !GROUP_OK.has(groupMatch[1])) {
    errors.push(`[分组无效] ${label}：group 必须是 basic / advanced / plugin`);
  }
  const isPluginPage = groupMatch?.[1] === "plugin";

  // --- 必填文案 ---
  for (const key of ["title", "intro", "why"]) {
    if (!new RegExp(`\\b${key}:\\s*["'\`]`).test(src)) {
      errors.push(`[缺字段] ${label}：meta.${key} 未填写`);
    }
  }

  // --- 关联插件 ---
  const pluginMatch = /plugin:\s*"([^"]+)"/.exec(src);
  // 内核能力页（virtualize 这类）不是插件，用 capability 声明，二选一即可
  const capabilityMatch = /capability:\s*"([^"]+)"/.exec(src);
  if (isPluginPage && !pluginMatch && !capabilityMatch) {
    errors.push(
      `[缺 plugin] ${label}：插件页必须声明 plugin: "<插件目录名>"（内核能力页则声明 capability）`
    );
  }
  if (pluginMatch) {
    const dir = pluginMatch[1];
    if (!PLUGIN_DIRS.includes(dir)) {
      errors.push(`[插件目录不存在] ${label}：src/custom-plugins/${dir} 不存在`);
    } else {
      demoPlugged.add(dir);
    }
  }

  // --- props / plugs 至少有一个 ---
  const propsBlock = /props:\s*\[([\s\S]*?)\n  \]/.exec(src);
  const plugBlock = /plugs:\s*\[([\s\S]*?)\n  \]/.exec(src);
  const listed = plugBlock
    ? [...plugBlock[1].matchAll(/fn:\s*"([^"]+)"/g)].map((m) => m[1])
    : [];
  const declaredLocal = plugBlock
    ? [...plugBlock[1].matchAll(/fn:\s*"([^"]+)"[^}]*?local:\s*true/g)].map((m) => m[1])
    : [];
  const hasProps = propsBlock ? propsBlock[1].replace(/[,\s]/g, "").length > 0 : false;
  if (listed.length === 0 && !hasProps) {
    errors.push(`[空示例] ${label}：meta.props 与 meta.plugs 都是空的`);
  }

  // --- plugs 与源码双向核对 ---
  crossCheckPlugins({ src, listed, declaredLocal, label });

  // --- 控件必须给初值（否则页面一进来 cfg 是空的）---
  const ctlBlock = /controls:\s*\[([\s\S]*?)\n  \]/.exec(src);
  if (ctlBlock && !/init:/.test(ctlBlock[1])) {
    errors.push(`[控件缺初值] ${label}：controls 里没有 init`);
  }

  demoNotes.push(`${file}  plugs=${listed.length}`);
}

// ---------- 编号连续 ----------
demoFiles
  .map((f) => Number(/^(\d+)/.exec(f)[1]))
  .forEach((n, i) => {
    if (n !== i + 1) {
      demoNotes.push(`编号不连续：第 ${i + 1} 个文件是 ${String(n).padStart(2, "0")}`);
    }
  });

// ---------- 每个官方插件都要有独立示例页 ----------
const demoMissing = PLUGIN_DIRS.filter((d) => !demoPlugged.has(d)).sort();
if (demoMissing.length) {
  errors.push(`[覆盖不足] 这些插件还没有独立示例页：${demoMissing.join(" ")}`);
}

// ---------- 输出 ----------
console.log(`场景总数：${files.length}`);
console.log(`插件覆盖：${used.size} / ${ALL_PLUGINS.size}（场景用到，非要求 100%）`);
if (missing.length) console.log(`场景未覆盖：${missing.join(" ")}`);
for (const n of notes) console.log(`  · ${n}`);

console.log(`\n示例总数：${demoFiles.length}`);
console.log(`插件页覆盖：${demoPlugged.size} / ${PLUGIN_DIRS.length}（要求 100%）`);
for (const n of demoNotes) console.log(`  · ${n}`);

if (errors.length) {
  console.error(`\n发现 ${errors.length} 个问题：`);
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}

console.log("\n✓ 场景与示例目录、源码装配、插件命名三者一致。");
