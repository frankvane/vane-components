// 版式参照：京东搜索结果页 —— 双列商品卡（1:1 主图 + 标题 + 价格 + 店铺 + 销量）
// 装配：内存缓存 → 骨架屏 → 并发闸控 → 淡入
import {
  LazyLoadImageCore,
  createConcurrencyControlPlugin,
  createFadeInPlugin,
  createMemoryCachePlugin,
  createSkeletonPlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 搜索页来回切排序/筛选，同一批主图不该重复请求
  createMemoryCachePlugin({ maxEntries: 240, ttlMs: 15 * 60 * 1000 }),
  createSkeletonPlugin({ type: "shimmer", backgroundColor: "#f2f3f5", highlightColor: "#fafafa" }),
  // 双列 20 个商品同时进视口，压到 6 并发，别把首屏大图挤掉
  createConcurrencyControlPlugin({ maxConcurrent: 6, scope: "global" }),
  createFadeInPlugin({ durationMs: 220 }),
]);

const SKUS = [
  { id: 1, title: "静音无线鼠标 2.4G 双模 办公电竞", price: 69.9, shop: "小米优品", sales: "2.1万" },
  { id: 2, title: "机械键盘 87 键 热插拔 白轴", price: 189, shop: "京东京造", sales: "8531" },
  { id: 3, title: "27 英寸 2K 显示器 IPS 广色域", price: 899, shop: "AOC 旗舰店", sales: "1.2万" },
  { id: 4, title: "USB-C 扩展坞 六合一 4K 60Hz", price: 129, shop: "倍思官方", sales: "3.4万" },
  { id: 5, title: "桌面音箱 蓝牙 5.3 木质", price: 299, shop: "漫步者", sales: "6720" },
  { id: 6, title: "人体工学椅 网布 四向扶手", price: 1099, shop: "西昊旗舰店", sales: "4180" },
].map((it) => ({ ...it, src: `https://picsum.photos/seed/vane-jd-${it.id}/360/360` }));

export default function JdSearchGrid() {
  return (
    <div style={STAGE}>
      <p style={BAR}>鼠标 · 共 12,486 件商品 · 按销量排序</p>
      <div style={GRID}>
        {SKUS.map((sku) => (
          <article key={sku.id} style={CARD}>
            <Lazy
              src={sku.src}
              alt={sku.title}
              loading="lazy"
              containerStyle={{ width: "100%", borderRadius: 8, overflow: "hidden" }}
              imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <p style={PRICE}>
              <span style={SYMBOL}>¥</span>
              {sku.price.toFixed(2)}
            </p>
            <p style={TITLE}>{sku.title}</p>
            <p style={META}>
              {sku.shop} · {sku.sales} 人付款
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#f4f4f4", padding: 12, borderRadius: 6 };
const BAR: CSSProperties = { margin: "0 0 10px", fontSize: 11.5, color: "#8c8c8c" };
const GRID: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const CARD: CSSProperties = {
  background: "#fff",
  borderRadius: 8,
  padding: 8,
  display: "flex",
  flexDirection: "column",
  gap: 5,
};
const PRICE: CSSProperties = { flexShrink: 0, margin: 0, color: "#e1251b", fontSize: 15, fontWeight: 600 };
const SYMBOL: CSSProperties = { fontSize: 11, marginRight: 1 };
const TITLE: CSSProperties = {
  flexShrink: 0,
  margin: 0,
  color: "#1a1a1a",
  fontSize: 11.5,
  lineHeight: 1.45,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
const META: CSSProperties = { flexShrink: 0, margin: 0, color: "#9c9c9c", fontSize: 10.5 };
