<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="theme-color" content="__BG__" />
    <meta name="description" content="__DESC__" />
    <title>__PKG__ · __TITLE__</title>
    <!-- 统一 favicon：品牌字 + 各包主题色（由 scripts/sync-demo-shell.mjs 生成，禁止手改） -->
    <link
      rel="icon"
      href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='__ACCENT_ENC__'/%3E%3Ctext x='16' y='22.5' text-anchor='middle' font-family='system-ui,-apple-system,sans-serif' font-size='17' font-weight='700' fill='__BG_ENC__'%3E__BRAND__%3C/text%3E%3C/svg%3E"
    />
    <!-- 首屏底色内联，避免暗色站点在 CSS 到达前闪白 -->
    <style>
      html {
        color-scheme: dark;
        background: __BG__;
      }
      body {
        margin: 0;
        background: __BG__;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.tsx"></script>
  </body>
</html>
