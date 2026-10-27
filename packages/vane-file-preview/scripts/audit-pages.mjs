#!/usr/bin/env node
/**
 * 逐页几何体检（21 个页面 · 40 个块）
 * ----------------------------------------------------------------------------
 * 为什么文件预览必须做这件事：预览器干的是「把外部内容塞进一个固定框」，
 * 而外部内容的尺寸由文件决定 —— PDF 页、docx 分页、表格、iframe 都可能把
 * 容器撑破、或者塌成 0 高。单测跑在 happy-dom 里，没有布局引擎，这些一条都测不出来。
 *
 * 审计单位是**块**而不是**页面**：
 *   17 个逐项页（`[data-demo]`，一页一块）
 * + 17 张工坊卡（`[data-plugin]`，一页 17 块）
 * + 6 个场景    （`[data-scenario]`，一页 6 块，其中两页各挂 2 个预览）
 * = 40 块，这就是验收门里的「40 页」。
 *
 * 判据与 `demo/src/lib/audit.ts` 完全一致（两边刻意各写一份：这边不依赖 TS 构建，
 * 那边能在浏览器里手点复现）：
 *   empty      块里找不到 `.stage-mount`
 *   zero-size  挂载点宽或高 ≤ 1px
 *   overflow   挂载点横向 scrollWidth > clientWidth
 *   no-plugin  挂载点里是 Core 的「没有插件能预览这个文件」（块在、尺寸正常，几何全绿）
 *   squashed   `<audio controls>` 被压扁（< 24px）或被父级裁掉一部分
 *   page-overflow  整页 body 比视口宽（网格被内容顶宽，通常是右栏表格）
 *   lazy       滚到底之后仍有 `.ws-placeholder`（LazyMount 没触发）
 *
 * 纵向溢出**不算问题**：预览正文本来就该能滚。
 *
 * 用法（需先起 demo 服务，两条路都行）：
 *   npm run dev            # vite dev，端口 3302（默认就查这个）
 *   npm run build:demo && npm run serve:demo   # 查构建产物，AUDIT_BASE 指向 3303
 *
 *   PLAYWRIGHT_PATH=file:///E:/react-upload-indexeddb/node_modules/playwright/index.mjs \
 *     node scripts/audit-pages.mjs
 *
 * 环境变量：AUDIT_BASE / AUDIT_WAIT / AUDIT_W / PLAYWRIGHT_PATH / AUDIT_ONLY（子串过滤路由）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
// 用 localhost 而不是 127.0.0.1：vite dev 绑的是 localhost（本机可能解析到 ::1），
// 写死 127.0.0.1 会 ERR_CONNECTION_REFUSED —— 报错看起来像「服务没起」。
const BASE = process.env.AUDIT_BASE ?? "http://localhost:3302";
/** 滚动到底之后还要等多久：epub/docx/pptx/xlsx 各自要解一个 zip */
const WAIT = Number(process.env.AUDIT_WAIT ?? 1500);
const VIEW_W = Number(process.env.AUDIT_W ?? 1440);
const ONLY = process.env.AUDIT_ONLY ?? "";
const PW = process.env.PLAYWRIGHT_PATH ?? "playwright";

const { chromium } = await import(PW);

/**
 * 路由从 demo 文件里读，不从文件名猜。
 * 文件名是 `07-mammoth-docx.tsx`，插件 id 是 `meta.plugin` —— 两者现在恰好相同，
 * 但「恰好相同」写进脚本就是给未来埋一个假绿灯（改了 id 脚本还会照着旧名字去访问，
 * 得到 404 → 白屏 → 也被判成 empty，看起来像页面坏了）。
 */
const DEMO_DIR = path.join(ROOT, "demo/src/demos");
const demoIds = fs
  .readdirSync(DEMO_DIR)
  .filter((f) => /^\d+.*\.tsx$/.test(f))
  .sort()
  .map((f) => {
    const src = fs.readFileSync(path.join(DEMO_DIR, f), "utf8");
    const m = /plugin:\s*["']([^"']+)["']/.exec(src);
    if (!m) throw new Error(`${f} 里找不到 meta.plugin`);
    return m[1];
  });

