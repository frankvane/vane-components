import {
  CardCore,
  withPlugins,
  createImagePlugin,
  createHoverPlugin,
  createSKUPlugin,
  createQuantityPlugin,
  createPriceCalculatorPlugin,
} from "vane-card";
import { ProductCard } from "vane-card/compound";

// 消费者视角：从包名导入，与真实项目写法一致（demo 别名会把 vane-card 指回 src）
const SkuCard = withPlugins(CardCore, {
  plugins: [
    createImagePlugin(),
    createHoverPlugin(),
    createSKUPlugin({
      attributes: [
        { name: "color", options: ["红", "蓝"] },
        { name: "size", options: ["M", "L"] },
      ],
      variants: [
        { sku: "TS-RED-M", attrs: { color: "红", size: "M" }, price: 319, stock: 3 },
        { sku: "TS-BLUE-L", attrs: { color: "蓝", size: "L" }, price: 299, stock: 40 },
      ],
    }),
    createQuantityPlugin(),
    createPriceCalculatorPlugin(),
  ],
});

const data = {
  title: "经典圆领T恤",
  subtitle: "新疆长绒棉 · 260g",
  price: 299,
  oldPrice: 399,
  image: "https://via.placeholder.com/600x450",
  inventory: 12,
  tags: ["纯棉", "夏季"],
  rating: 4.6,
  ratingCount: 120,
  features: ["不掉色", "不起球", "透气"],
  colors: [{ name: "红", hex: "#d0021b" }, { name: "蓝", hex: "#007aff" }],
  variants: [
    { sku: "TS-RED-M", price: 319, stock: 3, options: { color: "红", size: "M" } },
    { sku: "TS-BLUE-L", price: 299, stock: 40, options: { color: "蓝", size: "L" } },
  ],
};

export default function App() {
  return (
    <div style={{ padding: 24, display: "grid", gap: 24 }}>
      <section>
        <h2 style={{ fontSize: 14, color: "#666", margin: "0 0 8px" }}>
          复合组件（38 个子组件，样式来自 style.css）
          <a href="/demo/no-style.html" style={{ marginLeft: 12, fontSize: 12 }}>
            → 不引样式的对照页
          </a>
        </h2>
        <div style={{ maxWidth: 380 }}>
          <ProductCard productId="c1" data={data}>
            <ProductCard.Image />
            <ProductCard.Badge />
            <ProductCard.Title />
            <ProductCard.Subtitle />
            <ProductCard.Price />
            <ProductCard.OldPrice />
            <ProductCard.Tags />
            <ProductCard.Rating />
            <ProductCard.FeatureList />
            <ProductCard.ColorSwatches />
            <ProductCard.VariantSelector />
            <ProductCard.StockBadge />
            <ProductCard.QuantityStepper />
            <ProductCard.Actions />
          </ProductCard>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 14, color: "#666", margin: "0 0 8px" }}>
          插件视角（withPlugins 包装 CardCore）
        </h2>
        <div style={{ maxWidth: 380 }}>
          <SkuCard cardId="c2" data={data}>
            <div style={{ padding: 12 }}>
              <div>{data.title}</div>
              <div>¥{data.price}</div>
            </div>
          </SkuCard>
        </div>
      </section>
    </div>
  );
}
