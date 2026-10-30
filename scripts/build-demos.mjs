#!/usr/bin/env node
/**
 * 把各包的 demo 聚合构建到根 `demos/`，并在 `demos/index.html` 生成引导页。
 *
 *   node scripts/build-demos.mjs            # 全量构建
 *   node scripts/build-demos.mjs --no-build # 复用已有 demo-dist，只做聚合（调试用）
 *   node scripts/build-demos.mjs --only vane-card,vane-sku
 *   node scripts/build-demos.mjs --clean    # 全量重建并先清空整个 demos/（清掉已下线包的残留；不能与 --only 连用）
 *
 * 单包目录每次都在 `copyDemo()` 里先删后铺，所以反复 `--only` 重建不会堆积旧 hash 产物；
 * `--clean` 只用于「连别的残留一起清」的全量重置。
 *
 * 目录约定（产物，git 忽略）：
 *   demos/index.html        引导页
 *   demos/<pkg>/index.html  各包演示台
 *   demos/<pkg>/assets/*    各包资源（js/css/图片），互不共享
 *
 * 为什么需要改写资源路径：vite 的 `base: "./"` 让 html 落在 `demo-dist/demo/`、
 * 资源落在 `demo-dist/assets/`，因此 html 里写的是 `../assets/x.js`。
 * 聚合后 html 被提到 `demos/<pkg>/index.html`、资源放到 `demos/<pkg>/assets/`，
 * 层级从「上一级」变成「同级」，所以统一把 `../assets/` 换成 `./assets/`。
 *
 * 同一件事的另一半是 publicDir：vane-file-preview 的样本文件在 `demo/public/samples/`，
 * 单包形态（dev / `serve-demo.cjs` 以 demo-dist 为根）下挂在站点根，源码里只能写
 * `/samples/x`。聚合后文档变成 `/<pkg>/index.html`，这个绝对路径就指到了
 * `demos/samples/` —— 那里没有文件，于是页面上每个样本都 404。
 * 所以 JS 里 `/<publicDir>/` 也要跟着降一级，改成 `./<publicDir>/`。
 *
 * 两条改写都只作用于 `demos/` 下的聚合产物，`demo-dist/` 里的单包产物保持原样，
 * 包内 dev 与单包 preview 因此不受影响。
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Windows：Git Bash 会话的 cwd 可能是小写盘符（e:\…），import.meta.url 推出的 ROOT
// 会跟着小写。spawn 给 vite 的 cwd 与其内部模块 id 大小写不一致时，
// [vite:html-inline-proxy] 会报「No matching HTML proxy module found」（构建直接失败）。
// 把盘符统一规范成大写，保证 spawn cwd 与模块解析大小写一致。
const ROOT = path
  .resolve(fileURLToPath(new URL("..", import.meta.url)))
  .replace(/^[a-z]:/, (m) => m.toUpperCase());
const OUT_DIR = path.join(ROOT, "demos");
const PKG_DIR = path.join(ROOT, "packages");

const argv = process.argv.slice(2);
const noBuild = argv.includes("--no-build");
const clean = argv.includes("--clean");
const onlyArg = argv[argv.indexOf("--only") + 1];
const only = argv.includes("--only") && onlyArg ? onlyArg.split(",").map((s) => s.trim()).filter(Boolean) : null;

// --clean 会清空整个 demos/，而引导页只在**全量**构建时重写（见 main 里 `if (!only)`）——
// 这个组合不是要修的行为，是用法错误：连用会删掉 demos/index.html 且不重建，
// 之后访问 / 直接 404。要干净基线就全量跑 --clean，要单包更新就用 --only 别带 --clean。
if (clean && only) {
  console.error("✗ --clean 不能与 --only 连用");
  console.error("  --clean 清空 demos/ 后，引导页只在全量构建时重建，连用会把它删掉且不补回来，访问 / 直接 404。");
  console.error("  干净基线：node scripts/build-demos.mjs --clean");
  console.error("  单包更新：node scripts/build-demos.mjs --only <pkg>");
  process.exit(1);
}

/* ---------------------------------------------------------------- 采集 */

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function discover() {
  const list = [];
  for (const entry of fs.readdirSync(PKG_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(PKG_DIR, entry.name);
    const manifest = path.join(dir, "package.json");
    const viteConfig = path.join(dir, "demo", "vite.config.ts");
    if (!fs.existsSync(manifest) || !fs.existsSync(viteConfig)) continue;
    const pkg = readJson(manifest);
    if (!pkg.vane?.demo) continue;
    if (only && !only.includes(pkg.name)) continue;
    list.push({
      name: pkg.name,
      dir,
      description: pkg.description ?? "",
      meta: pkg.vane.demo,
      dist: path.join(dir, "demo-dist"),
    });
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

/* ---------------------------------------------------------------- 构建 */

function resolveViteCli(pkgDir) {
  // pnpm 会把依赖软链到包内 node_modules，优先用包自己的 vite
  for (const base of [pkgDir, ROOT]) {
    const cli = path.join(base, "node_modules", "vite", "bin", "vite.js");
    if (fs.existsSync(cli)) return cli;
  }
  return null;
}

function build(pkg) {
  const cli = resolveViteCli(pkg.dir);
  if (!cli) throw new Error(`${pkg.name}: 找不到 vite（node_modules/vite/bin/vite.js）`);
  // 先自己清掉旧产物：vite 的 emptyOutDir 在个别环境里会被「批量删除保护」拦下
  // （一次 rmSync 递归上千个文件），父进程逐包删干净后 vite 只需新建，绕开这条路。
  fs.rmSync(pkg.dist, { recursive: true, force: true });
  const res = spawnSync(process.execPath, [cli, "build", "--config", "demo/vite.config.ts"], {
    cwd: pkg.dir,
    stdio: "inherit",
  });
  if (res.status !== 0) throw new Error(`${pkg.name}: demo 构建失败（exit ${res.status}）`);
}

/* ---------------------------------------------------------------- 聚合 */

/** 需要改写资源前缀的文本产物；图片/字体等二进制原样搬 */
const REWRITE_EXT = new Set([".html", ".js", ".mjs", ".css"]);

/**
 * 把单包产物的资源前缀改成聚合产物能用的一级（规则见文件头注释）。
 * `publicDirs` 是 vite 吐在 `demo-dist/` 根上的顶层目录（如 `samples`）。
 */
function rewriteAssetPaths(text, publicDirs) {
  let out = text.replaceAll("../assets/", "./assets/");
  for (const dir of publicDirs) {
    // 断言前一个字符不是 `.` / `/` / 单词字符：既避免把已经是 `./samples/` 的
    // 再降一级变成 `../samples/`，也避免误伤别的包里恰好同名的一段路径。
    out = out.replace(new RegExp(String.raw`(?<![\w./])/${dir}/`, "g"), `./${dir}/`);
  }
  return out;
}

function copyDemo(pkg) {
  const src = path.join(pkg.dist, "demo");
  if (!fs.existsSync(src)) throw new Error(`${pkg.name}: 缺产物 ${path.relative(ROOT, src)}`);
  const dest = path.join(OUT_DIR, pkg.name);
  // 先删本包目录再铺：cpSync 是叠加语义，不清就会把历史 hash 的旧产物越攒越多
  // （file-preview 曾堆到 3000+ 文件 / 42MB，只能靠人记得带 --clean 才收敛）。
  // 只删 demos/<pkg>，绝不波及 demos/index.html 与 demos/_audit.html（它们在 demos/ 根上）。
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });

  // vite 把 publicDir 的内容平铺在 demo-dist 根上（样本 404 的根因所在，见文件头）
  const extras = fs.readdirSync(pkg.dist).filter((name) => name !== "demo" && name !== "assets");
  const publicDirs = extras.filter((name) => fs.statSync(path.join(pkg.dist, name)).isDirectory());

  // 顺序很关键：先铺资源、最后写 html。这样新 html 落盘时它引用的资源一定已就位，
  // 不会出现「html 已是新的、assets 还没搬完」的白屏窗口。
  // 代价说明：上面那次 rmSync 会让正在预览本包的标签页在重建瞬间短暂 404（刷新即恢复），
  // 这是换取「产物不堆积」的必然代价 —— 目录被清空的那一瞬不可能还有旧文件可服务。
  const assetsSrc = path.join(pkg.dist, "assets");
  let assets = 0;
  if (fs.existsSync(assetsSrc)) {
    fs.cpSync(assetsSrc, path.join(dest, "assets"), { recursive: true });
    const names = fs.readdirSync(assetsSrc);
    assets = names.length;
    // cpSync 只搬不改：样本 URL 写在 JS 里，搬完再扫一遍文本产物
    if (publicDirs.length) {
      for (const name of names) {
        const file = path.join(dest, "assets", name);
        if (!REWRITE_EXT.has(path.extname(name))) continue;
        fs.writeFileSync(file, rewriteAssetPaths(fs.readFileSync(file, "utf8"), publicDirs));
      }
    }
  }

  // 兜底：vite 若把别的顶层文件/目录也吐在 demo-dist 根上，一并搬过去
  for (const name of extras) {
    fs.cpSync(path.join(pkg.dist, name), path.join(dest, name), { recursive: true });
  }

  let html = 0;
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    if (!fs.statSync(from).isFile()) continue;
    if (!name.endsWith(".html")) {
      fs.copyFileSync(from, path.join(dest, name));
      continue;
    }
    // 资源保持相对：demo 用 HashRouter，导航只改 hash、文档路径恒为 /<pkg>/，
    // 相对路径不会随路由变深，反而能整包搬来搬去。
    const text = rewriteAssetPaths(fs.readFileSync(from, "utf8"), publicDirs);
    fs.writeFileSync(path.join(dest, name), text);
    html += 1;
  }
  if (!html) throw new Error(`${pkg.name}: 产物里没有 html`);

  return { html, assets, bytes: dirSize(dest) };
}

function dirSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(full) : fs.statSync(full).size;
  }
  return total;
}

/* ---------------------------------------------------------------- 引导页 */

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

function landing(pkgs) {
  const stamp = new Date().toISOString().slice(0, 10);
  const cards = pkgs
    .map(
      (p) => `      <li class="cell">
        <a class="card" href="./${esc(p.name)}/" style="--a: ${esc(p.meta.accent)}; --a-ink: ${esc(p.meta.bg)}">
          <span class="card-top">
            <span class="mark">${esc(p.meta.brand)}</span>
            <span class="sub">${esc(p.meta.subtitle)}</span>
          </span>
          <span class="title">${esc(p.meta.title)}</span>
          <span class="desc">${esc(p.description)}</span>
          <span class="foot">
            <code>${esc(p.name)}</code>
            <span class="go">打开 <i>→</i></span>
          </span>
        </a>
      </li>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="theme-color" content="#080a09" />
    <meta name="description" content="vane-components 各组件包的演示台入口" />
    <title>vane-components · demos</title>
    <link
      rel="icon"
      href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23ecefe3'/%3E%3Ctext x='16' y='22.5' text-anchor='middle' font-family='system-ui,-apple-system,sans-serif' font-size='17' font-weight='700' fill='%23080a09'%3EV%3C/text%3E%3C/svg%3E"
    />
    <style>
      /* 引导页是静态页，不引任何包：令牌与 demo 外壳同一套，只有强调色是中性纸白 */
      :root {
        --ink-0: #080a09;
        --ink-1: #0d100e;
        --ink-2: #131714;
        --text: #e9ecdf;
        --dim: #a9ae9d;
        --faint: #8b9080;
        --paper: #ecefe3;
        --rule: rgba(236, 239, 227, 0.14);
        --rule-2: rgba(236, 239, 227, 0.24);
        --ff-display: "Bodoni Moda", "Songti SC", "Source Han Serif SC", "Noto Serif SC", SimSun, serif;
        --ff-sans: "IBM Plex Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
        --ff-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }

      * { box-sizing: border-box; }

      html, body {
        margin: 0;
        background: var(--ink-0);
        color: var(--text);
        font-family: var(--ff-sans);
        -webkit-font-smoothing: antialiased;
      }

      body {
        min-height: 100vh;
        padding: 0 clamp(18px, 4vw, 56px) 72px;
        background-image:
          linear-gradient(180deg, rgba(236, 239, 227, 0.045), transparent 340px),
          repeating-linear-gradient(90deg, transparent 0 79px, rgba(236, 239, 227, 0.035) 79px 80px);
        background-repeat: no-repeat, repeat;
      }

      /* ---- 顶栏 ---- */

      .top {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 22px 0;
        border-bottom: 1px solid var(--rule);
      }

      .top .mark {
        width: 32px;
        height: 32px;
        flex: none;
        display: grid;
        place-items: center;
        background: var(--paper);
        color: var(--ink-0);
        font-family: var(--ff-display);
        font-size: 20px;
        font-weight: 900;
        line-height: 1;
        letter-spacing: -0.04em;
      }

      .top strong {
        display: block;
        font-family: var(--ff-display);
        font-size: 17px;
        line-height: 1.15;
      }

      .top em {
        display: block;
        margin-top: 5px;
        font-family: var(--ff-mono);
        font-style: normal;
        font-size: 9.5px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--faint);
      }

      .src {
        margin-left: auto;
        padding: 7px 12px;
        border: 1px solid var(--rule-2);
        font-family: var(--ff-mono);
        font-size: 10px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--dim);
        text-decoration: none;
      }

      .src:hover { color: var(--paper); border-color: var(--paper); }

      /* ---- 标题区 ---- */

      .kicker {
        margin: 44px 0 16px;
        font-family: var(--ff-mono);
        font-size: 10px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--faint);
      }

      h1 {
        margin: 0;
        max-width: 22ch;
        font-family: var(--ff-display);
        font-size: clamp(34px, 6vw, 60px);
        font-weight: 700;
        line-height: 1.04;
        letter-spacing: -0.02em;
      }

      h1 span { color: var(--faint); }

      .lede {
        max-width: 62ch;
        margin: 20px 0 0;
        font-size: 14.5px;
        line-height: 1.75;
        color: var(--dim);
      }

      .lede b { color: var(--text); font-weight: 600; }

      /* ---- 卡片网格 ---- */

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 14px;
        margin: 40px 0 0;
        padding: 0;
        list-style: none;
      }

      .cell { display: flex; }

      .card {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 1;
        padding: 18px 18px 16px;
        background: linear-gradient(160deg, var(--ink-1), var(--ink-0) 72%);
        border: 1px solid var(--rule);
        color: inherit;
        text-decoration: none;
        transition: border-color 0.18s ease, transform 0.18s ease, background 0.18s ease;
      }

      /* 左侧 2px 主题色条：每包唯一的颜色差异就落在这里 */
      .card::before {
        content: "";
        position: absolute;
        inset: 0 auto 0 0;
        width: 2px;
        background: var(--a);
        opacity: 0.28;
        transition: opacity 0.18s ease;
      }

      .card:hover {
        border-color: var(--rule-2);
        transform: translateY(-2px);
        background: linear-gradient(160deg, var(--ink-2), var(--ink-0) 76%);
      }

      .card:hover::before { opacity: 1; }

      .card:focus-visible {
        outline: 2px solid var(--a);
        outline-offset: 2px;
      }

      .card-top {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .card-top .mark {
        width: 26px;
        height: 26px;
        flex: none;
        display: grid;
        place-items: center;
        background: var(--a);
        color: var(--a-ink);
        font-family: var(--ff-display);
        font-size: 16px;
        font-weight: 900;
        line-height: 1;
      }

      .card .sub {
        font-family: var(--ff-mono);
        font-size: 9.5px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--faint);
      }

      .card .title {
        font-family: var(--ff-display);
        font-size: 21px;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: 0.01em;
      }

      .card .desc {
        font-size: 12.5px;
        line-height: 1.7;
        color: var(--dim);
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .card .foot {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: auto;
        padding-top: 12px;
        border-top: 1px solid var(--rule);
      }

      .card .foot code {
        font-family: var(--ff-mono);
        font-size: 10.5px;
        color: var(--faint);
      }

      .card .go {
        margin-left: auto;
        font-family: var(--ff-mono);
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--dim);
      }

      .card .go i {
        font-style: normal;
        color: var(--a);
      }

      .card:hover .go { color: var(--text); }

      footer {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 18px;
        margin-top: 48px;
        padding-top: 16px;
        border-top: 1px solid var(--rule);
        font-family: var(--ff-mono);
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--faint);
      }

      @media (max-width: 640px) {
        .grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header class="top">
      <span class="mark">V</span>
      <span>
        <strong>vane-components</strong>
        <em>demo index / ${pkgs.length} packages</em>
      </span>
      <a class="src" href="https://github.com/frankvane/vane-components">source ↗</a>
    </header>

    <main>
      <p class="kicker">— DEMO INDEX · BUILD ${stamp}</p>
      <h1>组件演示台<span>，</span>一个入口。</h1>
      <p class="lede">
        每个包一套独立演示台：<b>同一套外壳</b>（侧栏索引 / 顶栏 / 逐项示例导航 / 兜底），
        各包之间只有<b>主题色</b>不同。点进去即可调参数、看运行时信号、读可复制的源码。
      </p>

      <ul class="grid">
${cards}
      </ul>
    </main>

    <footer>
      <span>${pkgs.length} packages · 每包一套演示台</span>
      <span>generated by scripts/build-demos.mjs</span>
      <span>vane-components</span>
    </footer>
  </body>
</html>
`;
}

/* ---------------------------------------------------------------- main */

function main() {
  const pkgs = discover();
  if (!pkgs.length) {
    console.error("没有找到可聚合的 demo（需要 package.json 的 vane.demo 与 demo/vite.config.ts）");
    process.exit(1);
  }

  console.log(`→ 聚合 ${pkgs.length} 个包的 demo 到 ${path.relative(ROOT, OUT_DIR)}/`);
  // 默认**不清空整个** demos/：只重写本次选中的包，其它包的演示台与引导页保持原样，
  // 不用为一次单包更新付出「整站被删再写」的空窗。单包目录由 copyDemo() 自己先删后铺。
  if (clean) {
    console.log("  （--clean：先清空 demos/，请先关掉正在预览的标签页）");
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const rows = [];
  for (const pkg of pkgs) {
    if (!noBuild) {
      console.log(`\n▸ ${pkg.name} · vite build`);
      build(pkg);
    }
    const stat = copyDemo(pkg);
    rows.push({ pkg, stat });
    console.log(`  ✓ demos/${pkg.name}  (${stat.html} html · ${stat.assets} assets · ${kb(stat.bytes)})`);
  }

  // 只构建部分包时不要重写引导页，否则会把没参与本次构建的包从入口上抹掉
  if (!only) {
    fs.writeFileSync(path.join(OUT_DIR, "index.html"), landing(pkgs));
  }

  // 对比度体检页：必须与 demo 同源才能在 iframe 里读 computed style，
  // 所以复制进 demos/（每次构建都补一份，--clean 也删不掉）
  const auditSrc = path.join(ROOT, "scripts", "contrast-audit.html");
  if (fs.existsSync(auditSrc)) {
    fs.copyFileSync(auditSrc, path.join(OUT_DIR, "_audit.html"));
  }

  const total = rows.reduce((n, r) => n + r.stat.bytes, 0);
  console.log(
    only
      ? `\n✓ ${pkgs.length} 个演示台已更新（--only：引导页未改动）· 目录合计 ${kb(total)}`
      : `\n✓ demos/index.html 已生成 · ${pkgs.length} 个演示台 · 目录合计 ${kb(total)}`
  );
  console.log(`  本地预览：node scripts/serve-demo.cjs demos 3350  然后访问 http://127.0.0.1:3350/`);
}

main();
