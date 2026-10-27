/**
 * demo 构建产物的静态服务器（零依赖）
 *
 *   npm run build:demo && node scripts/serve-demo.cjs      # 端口 3303
 *   PORT=3400 node scripts/serve-demo.cjs
 *
 * 为什么要单独一个：demo 用 hash 路由，产物入口在 `demo-dist/demo/index.html`，
 * 直接开 `file://` 会因为 ES module 的跨域限制被拦；`vite preview` 又得再引一层配置。
 * 这里只做三件事：静态文件、MIME、SPA 回退。
 *
 * MIME 表比一般的静态服务器长 —— 这个 demo 的整个意义就是「喂各种文件给预览器」：
 * `<video>` / `<audio>` / PDF iframe 都吃 Content-Type，随便回一个
 * `application/octet-stream` 会让播放器直接拒绝播放，看起来像「插件坏了」。
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(process.env.ROOT || path.join(__dirname, "../demo-dist"));
const PORT = Number(process.env.PORT || 3303);
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
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".avi": "video/x-msvideo",
  ".flv": "video/x-flv",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".epub": "application/epub+zip",
  ".zip": "application/zip",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".csv": "text/csv; charset=utf-8",
  ".tsv": "text/tab-separated-values; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".rss": "application/rss+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

/** 入口：vite 的 root 是包根、html 写在 demo/ 下，所以产物是 demo-dist/demo/index.html */
const ENTRY = [path.join(ROOT, "demo/index.html"), path.join(ROOT, "index.html")].find((p) =>
  fs.existsSync(p)
);

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

if (!fs.existsSync(ROOT)) {
  console.error(`[serve-demo] 找不到 ${ROOT}，先跑 npm run build:demo`);
  process.exit(1);
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

server.listen(PORT, HOST, () => {
  console.log(`[serve-demo] http://${HOST}:${PORT}/demo/index.html`);
  console.log(`  root  : ${ROOT}`);
  console.log(`  entry : ${ENTRY ? path.relative(ROOT, ENTRY) : "（未找到 index.html）"}`);
});
