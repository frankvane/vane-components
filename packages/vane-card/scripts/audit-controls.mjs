#!/usr/bin/env node
/**
 * 控件体检（真浏览器拨每一个控件，看舞台认不认）
 *
 * 为什么静态检查不够：控件契约（`verify-controls.mjs`）只能证明「Stage 读了 cfg.key」，
 * 证明不了「读了之后真的作用到卡片上」。BadgePlugin 那页就是这么漏掉的 ——
 * 控件声明齐、Stage 也读了 cfg.text、代码块还会跟着变，但舞台纹丝不动：
 * `withPlugins` 产出的组件类型闭包住了第一次创建的那批插件实例，
 * 按「插件名」缓存就等于把配置锁死在初值上。
 *
 * 所以这里不看源码，直接拨控件：
 *   1. 先给卡片的 DOM 节点打一个 expando 标记（`__ctlProbe`）；
 *   2. 把某个控件拨到另一档，等一拍；
 *   3. 重新取 `[data-card-id]`：
 *        - 标记没了 → 节点被换掉 = 装配重建了（配置能生效的正确路径）；
 *        - 标记还在、HTML 也没变 → 拖了等于没拖，判死。
 *
 * 之所以把「HTML 变了」也算过：有些页不靠重建装配，而是换 data / props（评分、库存、图源），
 * 那类只要 DOM 真的变了就算生效。两条任取其一。
 *
 * 用法（需先 build:demo 再起静态服务）：
 *   node scripts/serve-demo.cjs &
 *   PLAYWRIGHT_PATH=file:///E:/react-upload-indexeddb/node_modules/playwright/index.mjs \
 *     node scripts/audit-controls.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const BASE = process.env.AUDIT_BASE ?? "http://127.0.0.1:3301";
const WAIT = Number(process.env.AUDIT_WAIT ?? 900);
const SETTLE = Number(process.env.AUDIT_SETTLE ?? 320);
const PW = process.env.PLAYWRIGHT_PATH ?? "playwright";

const { chromium } = await import(PW);

/**
 * 只改 console 输出、不改 DOM 的控件。
 * `debug` 就是给 CardCore 打开内部日志 —— 拖它不该有任何视觉变化，
 * 拿「DOM 变没变」判它必然误报，所以显式放过。
 */
const CONSOLE_ONLY = new Set(["debug"]);

const CATALOG_DIR = path.join(ROOT, "demo/src/demos/catalog");
const slugs = fs
  .readdirSync(CATALOG_DIR)
  .filter((f) => f.endsWith(".tsx"))
  .flatMap((f) => {
    const src = fs.readFileSync(path.join(CATALOG_DIR, f), "utf-8");
    return [...src.matchAll(/slug:\s*"([\w-]+)"/g)].map((m) => m[1]);
  });

/** 在页面里执行：给卡片打标记 + 记下当前 HTML */
function probeStage() {
  const card = document.querySelector("[data-card-stage] [data-card-id]");
  if (!card) return { ok: false, reason: "舞台上没有 [data-card-id]" };
  card.__ctlProbe = true;
  return { ok: true, html: card.outerHTML };
}

/**
 * 在页面里执行：把第 idx 个控件拨到某一端
 * `to = "far"` 拨到与当前值距离更远的一端，`"near"` 拨到另一端。
 * 为什么要分两端：像 lowStockThreshold 这种「只在一个区间里才有视觉差」的控件，
 * 拨到 20 和 10 都是「库存紧张」，只有拨到 1 才看得见变化 —— 只试一端会误判成「拖了不动」。
 */
