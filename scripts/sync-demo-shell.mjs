#!/usr/bin/env node
/**
 * demo 外壳同步器（唯一真源：packages/templates/demo-shell/）
 *
 * 把标准外壳的四个文件生成到每个组件包的 demo 下：
 *   templates/demo-shell/DemoShell.tsx → <pkg>/demo/src/shell/DemoShell.tsx
 *   templates/demo-shell/App.tsx       → <pkg>/demo/src/App.tsx
 *   templates/demo-shell/shell.css     → <pkg>/demo/src/shell.css
 *   templates/demo-shell/index.html.tpl→ <pkg>/demo/index.html
 *
 * 各包只保留一份 demo/src/demo.config.tsx（导航 / 路由 / 品牌 / 页脚）与
 * demo/src/App.css（页面级样式 + 主题令牌），差异只允许出现在这两处。
 *
 * 用法：
 *   node scripts/sync-demo-shell.mjs           # 写入（幂等）
 *   node scripts/sync-demo-shell.mjs --check   # 只校验，有漂移则 exit 1（门禁用）
 */
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const packagesDir = path.join(root, "packages");
const shellDir = path.join(packagesDir, "templates", "demo-shell");

const checkOnly = process.argv.includes("--check");

const files = {
  demoShell: path.join(shellDir, "DemoShell.tsx"),
  app: path.join(shellDir, "App.tsx"),
  css: path.join(shellDir, "shell.css"),
  html: path.join(shellDir, "index.html.tpl"),
};

for (const f of Object.values(files)) {
  if (!existsSync(f)) {
    console.error(`缺少模板文件：${f}`);
    process.exit(1);
  }
}

const [tplShell, tplApp, tplCss, tplHtml] = await Promise.all([
  readFile(files.demoShell, "utf-8"),
  readFile(files.app, "utf-8"),
  readFile(files.css, "utf-8"),
  readFile(files.html, "utf-8"),
]);

const dirs = (await readdir(packagesDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && d.name !== "templates")
  .map((d) => d.name);

let drifted = 0;
let written = 0;

for (const dir of dirs) {
  const pkgPath = path.join(packagesDir, dir, "package.json");
  if (!existsSync(pkgPath)) continue;
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  const demo = pkg.vane?.demo;
  if (!demo) {
    console.warn(`· ${pkg.name}  跳过（package.json 缺 vane.demo）`);
    continue;
  }
  // 迁移期间：还没有 demo.config.tsx 的包先不动，避免生成 App.tsx 后引用不存在的配置
  if (!existsSync(path.join(packagesDir, dir, "demo", "src", "demo.config.tsx"))) {
    console.warn(`· ${pkg.name}  跳过（尚未提供 demo/src/demo.config.tsx）`);
    continue;
  }
  if (!demo.brand || !demo.subtitle || !demo.title || !demo.accent || !demo.bg) {
    console.error(`✗ ${pkg.name}  vane.demo 不完整，需要 brand/subtitle/title/accent/bg`);
    drifted += 1;
    continue;
  }

  const desc = `${pkg.name} 的实时演示台：${pkg.description ?? ""}全部页面可调可选、源码可复制。`
    .replace(/。。/g, "。")
    .replace(/\s+/g, " ");

  const html = tplHtml
    .replace(/__PKG__/g, pkg.name)
    .replace(/__TITLE__/g, demo.title)
    .replace(/__DESC__/g, desc.replace(/"/g, "&quot;"))
    .replace(/__ACCENT_ENC__/g, encodeURIComponent(demo.accent))
    .replace(/__BG_ENC__/g, encodeURIComponent(demo.bg))
    .replace(/__BG__/g, demo.bg)
    .replace(/__BRAND__/g, demo.brand);

  const targets = [
    [path.join(packagesDir, dir, "demo", "src", "shell", "DemoShell.tsx"), tplShell],
    [path.join(packagesDir, dir, "demo", "src", "App.tsx"), tplApp],
    [path.join(packagesDir, dir, "demo", "src", "shell.css"), tplCss],
    [path.join(packagesDir, dir, "demo", "index.html"), html],
  ];

  let changed = false;
  for (const [file, content] of targets) {
    const current = existsSync(file) ? await readFile(file, "utf-8") : null;
    if (current === content) continue;
    changed = true;
    if (checkOnly) {
      console.error(`✗ ${pkg.name}  ${path.relative(root, file)} 与模板不一致`);
    } else {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, content, "utf-8");
      written += 1;
    }
  }
  if (changed) drifted += 1;
  else console.log(`· ${pkg.name}  外壳一致`);
}

if (checkOnly) {
  if (drifted > 0) {
    console.error(`\n${drifted} 个包的 demo 外壳与模板不一致，请运行 node scripts/sync-demo-shell.mjs`);
    process.exit(1);
  }
  console.log("\ndemo 外壳一致性检查通过。");
} else {
  console.log(`\n已写入 ${written} 个文件。`);
}
