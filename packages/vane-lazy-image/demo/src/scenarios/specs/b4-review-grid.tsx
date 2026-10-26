// 版式参照：淘宝/京东「买家秀」九宫格 —— UGC 图会失效、会带隐私信息、数量不可控
// 装配：兜底图 → 错误徽标 → 打码 → 并发闸控
import {
  LazyLoadImageCore,
  createConcurrencyControlPlugin,
  createErrorBadgePlugin,
  createFallbackImagePlugin,
  createRedactionPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 用户图常年 404：兜一张"图已失效"占位，比破图标体面
  createFallbackImagePlugin({
    fallbackSrc: "https://picsum.photos/seed/vane-review-fallback/300/300",
  }),
  // 兜底之后仍然标一个角标，运营侧能快速定位坏图
  createErrorBadgePlugin({ text: "失效", position: "top-right", persistAfterFallback: true }),
  // 评价图里可能出现手机号/快递单，按区域打码
  createRedactionPlugin({
    enabled: true,
    boxes: [{ x: 0.06, y: 0.62, w: 0.42, h: 0.16 }],
  }),
  createConcurrencyControlPlugin({ maxConcurrent: 4, scope: "global" }),
]);

const REVIEWS = [
  { id: 1, ok: true, text: "实物比图好看，做工扎实" },
  { id: 2, ok: true, text: "物流快，包装完整" },
  { id: 3, ok: false, text: "（这张图已经失效了）" },
  { id: 4, ok: true, text: "第二次回购" },
  { id: 5, ok: true, text: "尺寸合适，客服耐心" },
  { id: 6, ok: true, text: "颜色和描述一致" },
].map((it) => ({
  ...it,
  src: it.ok
    ? `https://picsum.photos/seed/vane-review-${it.id}/300/300`
    : `https://invalid.vane-demo.test/review-${it.id}.jpg`,
}));

export default function ReviewGrid() {
  return (
    <div style={STAGE}>
      {REVIEWS.map((r) => (
        <figure key={r.id} style={CELL}>
          <Lazy
            src={r.src}
            alt={r.text}
            loading="lazy"
            containerStyle={{ width: "100%", borderRadius: 4, overflow: "hidden" }}
            imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <figcaption style={CAP}>{r.text}</figcaption>
        </figure>
      ))}
    </div>
  );
}

const STAGE: CSSProperties = {
  background: "#fff",
  padding: 12,
  borderRadius: 6,
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
};
const CELL: CSSProperties = { margin: 0 };
const CAP: CSSProperties = {
  display: "block",
  marginTop: 4,
  color: "#9c9c9c",
  fontSize: 10,
  lineHeight: 1.4,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
