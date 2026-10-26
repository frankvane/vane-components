// 版式参照：社交产品「关注推荐」头像列表 —— 几十个小图，单个失败不能塌
// 装配：裁剪 → 兜底图 → 失败重试
import {
  LazyLoadImageCore,
  createCropPlugin,
  createFallbackImagePlugin,
  createRetryOnErrorPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  createCropPlugin({ enabled: true, focusPoint: { x: 0.5, y: 0.45 } }),
  // 头像失败两次后回退成默认剪影
  createRetryOnErrorPlugin({ maxRetries: 2, baseDelayMs: 300, jitter: true }),
  createFallbackImagePlugin({
    fallbackSrc: "https://picsum.photos/seed/vane-avatar-fallback/120/120",
  }),
]);

const PEOPLE = [
  { id: 1, name: "林一", tag: "你关注的人也关注了他" },
  { id: 2, name: "周周", tag: "同城 · 摄影" },
  { id: 3, name: "阿满", tag: "共同好友 6" },
  { id: 4, name: "Vane", tag: "你关注的人" },
  { id: 5, name: "小柯", tag: "同城 · 设计" },
  { id: 6, name: "老陈", tag: "热门博主" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-follow-${it.id}/120/120` }));

export default function FollowAvatars() {
  return (
    <div style={STAGE}>
      {PEOPLE.map((p) => (
        <div key={p.id} style={ROW}>
          <div style={AVATAR}>
            <Lazy
              src={p.src}
              alt={`${p.name} 的头像`}
              loading="lazy"
              containerStyle={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
          <div style={TEXT}>
            <p style={NAME}>{p.name}</p>
            <p style={TAG}>{p.tag}</p>
          </div>
          <button type="button" style={BTN}>
            关注
          </button>
        </div>
      ))}
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 12, borderRadius: 6, display: "grid", gap: 8 };
const ROW: CSSProperties = { display: "flex", alignItems: "center", gap: 10 };
const AVATAR: CSSProperties = { width: 38, height: 38, flex: "0 0 38px" };
const TEXT: CSSProperties = { flex: 1, minWidth: 0 };
const NAME: CSSProperties = { margin: 0, color: "#1a1a1a", fontSize: 12 };
const TAG: CSSProperties = {
  margin: "2px 0 0",
  color: "#9c9c9c",
  fontSize: 10.5,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const BTN: CSSProperties = {
  font: "inherit",
  fontSize: 11,
  padding: "4px 12px",
  borderRadius: 999,
  border: "1px solid #ff2442",
  color: "#ff2442",
  background: "transparent",
  cursor: "pointer",
};
