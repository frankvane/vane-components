/**
 * 示例站静态服务器 + 受保护资源接口
 *
 * 为什么需要它：`auth` / `fallback-image` / `cdn-fallback` 这类插件的价值在
 * 「凭证无效 → 401/403 → 降级或重试」这条回路上，静态托管下没有会拒绝请求的
 * 接口，就只能验证「URL 上多了个 access_token」，验不了失败路径。这里补上：
 *
 *   GET /protected/image      校验凭证，200 回一张「已授权」的 SVG，401/403 回错误
 *
 * 凭证来源（任一命中即可，因为 <img> 无法自定义请求头，查询参数是必要的）：
 *   - Authorization: Bearer <token>
 *   - ?access_token=<token> / ?token=<token>
 *
 * 约定（供示例页与测评脚本使用）：
 *   - 缺失凭证            → 401  WWW-Authenticate: Bearer
 *   - token=expired-token → 401  error="invalid_token"（令牌过期，可重取后重试）
 *   - 其他未知 token      → 403  error="insufficient_scope"（有身份但无权限，重试无意义）
 *   - 合法 token          → 200  SVG
 *   - ?delay=<ms>         → 响应前等待，用于观察加载态
 *   - ?force=<status>     → 强制返回指定状态码，便于穷举降级分支
 *
 * 用法：
 *   node scripts/serve-demo.cjs                 # 静态托管 demo-dist，端口 3200
 *   PORT=3300 node scripts/serve-demo.cjs
 *   DEMO_TOKENS=abc,def node scripts/serve-demo.cjs
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = process.env.ROOT || path.resolve(__dirname, "../demo-dist");
const PORT = Number(process.env.PORT || 3200);
const HOST = process.env.HOST || "127.0.0.1";
const TOKENS = (process.env.DEMO_TOKENS || "demo-token-1f2e3d")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
// 故意留一个「过期令牌」：语义上是「这个身份曾经有效，需要重新获取」
const EXPIRED = (process.env.DEMO_EXPIRED_TOKENS || "expired-token")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

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

function corsHeaders(req) {
  const origin = req.headers.origin;
  // 带凭证的跨域请求不允许 Access-Control-Allow-Origin: * ，
  // 有 Origin 就回显；没有（同源 / curl）给 * 即可。
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type,Range,If-None-Match",
    "Access-Control-Max-Age": "600",
    // 允许读取 Resource Timing 的明细：没有它，跨域响应的 transferSize /
    // responseStatus 一律为 0，观察台就读不到 HTTP 状态码
    "Timing-Allow-Origin": origin || "*",
    Vary: "Origin",
  };
}

/** 读凭证：先 Authorization，再查询参数 */
function readCredential(req, url) {
  const auth = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
  if (m) return { token: m[1].trim(), via: "header" };
  const q = url.searchParams.get("access_token") || url.searchParams.get("token");
  if (q) return { token: q.trim(), via: "query" };
  return { token: "", via: "none" };
}

/** 200 时返回的图片：把「凭证已通过」这件事画在图上，肉眼即可确认 */
function authorizedSvg(token) {
  const masked = token.length > 6 ? token.slice(0, 4) + "…" + token.slice(-3) : token;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f766e"/><stop offset="1" stop-color="#0e7490"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#g)"/>
  <g fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2">
    <circle cx="300" cy="168" r="56"/>
    <path d="M300 112v112M244 168h112"/>
  </g>
  <path d="M282 168l12 12 22-24" stroke="#a7f3d0" stroke-width="7" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
  <text x="300" y="266" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif"
        font-size="30" font-weight="700" fill="#ecfeff">200 · AUTHORIZED</text>
  <text x="300" y="300" text-anchor="middle" font-family="ui-monospace,Menlo,monospace"
        font-size="15" fill="rgba(236,254,255,.78)">token ${masked} 已通过校验</text>
</svg>`;
}

function errorBody(code, error, message) {
  return JSON.stringify({ code, error, message, at: new Date().toISOString() }, null, 2);
}

function sendHtml(req, res, p) {
  const body = fs.readFileSync(p);
  res.writeHead(200, { "Content-Type": MIME[".html"], "Cache-Control": "no-store" });
  res.end(body);
}

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
      sendHtml(req, res, fb);
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

function handleProtected(req, res, url) {
  const { token, via } = readCredential(req, url);
  const force = Number(url.searchParams.get("force") || 0);
  const delay = Math.min(Number(url.searchParams.get("delay") || 0) || 0, 10000);
  const base = { ...corsHeaders(req), "Cache-Control": "no-store" };

  const respond = (status, headers, body, label) => {
    const go = () => {
      res.writeHead(status, headers);
      res.end(body);
      console.log(
        `[protected] ${req.method} ${url.pathname}${url.search || ""} → ${status} ${label}` +
          ` (via=${via}, token=${token ? token.slice(0, 6) + "…" : "none"})`
      );
    };
    if (delay > 0) setTimeout(go, delay);
    else go();
  };

  if (force) {
    return respond(
      force,
      { ...base, "Content-Type": "application/json; charset=utf-8" },
      errorBody(force, "forced", "由 ?force= 强制返回，用于穷举降级分支"),
      "forced"
    );
  }

  if (!token) {
    return respond(
      401,
      {
        ...base,
        "Content-Type": "application/json; charset=utf-8",
        "WWW-Authenticate": 'Bearer realm="vane-demo", error="missing_credentials"',
      },
      errorBody(401, "missing_credentials", "缺少凭证：请用 Authorization: Bearer 或 ?access_token="),
      "缺少凭证"
    );
  }

  if (EXPIRED.includes(token)) {
    return respond(
      401,
      {
        ...base,
        "Content-Type": "application/json; charset=utf-8",
        "WWW-Authenticate": 'Bearer realm="vane-demo", error="invalid_token"',
      },
      errorBody(401, "invalid_token", "令牌已过期：可重新获取后重试（属于可重试错误）"),
      "令牌过期"
    );
  }

  if (!TOKENS.includes(token)) {
    return respond(
      403,
      { ...base, "Content-Type": "application/json; charset=utf-8" },
      errorBody(403, "insufficient_scope", "身份有效但无权访问该资源（重试无意义，应降级）"),
      "权限不足"
    );
  }

  return respond(
    200,
    { ...base, "Content-Type": "image/svg+xml; charset=utf-8" },
    authorizedSvg(token),
    "凭证通过"
  );
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || HOST + ":" + PORT}`);
  const pathname = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(req)).end();
    return;
  }

  if (pathname === "/protected/image" || pathname.startsWith("/protected/")) {
    return handleProtected(req, res, url);
  }

  if (pathname === "/__demo/health") {
    const headers = { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8" };
    res.writeHead(200, headers).end(
      JSON.stringify({
        ok: true,
        root: ROOT,
        tokens: TOKENS.length,
        expired: EXPIRED,
        routes: ["/protected/image"],
      })
    );
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`demo server on http://${HOST}:${PORT}`);
  console.log(`  static root : ${ROOT}`);
  console.log(`  protected   : http://${HOST}:${PORT}/protected/image`);
  console.log(`  health      : http://${HOST}:${PORT}/__demo/health`);
  console.log(`  valid token : ${TOKENS[0]}`);
  console.log(`  expired     : ${EXPIRED[0]} (→401)`);
});
