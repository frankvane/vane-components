#!/usr/bin/env node
/**
 * 逐页几何体检（10 个场景页 + 38 个逐项示例 + 总览 + 工坊）
 *
 * 为什么需要它：单测只能验「钩子被调了几次」，插件勾稽起来之后的坏味道全在几何上 ——
 * 卡片被覆盖层挤扁、主图破图、价格区没渲染、卡片宽过舞台。这些必须用真浏览器量。
 *
 * 断言规则与页面内 `demo/src/lib/audit.ts` **完全一致**（这里内联一份，脚本不依赖 TS 构建）：
 *   no-card       块里找不到 [data-card-id]
 *   zero-size     卡片宽或高 <= 0
 *   overflow      卡片越出舞台容器
 *   broken-image  <img> 存在但 naturalWidth === 0
 *   no-content    卡片里没有任何可见文本、也没有可解码的图
 *   no-price      卡片有价格区 class 但尺寸为 0
 *
 * 用法（需先 build:demo 再起静态服务）：
 *   node scripts/serve-demo.cjs &
 *   PLAYWRIGHT_PATH=file:///E:/react-upload-indexeddb/node_modules/playwright/index.mjs \
 *     node scripts/audit-cards.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const BASE = process.env.AUDIT_BASE ?? "http://127.0.0.1:3301";
/** 首屏要等布局 + 图片解码 + 倒计时首帧 */
const WAIT = Number(process.env.AUDIT_WAIT ?? 900);
const VIEW_W = Number(process.env.AUDIT_W ?? 1440);
const PW = process.env.PLAYWRIGHT_PATH ?? "playwright";

const { chromium } = await import(PW);

// slug 从 catalog 源码里读（meta.slug 是唯一真相，不在这里手抄一份）
const CATALOG_DIR = path.join(ROOT, "demo/src/demos/catalog");
const slugs = fs
  .readdirSync(CATALOG_DIR)
  .filter((f) => f.endsWith(".tsx"))
  .flatMap((f) => {
    const src = fs.readFileSync(path.join(CATALOG_DIR, f), "utf-8");
    return [...src.matchAll(/slug:\s*"([\w-]+)"/g)].map((m) => m[1]);
  });

const ROUTES = ["/", "/plugins", "/scenarios", ...slugs.map((s) => `/demos/${s}`)];

/** 在页面里跑的体检函数（自包含，不引用外部模块） */
const AUDIT_JS = `(() => {
  const TOL = 1.5;
  const issues = [];
  const inScroller = (el, stop) => {
    let node = el.parentElement;
    while (node && node !== stop) {
      const ox = getComputedStyle(node).overflowX;
      if (ox === "auto" || ox === "scroll") return true;
      node = node.parentElement;
    }
    return false;
  };
  const blocks = document.querySelectorAll("[data-scenario], [data-demo]");
  if (blocks.length === 0) return [{ kind: "no-card", scope: "page", detail: "页面上没有任何场景/示例块" }];

  blocks.forEach((block) => {
    const scope = block.dataset.scenario || block.dataset.demo || "unknown";
    const cards = block.querySelectorAll("[data-card-id]");
    if (cards.length === 0) {
      issues.push({ kind: "no-card", scope, detail: "块里没有 [data-card-id]" });
      return;
    }
    const stage =
      block.querySelector(".demo-card") ||
      block.querySelector(".scn-stage") ||
      block;

    cards.forEach((card) => {
      const cardId = card.dataset.cardId || "?";
      const r = card.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) {
        issues.push({ kind: "zero-size", scope, detail: "卡片 " + cardId + " 尺寸 " + Math.round(r.width) + "x" + Math.round(r.height) });
        return;
      }
      const s = stage.getBoundingClientRect();
      if (!inScroller(card, stage) && (r.right > s.right + TOL || r.left < s.left - TOL)) {
        issues.push({ kind: "overflow", scope, detail: "卡片 " + cardId + " 右 " + Math.round(r.right) + " > 舞台 " + Math.round(s.right) });
      }
      const imgs = Array.from(card.querySelectorAll("img"));
      imgs.forEach((img) => {
        if (img.complete && img.naturalWidth === 0) {
          issues.push({ kind: "broken-image", scope, detail: "卡片 " + cardId + " 破图 " + (img.currentSrc || img.src).slice(0, 60) });
        }
      });
      const hasImage = imgs.some((img) => img.naturalWidth > 0);
      if (!(card.textContent || "").trim() && !hasImage) {
        issues.push({ kind: "no-content", scope, detail: "卡片 " + cardId + " 没有任何可见内容" });
      }
      const price = card.querySelector(".vc-price, .vc-price__area");
      if (price) {
        const pr = price.getBoundingClientRect();
        if (pr.width <= 0 || pr.height <= 0) {
          issues.push({ kind: "no-price", scope, detail: "卡片 " + cardId + " 价格区被压成 0" });
        }
      }
    });
  });
  return issues;
})()`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: VIEW_W, height: 900 } });
const errors = [];

console.log(`体检 ${ROUTES.length} 个页面（${BASE} · 视口 ${VIEW_W}px）\n`);

for (const route of ROUTES) {
  const pageErrors = [];
  const consoleErrors = [];
  page.removeAllListeners("pageerror");
  page.removeAllListeners("console");
  page.on("pageerror", (e) => pageErrors.push(String(e.message)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto(`${BASE}/#${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(WAIT);

  const crashed = await page.$(".crash");
  let issues = await page.evaluate(AUDIT_JS);

  // 有命中不立刻判死：可能只是还没排完。复测依然命中才算真问题。
  if (issues.length > 0) {
    await page.waitForTimeout(WAIT);
    issues = await page.evaluate(AUDIT_JS);
  }

  const label = route.padEnd(24);
  if (crashed) {
    errors.push(`${route}：页面崩溃（.crash 兜底生效）`);
    console.log(`✗ ${label} 崩溃`);
    continue;
  }
  for (const e of pageErrors) errors.push(`${route}：pageerror ${e}`);
  // 忽略浏览器自动发的媒体解码噪音（离线环境下 <video> 的 ENOENT / 解码提示）
  for (const e of consoleErrors) {
    if (/Failed to load resource|net::ERR|MEDIA_ELEMENT_ERROR/i.test(e)) continue;
    errors.push(`${route}：console.error ${e}`);
  }
  if (issues.length === 0) {
    console.log(`· ${label} 0 命中`);
  } else {
    for (const i of issues) console.log(`✗ ${label} ${i.kind}  [${i.scope}] ${i.detail}`);
    errors.push(`${route}：${issues.length} 处几何问题`);
  }
}

await browser.close();

if (errors.length) {
  console.error(`\n发现 ${errors.length} 个问题：`);
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}
console.log(`\n✓ ${ROUTES.length} 个页面几何全部干净（含 ${slugs.length} 个逐项示例）。`);
