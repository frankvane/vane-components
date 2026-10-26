// 版式参照：YouTube 播放页右侧「接下来播放」—— 单列小图，滚动期间挂起请求
// 装配：滚动空闲 → 视口感知 → 内存缓存
import {
  LazyLoadImageCore,
  createMemoryCachePlugin,
  createScrollIdlePlugin,
  createViewportAwarePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 滚动过程中一帧发十几个请求会把主视频的带宽抢光，等滚动停 120ms 再放行
  createScrollIdlePlugin({ idleMs: 120, onlyWhenIntersecting: true, maxWaitMs: 900 }),
  createViewportAwarePlugin({ rootMargin: "160px", once: true }),
  // 来回切视频时同一批封面不重复请求
  createMemoryCachePlugin({ maxEntries: 80, ttlMs: 20 * 60 * 1000 }),
]);

const NEXT_UP = [
  { id: 1, title: "浏览器渲染流水线全解", ch: "渲染实验室", meta: "38 万次观看 · 3 天前" },
  { id: 2, title: "为什么你的图片总是在跳", ch: "CLS 观察", meta: "12 万次观看 · 1 周前" },
  { id: 3, title: "IndexedDB 做图片缓存实操", ch: "存储笔记", meta: "8.9 万次观看 · 2 周前" },
  { id: 4, title: "并发控制：令牌桶还是信号量", ch: "调度员", meta: "6.2 万次观看 · 3 周前" },
  { id: 5, title: "一次真实的弱网事故复盘", ch: "断网实验室", meta: "5.1 万次观看 · 1 月前" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-next-${it.id}/240/135` }));

export default function WatchSideList() {
  return (
    <div style={STAGE}>
      <ul style={LIST}>
        {NEXT_UP.map((it) => (
          <li key={it.id} style={ITEM}>
            <div style={THUMB}>
              <Lazy
                src={it.src}
                alt={it.title}
                loading="lazy"
                containerStyle={{ width: "100%", height: "100%", borderRadius: 6, overflow: "hidden" }}
                imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
            <div style={TEXT}>
              <p style={TITLE}>{it.title}</p>
              <p style={META}>{it.ch}</p>
              <p style={META}>{it.meta}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#0f0f0f", padding: 14, borderRadius: 6 };
const LIST: CSSProperties = { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 };
const ITEM: CSSProperties = { display: "flex", gap: 10 };
const THUMB: CSSProperties = { flex: "0 0 120px", height: 68 };
const TEXT: CSSProperties = { minWidth: 0 };
const TITLE: CSSProperties = {
  margin: 0,
  color: "#f1f1f1",
  fontSize: 12.5,
  lineHeight: 1.4,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
const META: CSSProperties = { margin: "3px 0 0", color: "#9a9a9a", fontSize: 11 };
