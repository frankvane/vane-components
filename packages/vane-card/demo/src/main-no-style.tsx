/**
 * 对照页入口：**不** 引入 `vane-card/style.css`。
 *
 * 目的：证明「样式是可选增强」—— 组件不依赖 class 才有结构，
 * 没引样式表时依然能渲染、能交互、能被读屏软件读到。
 *
 * 图仍用本地生成的 SVG（和主站同源），否则这一页会因为外链图 404
 * 而看起来「比引了样式还坏」，那就不是在验证样式，而是在验证网络。
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { ProductCard } from "vane-card/compound";
import { svgImage } from "./data/images";

const data = {
  title: "经典圆领 T 恤",
  subtitle: "新疆长绒棉 · 无样式对照",
  description: "这一页刻意不引 vane-card/style.css：结构还在，皮肤没有。",
  price: 299,
  oldPrice: 399,
  image: svgImage({ label: "无样式对照", hue: 96 }),
  inventory: 12,
  rating: 4.6,
  ratingCount: 128,
  tags: ["纯棉", "夏季"],
  features: ["不掉色", "不起球", "透气"],
  colors: [
    { name: "赤陶", hex: "#b4553c" },
    { name: "橄榄", hex: "#6b7245" },
  ],
  sizes: ["M", "L"],
  variants: [
    { sku: "TS-RED-M", attrs: { 颜色: "赤陶", 尺码: "M" }, price: 319, stock: 3 },
    { sku: "TS-OLIVE-L", attrs: { 颜色: "橄榄", 尺码: "L" }, price: 299, stock: 0 },
  ],
};

function App() {
  return (
    <div style={{ maxWidth: 380 }}>
      <ProductCard productId="no-style-1" data={data}>
        <ProductCard.Image />
        <ProductCard.Title />
        <ProductCard.Subtitle />
        <ProductCard.Price />
        <ProductCard.OldPrice />
        <ProductCard.Tags />
        <ProductCard.Rating />
        <ProductCard.FeatureList />
        <ProductCard.VariantSelector />
        <ProductCard.Actions />
      </ProductCard>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
