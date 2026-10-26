// 版式参照：出行 App「离线收藏夹」—— 断网时仍要看到已缓存图
// 装配：IndexedDB 缓存 → 离线占位 → 错误徽标
import {
  LazyLoadImageCore,
  createErrorBadgePlugin,
  createIDBCachePlugin,
  createOfflinePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 收藏夹里的图提前落库，断网也能出（缓存未命中才走网络）
  createIDBCachePlugin({ dbName: "vane-travel", ttlMs: 30 * 24 * 60 * 60 * 1000 }),
  // 监听 online/offline：断网时切到内置 SVG 离线占位，而不是空框
  createOfflinePlugin({ cacheName: "vane-lazy-image-offline", warm: true, showBadge: true }),
  createErrorBadgePlugin({ text: "离线", position: "top-right" }),
]);

const FAVS = [
  { id: 1, name: "杭州 · 龙井村民宿", date: "10-02" },
  { id: 2, name: "厦门 · 沙坡尾公寓", date: "10-05" },
  { id: 3, name: "成都 · 玉林小院", date: "10-11" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-offline-${it.id}/320/200` }));

export default function OfflineFavs() {
  return (
    <div style={STAGE}>
      <p style={HEAD}>我的收藏 · 3 个</p>
      <div style={ROW}>
        {FAVS.map((f) => (
          <figure key={f.id} style={CELL}>
            <Lazy
              src={f.src}
              alt={f.name}
              loading="lazy"
              containerStyle={{ width: "100%",
 aspectRatio: "320 / 200", borderRadius: 5, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <figcaption style={CAP}>
              {f.name}
              <span style={DATE}>{f.date}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p style={HINT}>
        在 DevTools → Network 里勾 Offline 再刷新：首次未缓存的图会出离线占位，
        已缓存的仍能正常显示，右上角出现「离线」角标。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const HEAD: CSSProperties = { margin: "0 0 10px", color: "#1a1a1a", fontSize: 12.5 };
const ROW: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 };
const CELL: CSSProperties = { margin: 0 };
const CAP: CSSProperties = { display: "block", marginTop: 5, color: "#333", fontSize: 10.5 };
const DATE: CSSProperties = { display: "block", color: "#9c9c9c", fontSize: 10 };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#9c9c9c", fontSize: 10.5, lineHeight: 1.7 };
