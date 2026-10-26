#!/usr/bin/env node
/**
 * 逐页几何体检（34 个示例页 + 3 个其它页）
 *
 * 为什么需要它：单测只能验纯函数（computeLayout），插件勾稽起来之后的坏味道全在几何上 ——
 * 卡片叠在一起、越出容器、某列为空、scrollHeight 盖不住内容底边。这些必须用真浏览器量。
 *
 * 断言规则与页面内 `demo/src/lib/audit.ts` 完全一致（这里内联了一份，脚本不依赖 TS 构建）：
 *   negative   x < -1.5
 *   overflow   右边界越过容器
 *   zero-size  宽或高 <= 0
 *   overlap    两两重叠（含跨列）
 *   height     scrollHeight 盖不住内容底边
 *   empty      容器里没有任何已布局的项
 *
 * 用法（需先起静态服务，并指定 playwright 入口）：
 *   node scripts/serve-demo.cjs &
 *   PLAYWRIGHT_PATH=file:///E:/react-upload-indexeddb/node_modules/playwright/index.mjs \
 *     node scripts/audit-demos.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const BASE = process.env.AUDIT_BASE ?? "http://127.0.0.1:3300";
// 首屏要等布局 + TransitionPlugin 的过渡结束；场景页会同时挂 13 个瀑布流，需要更久
const WAIT = Number(process.env.AUDIT_WAIT ?? 1200);
const PW = process.env.PLAYWRIGHT_PATH ?? "playwright";

const { chromium } = await import(PW);

// 从文件名取 slug（与 registry 的排序规则一致）
const DEMO_DIR = path.join(ROOT, "demo/src/demos");
const slugs = fs
  .readdirSync(DEMO_DIR)
  .filter((f) => /^\d+.*\.tsx$/.test(f))
  .sort()
  .map((f) => f.replace(/^\d+-/, "").replace(/\.tsx$/, ""));

const ROUTES = [
  ...slugs.map((s) => `/demo/${s}`),
  "/",
  "/plugins",
  "/scenarios",
];

/** 在页面里跑的体检函数（自包含，不引用外部模块） */
const AUDIT_JS = `(() => {
  const TOL = 1.5;
  const issues = [];
  const translateOf = (el) => {
    const t = getComputedStyle(el).transform;
    if (!t || t === "none") return null;
    const m = /matrix\\(([^)]+)\\)/.exec(t);
    if (!m) return null;
    const p = m[1].split(",").map(Number);
    return { x: p[4], y: p[5] };
  };
  const containers = document.querySelectorAll("[data-vane-waterfall]");
  if (containers.length === 0) return [{ kind: "empty", detail: "页面上没有瀑布流容器" }];
  containers.forEach((box, ci) => {
    const cards = [];
    box.querySelectorAll("[data-index]").forEach((el) => {
      const pos = translateOf(el);
      const w = el.offsetWidth, h = el.offsetHeight;
      if (!pos || w <= 0 || h <= 0) return;
      cards.push({ i: Number(el.dataset.index), x: pos.x, y: pos.y, w, h });
    });
    if (cards.length === 0) {
      issues.push({ kind: "empty", detail: "容器 #" + ci + " 没有任何已布局的项" });
      return;
    }
    const cw = box.clientWidth;
    cards.forEach((b) => {
      if (b.x < -TOL) issues.push({ kind: "negative", detail: "#" + b.i + " x=" + b.x.toFixed(1) });
      if (b.x + b.w > cw + TOL) issues.push({ kind: "overflow", detail: "#" + b.i + " 右 " + (b.x + b.w).toFixed(1) + " > " + cw });
      if (b.w <= 0 || b.h <= 0) issues.push({ kind: "zero-size", detail: "#" + b.i + " " + b.w + "x" + b.h });
    });
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const a = cards[i], b = cards[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox > TOL && oy > TOL) {
          issues.push({ kind: "overlap", detail: "#" + a.i + " 与 #" + b.i + " 重叠 " + ox.toFixed(0) + "x" + oy.toFixed(0) });
        }
      }
    }
    const bottom = Math.max(...cards.map((b) => b.y + b.h));
    if (box.scrollHeight + TOL < bottom) {
      issues.push({ kind: "height", detail: "内容底 " + bottom.toFixed(0) + " > scrollHeight " + box.scrollHeight });
    }
  });
  return issues;
})()`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];

console.log(`体检 ${ROUTES.length} 个页面（${BASE}）\n`);

for (const route of ROUTES) {
  const before = [];
  page.removeAllListeners("pageerror");
  page.on("pageerror", (e) => before.push(String(e.message)));

  await page.goto(`${BASE}/#${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(WAIT);

  const crashed = await page.$(".crash");
  let issues = await page.evaluate(AUDIT_JS);

  // 有命中不立刻判死：页面可能只是还没排完（13 张场景卡同时挂载时尤甚）。
  // 再等一轮复测，只有「复测依然命中」才算真问题 —— 真几何 bug 不会自愈。
  if (issues.length > 0) {
    await page.waitForTimeout(WAIT);
    issues = await page.evaluate(AUDIT_JS);
  }

  const label = route.padEnd(28);
  if (crashed) {
    errors.push(`${route}：页面崩溃（.crash 兜底生效）`);
    console.log(`✗ ${label} 崩溃`);
    continue;
  }
  if (before.length) {
    for (const e of before) errors.push(`${route}：pageerror ${e}`);
  }
  if (issues.length === 0) {
    console.log(`· ${label} 0 命中`);
  } else {
    for (const i of issues) console.log(`✗ ${label} ${i.kind}  ${i.detail}`);
    errors.push(`${route}：${issues.length} 处几何问题`);
  }
}

await browser.close();

if (errors.length) {
  console.error(`\n发现 ${errors.length} 个问题：`);
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}
console.log(`\n✓ ${ROUTES.length} 个页面几何全部干净。`);
