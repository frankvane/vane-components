// 版式参照：SaaS 后台「受保护资源」—— 401/403 必须给出可操作的出口
// 装配：鉴权 → 失败重试 → 错误蒙层
import {
  LazyLoadImageCore,
  createAuthPlugin,
  createErrorOverlayPlugin,
  createRetryOnErrorPlugin,
  withPlugins,
} from "vane-lazy-image";
import React from "react";
import type { CSSProperties } from "react";

// 三种凭证状态：有效 / 过期 / 无权限，用来固定演示 200 / 401 / 403 三条分支
const CASES = [
  { id: 1, token: "demo-token-1f2e3d", label: "凭证有效 → 200" },
  { id: 2, token: "expired-token", label: "凭证过期 → 401" },
  { id: 3, token: "unknown-token", label: "权限不足 → 403" },
];

function Protected({ token }: { token: string }) {
  const Lazy = React.useMemo(
    () =>
      withPlugins(LazyLoadImageCore as any, [
        createAuthPlugin({ token, tokenParam: "access_token" }),
        createRetryOnErrorPlugin({ maxRetries: 1, baseDelayMs: 300 }),
        createErrorOverlayPlugin({ message: "无法加载受保护资源", showRetry: true, retryText: "重试" }),
      ]),
    [token],
  );
  return (
    <Lazy
      src="http://127.0.0.1:3200/protected/image"
      alt={`受保护资源 ${token}`}
      loading="lazy"
      containerStyle={{ width: "100%", aspectRatio: "3 / 2", borderRadius: 4, overflow: "hidden" }}
      imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}

export default function Protected401() {
  return (
    <div style={STAGE}>
      <div style={ROW}>
        {CASES.map((c) => (
          <figure key={c.id} style={CELL}>
            <Protected token={c.token} />
            <figcaption style={CAP}>{c.label}</figcaption>
          </figure>
        ))}
      </div>
      <p style={HINT}>
        接口是演示站自带的 <code>/protected/image</code>：缺凭证 401 <code>missing_credentials</code>、
        过期 401 <code>invalid_token</code>、越权 403 <code>insufficient_scope</code>。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const ROW: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 };
const CELL: CSSProperties = { margin: 0 };
const CAP: CSSProperties = { display: "block", marginTop: 5, color: "#7b7b7b", fontSize: 10 };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#9c9c9c", fontSize: 10.5, lineHeight: 1.7 };