/**
 * 覆盖闸门（静态，开浏览器之前就能失败）
 *
 * 验收门要求「17 个插件在 demo 里至少装配一次」。这件事在浏览器里其实也会暴露
 * （少一页就少一块，40 块的数对不上），但那时候报的是「块数不符」，
 * 排查要从「哪页少了」倒推。这里直接对着 catalog 的 id 集合比，缺哪个立刻点名。
 *
 * 只认 `id: "…"`（带引号）的行：接口里的 `id: string;` 没有引号，不会混进来。
 */
const CATALOG = path.join(ROOT, "demo/src/data/plugin-catalog.ts");
const catalogIds = [...fs.readFileSync(CATALOG, "utf8").matchAll(/^\s*id:\s*["']([^"']+)["']/gm)].map((m) => m[1]);
if (catalogIds.length === 0) throw new Error(`从 ${CATALOG} 里读不到任何 id，正则失效了`);

const missingDemo = catalogIds.filter((id) => !demoIds.includes(id));
const extraDemo = demoIds.filter((id) => !catalogIds.includes(id));
if (missingDemo.length || extraDemo.length) {
  const lines = [];
  if (missingDemo.length) lines.push(`  缺逐项页：${missingDemo.join(", ")}`);
  if (extraDemo.length) lines.push(`  多出逐项页：${extraDemo.join(", ")}`);
  throw new Error(`逐项页与 catalog 不一一对应（${catalogIds.length} 插件 / ${demoIds.length} 页）\n${lines.join("\n")}`);
}

const ROUTES = [
  { route: "/", expect: 0 },
  { route: "/demos", expect: 0 },
  ...demoIds.map((id) => ({ route: `/demos/${id}`, expect: 1 })),
  { route: "/workshop", expect: demoIds.length },
  { route: "/scenarios", expect: 6 },
];

/**
 * 已知噪声（会打印，但不算失败）。
 *
 * 只有一条，因为实测下来这几条 404 是**同一件事**：epub.js 的归档没建好
 * （`Book.archived === false`），于是 `Book.load()` 不走 `archive.request()`
 * 而回落成 `Book.request()` —— 一个裸 XHR，请求路径相对文档基址。
 *
 * 触发场景：React StrictMode 在开发期双挂载，第一本书被 `destroy()` 之后
 * 仍有一次在途的容器解析，它的 archive 已经没了 → 回落 XHR → 必然 404。
 * 第二次挂载的书正常打开。
 *
 * 验证过的事实（别凭猜）：
 *   · `/demos/epub` 与 `/workshop` 的 epub 卡都**渲染正常**，章节数与 iframe 都在；
 *   · 工坊 idle 8 秒内 `[data-vfp-epub]` 重建 0 次 —— 不是重挂循环；
 *   · 同一本书的两次失败路径不同（`OEBPS/OEBPS/content.opf` / `META-INF/container.xml`），
 *     取决于哪一步先被 resolve，也说明这是「回落」而不是固定逻辑。
 *
 * 所以不算失败；但也不该直接吞掉 —— 打印出来，谁看到都一眼知道出处。
 */
const KNOWN_NOISE = [
  {
    test: /(META-INF\/container\.xml|\.opf\b|\.ncx\b)/,
    why: "epub.js 归档未建立时回落成裸 XHR 抓容器/包描述文件；书本身随后正常渲染（StrictMode 双挂载的副作用）",
  },
];

const isKnownNoise = (line) => KNOWN_NOISE.some((n) => n.test.test(line));

