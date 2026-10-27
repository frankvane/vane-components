/**
 * 对照页入口：**不** 引入 `vane-card/style.css`。
 *
 * 目的：证明「样式是可选增强」——组件不依赖 class 才有结构，
 * 没引样式表时依然能渲染、能交互、能被读屏软件读到。
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { ProductCard } from "vane-card/compound";

const data = {
  title: "经典圆领T恤",
  subtitle: "新疆长绒棉 · 无样式对照",
  price: 299,
  oldPrice: 399,
  image: "https://via.placeholder.com/600x450",
  inventory: 12,
  tags: ["纯棉", "夏季"],
  rating: 4.6,
  ratingCount: 120,
  features: ["不掉色", "不起球"],
  variants: [{ sku: "TS-RED-M", price: 319, stock: 3, options: { color: "红", size: "M" } }],
};

function App() {
  return (
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
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
