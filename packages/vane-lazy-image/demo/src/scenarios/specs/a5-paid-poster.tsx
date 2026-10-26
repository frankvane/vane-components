// 版式参照：会员专享剧集海报 —— 付费墙背后是带 token 的私有图源
// 装配：鉴权（追加 token 参数）→ 失败重试 → 错误蒙层
// 说明：图源是演示站的受保护接口（pnpm serve:demo 提供），换掉 token 或关掉服务即进入失败态
import {
  LazyLoadImageCore,
  createAuthPlugin,
  createErrorOverlayPlugin,
  createRetryOnErrorPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // token 由登录态提供；这里用函数形式，模拟「每次取最新 token」而不是写死
  createAuthPlugin({
    token: () => "demo-token-1f2e3d",
    tokenParam: "access_token",
  }),
  createRetryOnErrorPlugin({ maxRetries: 2, baseDelayMs: 400 }),
  createErrorOverlayPlugin({
    message: "该内容为会员专享，凭证失效后无法加载",
    showRetry: true,
    retryText: "重新鉴权",
  }),
]);

export default function PaidPoster() {
  return (
    <div style={STAGE}>
      <div style={CARD}>
        <Lazy
          src="http://127.0.0.1:3200/protected/image"
          alt="会员专享海报"
          loading="lazy"
          containerStyle={{ width: "100%", aspectRatio: "3 / 2", borderRadius: 6, overflow: "hidden" }}
          imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={LOCK}>会员专享 · VIP</div>
      </div>
      <p style={HINT}>
        凭证有效时返回 200 授权海报；把 token 换成 <code>expired-token</code> 会拿到 401
        <code>invalid_token</code>，蒙层与重试按钮即接管。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#111014", padding: 16, borderRadius: 6 };
const CARD: CSSProperties = { position: "relative", maxWidth: 320 };
const LOCK: CSSProperties = {
  position: "absolute",
  left: 10,
  bottom: 10,
  padding: "3px 8px",
  borderRadius: 3,
  fontSize: 11,
  color: "#ffd9a0",
  background: "rgba(0,0,0,.62)",
  border: "1px solid rgba(255,122,41,.4)",
};
const HINT: CSSProperties = { color: "#807a70", fontSize: 11.5, lineHeight: 1.7, marginTop: 10 };
