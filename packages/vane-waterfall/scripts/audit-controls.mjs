#!/usr/bin/env node
/**
 * 控件响应体检（第三道闸门）
 *
 * 为什么需要它：`audit-demos` 只能证明「当前这一帧版式是干净的」，但证明不了
 * 「拖控件真的会变」。3 列排得整整齐齐，可能只是控件压根没接上 —— 那种缺陷
 * 几何完全合法，两张静态体检都抓不到。这里逐页把每个滑杆推到两端，比较逐项指纹
 * （列号 + 位置 + 列宽 + 内容总高 + 已渲染项数），没变化就报出来。
 *
 * 口径：
 *  - 只测 number 滑杆（switch / select 的效果多半是「插件重建一次」，未必改几何）；
 *  - 控件标了 `nonLayout: true` 的跳过（throttleDelay / poolSize / threshold 这类
 *    只影响耗时或渲染条数，本来就不该改版式）；
 *  - 还原一致（↺）单独提示：推到头再拖回来版式回不到基线，多半是测量缓存没刷新。
 *
 * 用法（先起服务）：
 *   AUDIT_BASE=http://127.0.0.1:3300 \
 *   PLAYWRIGHT_PATH=file:///E:/react-upload-indexeddb/node_modules/playwright/index.mjs \
 *     node scripts/audit-controls.mjs [slug...]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const BASE = process.env.AUDIT_BASE ?? "http://127.0.0.1:3300";
const PW = process.env.PLAYWRIGHT_PATH ?? "playwright";
const WAIT = Number(process.env.AUDIT_WAIT ?? 550);

const { chromium } = await import(PW);

const DEMO_DIR = path.join(ROOT, "demo/src/demos");
const files = fs
  .readdirSync(DEMO_DIR)
  .filter((f) => /^\d+.*\.tsx$/.test(f))
  .sort();

/** 从源码里认领「只影响耗时/条数」的控件标签，避免误报 */
function nonLayoutLabels(src) {
  const labels = new Set();
  for (const line of src.split("\n")) {
    if (!/nonLayout:\s*true/.test(line)) continue;
    const m = /label:\s*"([^"]+)"/.exec(line);
    if (m) labels.add(m[1]);
  }
  return labels;
}

const pick = process.argv.slice(2);
const pages = files
  .map((f) => {
    const src = fs.readFileSync(path.join(DEMO_DIR, f), "utf8");
    const slug = /slug:\s*"([^"]+)"/.exec(src)?.[1] ?? f;
    // 开了虚拟化的页面，scrollHeight 会随着「估值高度被实测高度替换」单调变化，
    // 这是正确行为（estimateHeight 的意义就在这），不能当「还原失败」。
    const virtual = /virtualize\s*[:=]/.test(src);
    return { file: f, slug, virtual, skip: nonLayoutLabels(src) };
  })
  .filter((p) => pick.length === 0 || pick.includes(p.slug));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(`${e.message}`));

/** 逐项指纹：只比「几列/多宽」会漏掉「置顶项换列但总高没变」这类变化 */
const GEO_JS = `(() => {
  const box = document.querySelector("[data-vane-waterfall]");
  const items = [...document.querySelectorAll("[data-vane-waterfall] [data-column]")];
  if (!box || items.length === 0) return null;
  const base = box.getBoundingClientRect();
  const rects = items.map((el) => el.getBoundingClientRect());
  const width = Math.round(rects[0].width);
  const lefts = [...new Set(rects.map((r) => Math.round(r.left)))].sort((a, b) => a - b);
  const head = items.slice(0, 12).map((el) => {
    const r = el.getBoundingClientRect();
    return el.dataset.column + "@" + Math.round(r.left - base.left) + "," + Math.round(r.top - base.top + box.scrollTop);
  }).join("|");
  return {
    width,
    gap: lefts.length > 1 ? Math.round(lefts[1] - lefts[0] - width) : null,
    scrollH: box.scrollHeight,
    rendered: items.length,
    head,
  };
})()`;

const readGeo = () => page.evaluate(GEO_JS);

async function setRange(index, value) {
  await page.evaluate(
    ({ index, value }) => {
      const input = document.querySelectorAll(".ctl-range")[index];
      if (!input) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setter.call(input, String(value));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { index, value }
  );
  await page.waitForTimeout(WAIT);
}

const readRange = (index) =>
  page.evaluate((i) => {
    const input = document.querySelectorAll(".ctl-range")[i];
    if (!input) return null;
    const label = input.closest(".ctl")?.querySelector(".ctl-label")?.textContent?.trim() ?? "?";
    return { label, min: Number(input.min), max: Number(input.max), value: Number(input.value) };
  }, index);

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/** 虚拟化页只比「结构」：项数 / 列宽 / 间距 / 前 12 项的列号与坐标，不比内容总高 */
const sameGeometry = (a, b, ignoreHeight) => {
  if (!ignoreHeight) return same(a, b);
  const strip = (o) => (o ? { ...o, scrollH: 0 } : o);
  return same(strip(a), strip(b));
};
const failures = [];
const notes = [];
let checked = 0;
let skipped = 0;

await page.goto(`${BASE}/demo/index.html#/demo/${pages[0]?.slug ?? "basic"}`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(1200);

for (const { slug, skip, virtual } of pages) {
  await page.evaluate((s) => {
    location.hash = `#/demo/${s}`;
  }, slug);
  await page.waitForSelector("[data-vane-waterfall]", { timeout: 15000 });
  await page.waitForTimeout(1200);

  const n = await page.evaluate(() => document.querySelectorAll(".ctl-range").length);
  const dead = [];
  const unstable = [];

  for (let i = 0; i < n; i++) {
    const info = await readRange(i);
    if (!info) continue;
    // 标签文本形如「列数3」（label + 当前值），用前缀比对源码里的 label
    const hit = [...skip].find((k) => info.label.startsWith(k));
    if (hit) {
      skipped += 1;
      continue;
    }

    const base = await readGeo();
    await setRange(i, info.max);
    const atMax = await readGeo();
    await setRange(i, info.min);
    const atMin = await readGeo();
    await setRange(i, info.value);
    const restored = await readGeo();
    checked += 1;

    if (same(base, atMax) && same(base, atMin)) dead.push(info.label);
    // 还原一致性：虚拟化页忽略内容总高（实测高度替换估值会让它变大）
    else if (!sameGeometry(base, restored, virtual)) unstable.push(info.label);
  }

  const mark = dead.length === 0 ? "✓" : "✗";
  console.log(`${mark} ${slug}${dead.length ? `  无响应：${dead.join(" / ")}` : ""}`);
  if (dead.length) failures.push(`${slug}: ${dead.join(" / ")}`);
  if (unstable.length) notes.push(`${slug}: ${unstable.join(" / ")}`);
}

await browser.close();

if (notes.length) {
  console.log(`\n还原不一致（拖回原值后版式未回到基线，检查测量缓存）：\n- ${notes.join("\n- ")}`);
}
if (pageErrors.length) {
  console.log(`\n页面报错：\n- ${[...new Set(pageErrors)].join("\n- ")}`);
}

console.log(
  `\n检查了 ${checked} 个滑杆（跳过 ${skipped} 个标记为 nonLayout 的），${
    failures.length === 0 ? "全部能改变版式。" : `${failures.length} 页有控件无响应。`
  }`
);
process.exit(failures.length === 0 && pageErrors.length === 0 ? 0 : 1);
