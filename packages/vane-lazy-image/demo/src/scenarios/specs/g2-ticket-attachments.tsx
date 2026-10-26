// 版式参照：工单 / 审批后台的附件缩略图 —— 附件走鉴权接口，缺权限要能看到原因
// 装配：鉴权 → 错误徽标 → 画廊
import {
  LazyLoadImageCore,
  createAuthPlugin,
  createErrorBadgePlugin,
  createGalleryPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 附件接口要求登录态：把 token 作为查询参数带上（也可换 cookie 方案）
  createAuthPlugin({ token: () => "demo-token-1f2e3d", tokenParam: "access_token" }),
  // 无权限/失效时给一个明确角标，而不是一张裂图
  createErrorBadgePlugin({ text: "无权限", position: "top-right" }),
  createGalleryPlugin({ enableLightbox: true, buttonText: "放大", overlayZIndex: 15 }),
]);

const FILES = [
  { id: 1, name: "现场照片-1.jpg", src: "http://127.0.0.1:3200/protected/image" },
  { id: 2, name: "现场照片-2.jpg", src: "http://127.0.0.1:3200/protected/image" },
  { id: 3, name: "截图-过期凭证.jpg", src: "http://127.0.0.1:3200/protected/image?access_token=expired-token" },
];

export default function TicketAttachments() {
  return (
    <div style={STAGE}>
      <p style={HEAD}>工单 #A-2048 · 附件 3 个</p>
      <div style={ROW}>
        {FILES.map((f) => (
          <figure key={f.id} style={CELL}>
            <Lazy
              src={f.src}
              alt={f.name}
              loading="lazy"
              containerStyle={{ width: "100%", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <figcaption style={CAP}>{f.name}</figcaption>
          </figure>
        ))}
      </div>
      <p style={HINT}>
        第三张故意用了过期凭证：返回 401 <code>invalid_token</code>，右上角出现「无权限」角标。
        需要演示站受保护接口在跑（pnpm serve:demo）。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const HEAD: CSSProperties = { margin: "0 0 10px", color: "#333", fontSize: 12 };
const ROW: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 };
const CELL: CSSProperties = { margin: 0 };
const CAP: CSSProperties = { display: "block", marginTop: 5, color: "#9c9c9c", fontSize: 10 };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#9c9c9c", fontSize: 10.5, lineHeight: 1.7 };
