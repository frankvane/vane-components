// 版式参照：后台表格里的「图片列」—— 行高固定，图失败不能撑破行
// 装配：骨架屏 → 兜底图 → 错误徽标
import {
  LazyLoadImageCore,
  createErrorBadgePlugin,
  createFallbackImagePlugin,
  createSkeletonPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 固定 32px 高：骨架与最终图同尺寸，行高不会跳
  createSkeletonPlugin({ type: "pulse", backgroundColor: "#f2f3f5", highlightColor: "#fafbfc", borderRadius: 3 }),
  createFallbackImagePlugin({
    fallbackSrc: "https://picsum.photos/seed/vane-cell-fallback/96/64",
  }),
  createErrorBadgePlugin({ text: "!", position: "top-right", fontSize: 9 }),
]);

const ROWS = [
  { id: "SKU-1001", name: "亚麻衬衫", src: "https://picsum.photos/seed/vane-cell-1/96/64", stock: 42 },
  { id: "SKU-1002", name: "羊毛围巾", src: "https://picsum.photos/seed/vane-cell-2/96/64", stock: 7 },
  { id: "SKU-1003", name: "帆布托特包", src: "https://invalid.vane-demo.test/cell.jpg", stock: 0 },
];

export default function TableImageCell() {
  return (
    <div style={STAGE}>
      <div style={TABLE}>
        <div style={HEAD}>
          <span>商品</span>
          <span>库存</span>
        </div>
        {ROWS.map((r) => (
          <div key={r.id} style={ROW}>
            <span style={CELL_LEFT}>
              <span style={THUMB}>
                <Lazy
                  src={r.src}
                  alt={r.name}
                  loading="lazy"
                  containerStyle={{ width: "100%", height: "100%" }}
                  imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </span>
              <span>
                <b style={NAME}>{r.name}</b>
                <span style={ID}>{r.id}</span>
              </span>
            </span>
            <span style={{ color: r.stock === 0 ? "#c0392b" : "#333" }}>{r.stock}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const TABLE: CSSProperties = { border: "1px solid #eee", borderRadius: 4, overflow: "hidden" };
const HEAD: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 0.6fr",
  padding: "7px 10px",
  background: "#fafafa",
  color: "#8c8c8c",
  fontSize: 10.5,
};
const ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 0.6fr",
  alignItems: "center",
  padding: "6px 10px",
  borderTop: "1px solid #f2f2f2",
  fontSize: 11.5,
};
const CELL_LEFT: CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const THUMB: CSSProperties = { width: 44, height: 32, flex: "0 0 44px", borderRadius: 3, overflow: "hidden" };
const NAME: CSSProperties = { display: "block", color: "#333", fontSize: 11.5, fontWeight: 500 };
const ID: CSSProperties = { color: "#9c9c9c", fontSize: 10 };
