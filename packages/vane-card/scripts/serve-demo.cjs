/**
 * 示例站静态服务器（零依赖）
 *
 *   node scripts/serve-demo.cjs           # 托管 demo-dist，端口 3301
 *   PORT=3400 node scripts/serve-demo.cjs
 *
 * 为什么要单独一个脚本：demo 用 hash 路由，构建产物是 demo-dist/demo/index.html，
 * 直接开 file:// 会因为模块跨域被拦；用 `vite preview` 又得再装一层配置。
 * 这里只做三件事：静态文件、MIME、SPA 回退。
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(process.env.ROOT || path.join(__dirname, "../demo-dist"));
const PORT = Number(process.env.PORT || 3301);
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};

/** 入口 html：vite 以包根为 root、html 在 demo/ 下，所以产物在 demo-dist/demo/index.html */
function findEntry() {
  const candidates = [
    path.join(ROOT, "demo/index.html"),
    path.join(ROOT, "index.html"),
    path.join(ROOT, "demo-dist/demo/index.html"),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

const ENTRY = findEntry();

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || `${HOST}:${PORT}`}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/demo/index.html";

  const target = path.join(ROOT, pathname);
  const rel = path.relative(ROOT, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return send(res, 403, { "Content-Type": "text/plain; charset=utf-8" }, "forbidden");
  }

  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    return send(
      res,
      200,
      {
        "Content-Type": MIME[path.extname(target).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store",
      },
      fs.readFileSync(target)
    );
  }

  // SPA 回退：hash 路由刷新、以及不带扩展名的路径都回到入口 html
  if (ENTRY && !path.extname(pathname)) {
    return send(
      res,
      200,
      { "Content-Type": MIME[".html"], "Cache-Control": "no-store" },
      fs.readFileSync(ENTRY)
    );
  }

  send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, `not found: ${pathname}`);
});

if (!fs.existsSync(ROOT)) {
  console.error(`[serve-demo] 找不到 ${ROOT}，先跑 pnpm build:demo`);
  process.exit(1);
}

server.listen(PORT, HOST, () => {
  console.log(`[serve-demo] http://${HOST}:${PORT}`);
  console.log(`  root  : ${ROOT}`);
  console.log(`  entry : ${ENTRY ? path.relative(ROOT, ENTRY) : "（未找到 index.html）"}`);
  console.log(`  pages : /#/  /#/plugins  /#/scenarios`);
});