/** 在页面里跑的体检函数（自包含，不引用外部模块） */
const AUDIT_JS = `(() => {
  const TOL = 1;
  const issues = [];
  const BLOCKS = "[data-demo], [data-plugin], [data-scenario]";
  const blocks = Array.from(document.querySelectorAll(BLOCKS));

  // 「没有块」本身不算错：首页和示例目录就是索引页，它们本来就没有预览舞台。
  // 但「页面根本没渲染出来」必须报 —— 那会让所有下游断言都变成假绿灯。
  if (blocks.length === 0) {
    const rendered = document.querySelector("main .page");
    return {
      blocks: 0,
      issues: rendered
        ? []
        : [{ block: "(page)", kind: "empty", detail: "连 main .page 都没有：页面没渲染出来（懒加载失败？）" }],
    };
  }

  const nameOf = (el) => el.dataset.demo || el.dataset.plugin || el.dataset.scenario || el.id || "unknown";

  for (const block of blocks) {
    const name = nameOf(block);
    const mounts = Array.from(block.querySelectorAll(".stage-mount"));
    if (mounts.length === 0) {
      issues.push({ block: name, kind: "empty", detail: "块里没有 .stage-mount" });
      continue;
    }
    for (const mount of mounts) {
      const box = mount.getBoundingClientRect();
      if (box.width <= TOL || box.height <= TOL) {
        issues.push({ block: name, kind: "zero-size", detail: Math.round(box.width) + "×" + Math.round(box.height) });
        continue;
      }
      // 只查横向：预览正文纵向滚动是正常行为
      if (mount.scrollWidth > mount.clientWidth + TOL) {
        issues.push({ block: name, kind: "overflow", detail: "scrollWidth " + mount.scrollWidth + " > clientWidth " + mount.clientWidth });
      }
      // 内容级：尺寸全对但里面没有预览器。只认 Core 那句，
      // 不认 DownloadPlugin 的「没有插件能预览这种格式」（那是兜底插件的正常文案）。
      if (mount.textContent.indexOf("没有插件能预览这个文件") !== -1) {
        issues.push({ block: name, kind: "no-plugin", detail: "挂载点里是 Core 的「没有插件能预览这个文件」" });
      }

      // 原生音频控件：高度由浏览器画（Chrome 54px），一旦被 flex 压缩，
      // 时间轴/按钮会被裁成一条两像素的细线 —— 块和挂载点尺寸全都正常，
      // 上面所有判据都是绿的。实测踩过：逐项页压到 2.1px，工坊卡直接 0。
      for (const media of mount.querySelectorAll("audio[controls]")) {
        const mb = media.getBoundingClientRect();
        if (mb.height < 24) {
          issues.push({ block: name, kind: "squashed", detail: "原生音频控件只剩 " + Math.round(mb.height) + "px 高" });
          continue;
        }
        const visible = Math.min(mb.bottom, box.bottom) - Math.max(mb.top, box.top);
        if (visible < mb.height - TOL) {
          issues.push({
            block: name,
            kind: "squashed",
            detail: "音频控件被裁：可见 " + Math.round(visible) + " / " + Math.round(mb.height) + "px",
          });
        }
      }
    }
  }

  const body = document.body;
  if (body.scrollWidth > window.innerWidth + 2) {
    issues.push({ block: "(page)", kind: "page-overflow", detail: body.scrollWidth + " > " + window.innerWidth });
  }

  // 滚到底之后还在占位 = LazyMount 根本没触发，那不是几何问题，是「卡永远是空的」
  const lazy = document.querySelectorAll(".ws-placeholder").length;
  if (lazy > 0) {
    issues.push({ block: "(page)", kind: "lazy", detail: lazy + " 张卡仍是占位（IntersectionObserver 没触发）" });
  }

  return { blocks: blocks.length, issues };
})()`;

/**
 * 滚一遍全页：工坊 17 张卡靠 IntersectionObserver 延迟挂载，
 * 不滚到它们就不会实例化，量出来的尺寸毫无意义。
 */
const SCROLL_JS = `(async () => {
  const step = Math.max(200, Math.round(window.innerHeight * 0.8));
  const end = document.body.scrollHeight;
  for (let y = 0; y <= end + step; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 70));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 150));
})()`;

const browser = await chromium.launch();
const failures = [];
let totalBlocks = 0;

console.log(`体检 ${ROUTES.length} 个页面（${BASE} · 视口 ${VIEW_W}px）\n`);

