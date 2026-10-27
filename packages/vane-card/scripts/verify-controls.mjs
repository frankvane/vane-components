#!/usr/bin/env node
/**
 * 控件契约静态体检
 *
 * 示例页对读者的承诺是「拖控件 = 改代码 = 舞台跟着变」。这三件事分别由三处代码
 * 承载，任何一处漏了都不会报错，只会「看起来能点、其实没反应」：
 *
 *   controls[].key  —— 控件声明（用户能拖的东西）
 *   {{key}}         —— 代码块里的占位（拖了代码要变）
 *   cfg.key         —— 舞台里真的读了它（拖了卡片要变）
 *
 * 所以这里做三条双向断言：
 *   1. 每个控件 key 必须在 Stage 里被读到     —— 否则就是 BadgePlugin 那种「拖了舞台不动」
 *   2. Stage 读的每个 cfg.key 必须有控件声明   —— 否则读到 undefined，静默错
 *   3. 代码里的每个 {{key}} 必须有对应控件     —— 否则代码块原样打印 `{{max}}`
 *
 * 第 4 条只是提示（不失败）：控件改了舞台但代码块里没体现，读者看不出「拖的是哪个参数」。
 *
 * 用法：node scripts/verify-controls.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const CATALOG_DIR = path.join(ROOT, "demo/src/demos/catalog");

/** 改了舞台、但不该出现在装配代码里的控件（都是「换数据 / 换 key / 条件渲染」而不是「换配置」） */
const ALLOW_NOT_IN_CODE = new Set([
  "replay", // 只当 React key 用：切换即重挂
  "mounted", // 条件渲染整张卡（挂上 / 卸下），不是 prop
  "source", // 换 data.image（图源），不是插件配置
  "inventory", // 换 data.inventory
  "stock", // 换 data.inventory
  "rating", // 换 data.rating
]);

const files = fs
  .readdirSync(CATALOG_DIR)
  .filter((f) => f.endsWith(".tsx"))
  .sort();

const errors = [];
const warns = [];
let pages = 0;
let controlsTotal = 0;

/** 按 slug 切页：slug 是每页的唯一真相，切出来的块 head=meta / tail=Stage */
function splitPages(src) {
  const marks = [...src.matchAll(/slug:\s*"([\w-]+)"/g)];
  return marks.map((m, i) => {
    const start = m.index;
    const end = i + 1 < marks.length ? marks[i + 1].index : src.length;
    const chunk = src.slice(start, end);
    const stageAt = chunk.indexOf("Stage:");
    return {
      slug: m[1],
      head: stageAt === -1 ? chunk : chunk.slice(0, stageAt),
      tail: stageAt === -1 ? "" : chunk.slice(stageAt),
    };
  });
}

for (const file of files) {
  const src = fs.readFileSync(path.join(CATALOG_DIR, file), "utf-8");
  for (const { slug, head, tail } of splitPages(src)) {
    pages += 1;

    // 控件声明：head 里只有 controls 数组会出现 `key: "xxx"`
    const controls = new Set([...head.matchAll(/key:\s*"([\w-]+)"/g)].map((m) => m[1]));
    // 代码占位：`{{key}}`
    const placeholders = new Set(
      [...head.matchAll(/\{\{\s*([\w-]+)\s*\}\}/g)].map((m) => m[1])
    );
    // 舞台真的读了：（cfg.key / cfg["key"]）
    const reads = new Set([
      ...[...tail.matchAll(/cfg\.([\w-]+)/g)].map((m) => m[1]),
      ...[...tail.matchAll(/cfg\[\s*"([\w-]+)"\s*\]/g)].map((m) => m[1]),
    ]);

    controlsTotal += controls.size;

    for (const key of controls) {
      if (!reads.has(key)) {
        errors.push(
          `${file} · ${slug} · 控件「${key}」声明了，但 Stage 里没读它 —— 拖了舞台不会变`
        );
      }
    }
    for (const key of reads) {
      if (!controls.has(key)) {
        errors.push(
          `${file} · ${slug} · Stage 读了 cfg.${key}，但没有声明这个控件 —— 恒为 undefined`
        );
      }
    }
    for (const key of placeholders) {
      if (!controls.has(key)) {
        errors.push(
          `${file} · ${slug} · 代码里写了 {{${key}}} 但没有对应控件 —— 代码块会原样打印它`
        );
      }
    }
    for (const key of controls) {
      if (!placeholders.has(key) && !ALLOW_NOT_IN_CODE.has(key)) {
        warns.push(
          `${file} · ${slug} · 控件「${key}」改了舞台，但装配代码里看不到它（建议写 {{${key}}}）`
        );
      }
    }
  }
}

for (const w of warns) console.log(`  ! ${w}`);

if (errors.length) {
  console.error(`\n✗ 控件契约 ${errors.length} 处不成立：`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✓ 控件契约成立：${pages} 页 · ${controlsTotal} 个控件 · 每个都被舞台读、且与代码占位对齐` +
    (warns.length ? `（${warns.length} 条提示）` : "")
);