function turnControl([idx, to]) {
  const label = document.querySelectorAll("[data-ctl]")[idx];
  if (!label) return { ok: false, reason: "控件 " + idx + " 不存在" };
  const key = label.dataset.ctl;
  const kind = label.dataset.kind;
  const before = label.querySelector(".ctl-val")?.textContent ?? "";

  if (kind === "switch") {
    label.querySelector(".ctl-switch")?.click();
    return { ok: true, key, kind, before, after: before === "开" ? "关" : "开" };
  }

  if (kind === "select") {
    const sel = label.querySelector("select");
    const cur = sel.value;
    const next = Array.from(sel.options).find((o) => o.value !== cur);
    if (!next) return { ok: false, key, reason: "只有一个选项，拨不动" };
    // React 受控组件：必须走原型上的 value setter，再派发 change，否则 onChange 不触发
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    setter.call(sel, next.value);
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    return { ok: true, key, kind, before: cur, after: next.value };
  }

  // number → range 滑杆
  const input = label.querySelector('input[type="range"]');
  if (!input) return { ok: false, key, reason: "没有 range 输入" };
  const min = Number(input.min);
  const max = Number(input.max);
  const cur = Number(input.value);
  const far = cur <= (min + max) / 2 ? max : min;
  const near = far === max ? min : max;
  const next = to === "near" ? near : far;
  if (next === cur) return { ok: false, key, reason: "滑杆已经在端点" };
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(input, String(next));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return { ok: true, key, kind, before: cur, after: next };
}

/** 在页面里执行：看卡片有没有重建 / HTML 有没有变 */
function checkStage(before) {
  const card = document.querySelector("[data-card-stage] [data-card-id]");
  if (!card) return { remounted: true, changed: true, note: "卡片消失（条件渲染）" };
  return { remounted: !card.__ctlProbe, changed: card.outerHTML !== before };
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
let checked = 0;
let pagesWithControls = 0;

console.log(`控件体检 ${slugs.length} 个逐项示例（${BASE} · 等待 ${WAIT}ms）\n`);

for (const slug of slugs) {
  await page.goto(`${BASE}/#/demos/${slug}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(WAIT);

  const count = await page.$$eval("[data-ctl]", (els) => els.length);
  if (count === 0) continue;
  pagesWithControls += 1;

  const results = [];
  for (let i = 0; i < count; i += 1) {
    // 每个控件都从「刚进页面」的状态开拨：上一个控件可能把卡片整个关掉了
    // （core-lifecycle 的「挂载」开关），也可能改了别的开关，状态必须复位。
    if (i > 0) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(WAIT);
    }

    let best = null;
    let kindSeen = null;
    // 滑杆最多试两端（switch / select 只有一种「拨法」，第二端没意义）
    for (const to of ["far", "near"]) {
      // 每次从「刚进页面」的状态开拨：控件之间会互相影响（库存 × 阈值），
      // 上一个控件拨过的值留着，就说不清是谁造成的了。
      if (to === "near") {
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForTimeout(WAIT);
      }

      const probe = await page.evaluate(probeStage);
      if (!probe.ok) {
        errors.push(`${slug}：${probe.reason}`);
        break;
      }

      const turn = await page.evaluate(turnControl, [i, to]);
      if (!turn.ok) {
        best = { ok: true, text: `${turn.key ?? `#${i}`} 跳过（${turn.reason}）` };
        break;
      }
      kindSeen = turn.kind;

      await page.waitForTimeout(SETTLE);
      const after = await page.evaluate(checkStage, probe.html);
      const consoleOnly = CONSOLE_ONLY.has(turn.key);
      const ok = consoleOnly || after.remounted || after.changed;
      best = {
        ok,
        text: `${turn.key}: ${turn.before} → ${turn.after}${
          consoleOnly
            ? "  只改 console（不判 DOM）"
            : ok
              ? after.remounted
                ? "  装配已重建"
                : "  卡片内容已变"
              : "  ⚠ 舞台没有任何变化"
        }`,
      };
      if (ok || kindSeen !== "number") break;
    }

    if (!best) continue;
    checked += 1;
    results.push(best);
    if (!best.ok) errors.push(`${slug} · ${best.text.split(":")[0]} 拖了舞台不动`);
  }

  console.log(`· ${slug.padEnd(18)} ${count} 个控件`);
  for (const r of results) console.log(`  ${r.ok ? "✓" : "✗"} ${r.text}`);
}

await browser.close();

if (errors.length) {
  console.error(`\n发现 ${errors.length} 个问题：`);
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}
console.log(
  `\n✓ ${pagesWithControls} 个页面 · ${checked} 个控件全部对舞台生效（重建装配或内容变化）`
);