for (const { route, expect } of ROUTES) {
  if (ONLY && !route.includes(ONLY)) continue;

  // 每条路由开一个新 page：同文档只改 hash 的导航不会重新等 load，
  // 复用 page 会在懒加载组件还没到时就量尺寸（假阳性白屏）
  const page = await browser.newPage({ viewport: { width: VIEW_W, height: 950 } });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e.message)));
  page.on("console", (m) => {
    if (m.type() !== "error" || /favicon/.test(m.text())) return;
    // 浏览器对资源加载失败只给一句「Failed to load resource: … 404」，不带 URL。
    // 不补地址这条就永远落不进已知噪声（同一件事会被报两遍：response 一遍、
    // console 一遍，后者无法归因）。补上之后两边都能被同一条规则命中。
    const url = m.location()?.url;
    pageErrors.push("console: " + m.text().slice(0, 160) + (url ? ` @ ${url.slice(0, 140)}` : ""));
  });
  // 带上 URL：只报「Failed to load resource: 404」是没法查的
  page.on("response", (r) => {
    if (r.status() >= 400) pageErrors.push(`http ${r.status()} ${r.url().slice(0, 140)}`);
  });

  await page.goto(`${BASE}/demo/index.html#${route}`, { waitUntil: "load" });
  // 等「真正的内容」，而不是等 `.page`：
  //   `/` 和 `/demos` 的根是 `.page`，但 `/demos/:id` 的根是 `<section class="demo">`，
  //   只等 `.page` 会在 17 个详情页上白等满 timeout 再被 catch 吞掉
  //   —— 体检原来跑 7 分钟，大半是这 17×20 秒的空转。
  // 用 state:"attached" 而不是默认的 "visible"：这里要的是「节点在」，
  // 尺寸由后面的几何判据负责，不等可见性。
  await page
    .waitForSelector("main .page, [data-demo], [data-plugin], [data-scenario]", {
      timeout: 20000,
      state: "attached",
    })
    .catch(() => {});
  await page.evaluate(SCROLL_JS).catch(() => {});
  await page.waitForTimeout(WAIT);

  let { blocks, issues } = await page.evaluate(AUDIT_JS);

  // 有命中先复测一次：首屏可能只是还没排完。真几何 bug 不会自愈。
  if (issues.length > 0) {
    await page.waitForTimeout(WAIT);
    ({ blocks, issues } = await page.evaluate(AUDIT_JS));
  }

  totalBlocks += blocks;
  const label = route.padEnd(26);

  // 分流：已知噪声单独打印，不进失败列表
  //
  // 一次资源失败会同时产生两条记录（response 带状态码 + console 带文案），
  // 不去重就会把「一条 404」报成两条。这里按 URL 合并：有 response 行的
  // 就不再计 console 那条 —— 信息没丢，只是不重复。
  const httpUrls = pageErrors.map((e) => /^http \d{3} (.+)$/.exec(e)).filter(Boolean).map((m) => m[1]);
  const dropEcho = (list) =>
    list.filter(
      (e) => !(/^console: Failed to load resource/.test(e) && httpUrls.some((u) => e.includes(u)))
    );

  const notes = dropEcho(pageErrors.filter((e) => isKnownNoise(e)));
  const real = dropEcho(pageErrors.filter((e) => !isKnownNoise(e)));

  if (expect > 0 && blocks !== expect) {
    console.log(`✗ ${label} 块数 ${blocks}，期望 ${expect}`);
    failures.push(`${route}：块数 ${blocks}，期望 ${expect}`);
  }
  for (const e of real) {
    console.log(`✗ ${label} pageerror  ${e}`);
    failures.push(`${route}：pageerror ${e}`);
  }
  for (const n of notes) {
    const why = KNOWN_NOISE.find((k) => k.test.test(n)).why;
    console.log(`· ${label} 已知噪声  ${n}\n  ${" ".repeat(28)}↳ ${why}`);
  }
  if (issues.length === 0) {
    console.log(`· ${label} ${blocks} 块 · 0 命中`);
  } else {
    for (const i of issues) console.log(`✗ ${label} ${i.block}  ${i.kind}  ${i.detail}`);
    failures.push(`${route}：${issues.length} 处几何问题`);
  }

  await page.close();
}

await browser.close();

console.log(`\n共 ${totalBlocks} 块（验收门 = 40：17 逐项 + 17 工坊 + 6 场景）`);

if (failures.length) {
  console.error(`\n发现 ${failures.length} 个问题：`);
  for (const f of failures) console.error(" - " + f);
  process.exit(1);
}
console.log(`✓ ${ROUTES.length} 个页面全部干净。`);
