#!/usr/bin/env node
/**
 * 零依赖静态服务，用于本地复核 demo 构建产物。
 *
 *   node scripts/serve-demo.cjs demos 3350   # 等价于 pnpm serve:demo
 *
 * root 是根聚合目录 `demos/`（`pnpm build:demo` 的产物）。
 *
 * 请求按三类处理：
 *  - 目录 → 缺尾斜杠先 301 补上，再取目录下的 index.html。
 *  - 文件存在 → 按扩展名给 Content-Type，禁缓存（改完刷新即生效）。
 *  - 文件不存在，分两种：
 *    · 带静态资源扩展名（.js/.css/.png/.docx/.pdf/.mp4…）→ **真 404，不回退**。
 *      为什么不回退：一旦把 index.html 当成兜底返回，客户端拿到的是「200 + 一段 HTML」，
 *      <video>、PDF iframe、fetch 之后的解析库都会照单全收，失败被推迟到解析阶段才爆成
 *      「解析失败」——「资源缺失」就这样伪装成了「插件坏了」，排查时极难定位
 *      （file-preview 的样本 404 正是这么被掩盖成 MammothDocxPlugin 解析失败的）。
 *    · 无扩展名或 .html（看着像路由）→ 逐级向上找**最近的** index.html。
 *      demo 用 HashRouter，导航只改 hash、路径不会变深；聚合目录下每个包各有一份
 *      index.html，只认根那一份会把 /<pkg>/xxx 送到引导页去，深链与刷新都会白屏。
 *
 * 另外提供 POST /_audit-report：对比度体检页（_audit.html）把结果回传落盘成
 * demos/_audit-report.json，供逐项判读。
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(process.argv[2] || ".");
const port = Number(process.argv[3] || 3300);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

if (!fs.existsSync(root)) {
  console.error(`目录不存在：${root}`);
  process.exit(1);
}

const REPORT = path.join(root, "_audit-report.json");

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);

    // 体检回传：contrast-audit.html 跑完把结构化结果 POST 回来，落盘成 JSON。
    // 浏览器里读不全（结果区是 pre 文本），落盘后才能逐项判读。dev-only。
    if (req.method === "POST" && urlPath === "/_audit-report") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        let next;
        try {
          next = JSON.parse(body);
        } catch {
          res.writeHead(400).end("bad json");
          return;
        }
        let all = {};
        if (fs.existsSync(REPORT)) {
          try {
            all = JSON.parse(fs.readFileSync(REPORT, "utf8"));
          } catch {
            all = {};
          }
        }
        all[next.pkg] = next;
        fs.writeFileSync(REPORT, JSON.stringify(all, null, 2));
        res.writeHead(200, { "Content-Type": "application/json" }).end('{"ok":true}');
      });
      return;
    }

    let file = path.join(root, urlPath);
    // 目录穿越防护：解析后必须仍在 root 内
    if (!file.startsWith(root)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      // 目录必须带尾斜杠，否则页面里的 ./assets/x.js 会解析到上一级
      if (!urlPath.endsWith("/")) {
        res.writeHead(301, { Location: `${urlPath}/${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}` });
        res.end();
        return;
      }
      file = path.join(file, "index.html");
    }
    if (!fs.existsSync(file)) {
      // 回退只认「看起来像路由」的路径：没有扩展名，或就是 .html。
      // 带静态资源扩展名（.js/.css/.png/.docx/.pdf/.mp4…）的路径一旦不存在就是真缺文件，
      // 必须回真正的 404：回退成 index.html 会把「200 + 一段 HTML」喂给 <video>、
      // PDF iframe、fetch 解析器，失败被推迟到解析库里才爆成「解析失败」，排查时极难
      // 定位（file-preview 的样本 404 就是这么被掩盖成「MammothDocxPlugin 解析失败」的）。
      // 注意不能用上面的 MIME 表反推「是不是静态资源」——.docx/.pdf/.mp4 不在那张表里。
      const ext = path.extname(urlPath).toLowerCase();
      if (ext !== "" && ext !== ".html") {
        res.writeHead(404).end(`not found: ${urlPath}`);
        return;
      }

      // 从请求路径逐级往上找**最近的** index.html：聚合目录（demos/<pkg>/）里每个包各
      // 有一份 index.html，一律回退到根会把 /vane-sku/demo/xxx 送到引导页去，
      // 深链与刷新都会白屏。
      let found = null;
      let dir = path.dirname(path.join(root, urlPath));
      while (dir.startsWith(root)) {
        const candidate = path.join(dir, "index.html");
        if (fs.existsSync(candidate)) {
          found = candidate;
          break;
        }
        if (dir === root) break;
        dir = path.dirname(dir);
      }
      if (!found) {
        res.writeHead(404).end("not found");
        return;
      }
      file = found;
    }
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`serving ${root} on http://127.0.0.1:${port}`);
  });
