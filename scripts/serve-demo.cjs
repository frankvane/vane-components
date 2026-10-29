#!/usr/bin/env node
/**
 * 零依赖静态服务，用于本地复核 demo 构建产物。
 *
 *   node scripts/serve-demo.cjs packages/vane-card/demo-dist 3305
 *
 * 只做三件事：SPA 回退到 index.html、按扩展名给 Content-Type、禁缓存（改完刷新即生效）。
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

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    let file = path.join(root, urlPath);
    // 目录穿越防护：解析后必须仍在 root 内
    if (!file.startsWith(root)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, "index.html");
    }
    if (!fs.existsSync(file)) {
      // SPA 回退（hash 路由用不到，但 history 路由需要）
      file = path.join(root, "index.html");
      if (!fs.existsSync(file)) {
        res.writeHead(404).end("not found");
        return;
      }
    }
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`serving ${root} on http://127.0.0.1:${port}`);
  });
