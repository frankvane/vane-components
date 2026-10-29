/**
 * 示例站静态服务器（零依赖）
 *
 * 用法：
 *   node scripts/serve-demo.cjs            # 静态托管 demo-dist，端口 3200
 *   PORT=3310 node scripts/serve-demo.cjs
 *
 * 提供 /__demo/health 供构建/体检脚本探活；hash 路由刷新走 SPA 回退。
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = process.env.ROOT || path.resolve(__dirname, "../demo-dist");
const PORT = Number(process.env.PORT || 3200);
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
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
  ".map": "application/json",
};

function serveStatic(req, res, pathname) {
  let p = path.join(ROOT, decodeURIComponent(pathname));
  const rel = path.relative(ROOT, p);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (!fs.existsSync(p)) {
    // SPA 回退：hash 路由刷新后仍要能拿到页面
    const fb = path.join(ROOT, "demo/index.html");
    if (fs.existsSync(fb)) {
      res.writeHead(200, { "Content-Type": MIME[".html"], "Cache-Control": "no-store" });
      res.end(fs.readFileSync(fb));
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("not found");
    return;
  }
  res.writeHead(200, {
    "Content-Type": MIME[path.extname(p).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(p).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || HOST + ":" + PORT}`);
  const pathname = url.pathname;

  if (pathname === "/__demo/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, root: ROOT, port: PORT }));
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`demo server on http://${HOST}:${PORT}`);
  console.log(`  static root : ${ROOT}`);
  console.log(`  health      : http://${HOST}:${PORT}/__demo/health`);
});
