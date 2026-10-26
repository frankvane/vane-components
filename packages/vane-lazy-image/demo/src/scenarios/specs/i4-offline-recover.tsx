// 版式参照：地铁 / 电梯里断网 —— 断网占位、恢复后自动重试、失败可追踪
// 装配：离线占位 → 失败重试 → 错误追踪
import {
  LazyLoadImageCore,
  createErrorTrackingPlugin,
  createOfflinePlugin,
  createRetryOnErrorPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 断网时切内置 SVG 占位；联网后自动重新取图（warm 会在恢复时预热）
  createOfflinePlugin({ cacheName: "vane-lazy-image-offline", warm: true, showBadge: true }),
  // 网络抖动导致的失败按指数退避重试
  createRetryOnErrorPlugin({ maxRetries: 3, baseDelayMs: 500, jitter: true }),
  // 重试也没救回来的，记一笔（真实项目换成上报端点）
  createErrorTrackingPlugin({
    report: (payload: unknown) => {
      const q = ((window as unknown as { __vaneOfflineErrors?: unknown[] }).__vaneOfflineErrors ??= []);
      q.push(payload);
    },
  }),
]);

const LIST = Array.from({ length: 3 }, (_, i) => ({
  id: i + 1,
  title: `离线可读文章 ${i + 1}`,
  src: `https://picsum.photos/seed/vane-net-${i + 1}/320/200`,
}));

export default function OfflineRecover() {
  return (
    <div style={STAGE}>
      <div style={ROW}>
        {LIST.map((it) => (
          <figure key={it.id} style={CELL}>
            <Lazy
              src={it.src}
              alt={it.title}
              loading="lazy"
              containerStyle={{ width: "100%", aspectRatio: "320 / 200", borderRadius: 4, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <figcaption style={CAP}>{it.title}</figcaption>
          </figure>
        ))}
      </div>
      <p style={HINT}>
        复现步骤：DevTools 勾 Offline → 刷新 → 出现离线占位；取消 Offline → 无需刷新，
        重试机制会把图补回来。<code>window.__vaneOfflineErrors</code> 里是失败记录。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const ROW: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 };
const CELL: CSSProperties = { margin: 0 };
const CAP: CSSProperties = { display: "block", marginTop: 5, color: "#333", fontSize: 10.5 };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#9c9c9c", fontSize: 10.5, lineHeight: 1.7 };
