// 版式参照：新浪 / 网易新闻首页 —— 头条大图 + 列表小图混排
// 装配：首屏优先 → 响应式 srcset → 视口防抖
import {
  LazyLoadImageCore,
  createPriorityLoadingPlugin,
  createResponsivePlugin,
  createViewportDebouncePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 头条图是唯一的 LCP 元素
  createPriorityLoadingPlugin({ priority: "high" }),
  // 新闻图大多 16:9，按容器宽度挑 400/800/1200
  createResponsivePlugin({
    variants: [{ width: 400 }, { width: 800 }, { width: 1200 }],
    sizes: "(max-width: 720px) 100vw, 560px",
  }),
  // 列表在快速滚动时先不发请求，停稳 160ms 再说
  createViewportDebouncePlugin({ debounceMs: 160, onlyWhenIntersecting: true, maxWaitMs: 900 }),
]);

const LIST = [
  { id: 1, title: "多地推进老旧小区改造，今年计划开工 5.2 万个", tag: "要闻" },
  { id: 2, title: "国产大模型开源生态再添一员，参数规模 70B", tag: "科技" },
  { id: 3, title: "秋粮收购进度过半，主产区价格总体平稳", tag: "财经" },
  { id: 4, title: "城市轨道交通新规发布，明年起施行", tag: "社会" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-news-${it.id}/240/135` }));

export default function NewsMixed() {
  return (
    <div style={STAGE}>
      <article style={LEAD}>
        <Lazy
          src="https://picsum.photos/seed/vane-news-lead/1200/675"
          alt="头条配图"
          loading="eager"
          containerStyle={{ width: "100%", borderRadius: 4, overflow: "hidden" }}
          imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <h4 style={LEAD_TITLE}>把图片加载顺序理顺之后，首屏快了 1.4 秒</h4>
        <p style={LEAD_META}>2024-10-26 09:12 · 科技频道</p>
      </article>
      <ul style={UL}>
        {LIST.map((it) => (
          <li key={it.id} style={LI}>
            <div style={THUMB}>
              <Lazy
                src={it.src}
                alt={it.title}
                loading="lazy"
                containerStyle={{ width: "100%", height: "100%", borderRadius: 3, overflow: "hidden" }}
                imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
            <div style={TEXT}>
              <p style={TITLE}>{it.title}</p>
              <p style={TAG}>{it.tag}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const LEAD: CSSProperties = { marginBottom: 14 };
const LEAD_TITLE: CSSProperties = { margin: "8px 0 0", color: "#1a1a1a", fontSize: 15, lineHeight: 1.45 };
const LEAD_META: CSSProperties = { margin: "4px 0 0", color: "#9c9c9c", fontSize: 10.5 };
const UL: CSSProperties = { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 };
const LI: CSSProperties = { display: "flex", gap: 10 };
const THUMB: CSSProperties = { flex: "0 0 96px", height: 54 };
const TEXT: CSSProperties = { minWidth: 0 };
const TITLE: CSSProperties = {
  margin: 0,
  color: "#1a1a1a",
  fontSize: 12,
  lineHeight: 1.5,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
const TAG: CSSProperties = { margin: "3px 0 0", color: "#c0392b", fontSize: 10 };
