#!/usr/bin/env node
/**
 * 零依赖静态服务，用于本地复核 demo 构建产物。
 *
 *   node scripts/serve-demo.cjs packages/vane-card/demo-dist 3305
 *
 * 只做三件事：SPA 回退到 index.html、按扩展名给 Content-Type、禁缓存（改完刷新即生效）。
 * 额外提供一个 POST /_audit-report：对比度体检页（_audit.html）把结果回传落盘成
 * _audit-report.json，供逐项判读。
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
      // SPA 回退：从请求路径逐级往上找**最近的** index.html。
      // 聚合目录（demos/<pkg>/）里每个包各有一份 index.html，一律回退到根会把
      // /vane-sku/demo/xxx 送到引导页去，深链与刷新都会白屏。
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
