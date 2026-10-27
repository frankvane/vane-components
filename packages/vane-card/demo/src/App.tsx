import {
  CardCore,
  withPlugins,
  createImagePlugin,
  createHoverPlugin,
  createBadgePlugin,
  createActionsPlugin,
} from "vane-card";

// 消费者视角：从包名导入，与真实项目写法一致（demo 别名会把 vane-card 指回 src）
const ProductCard = withPlugins(CardCore, {
  plugins: [
    createImagePlugin(),
    createHoverPlugin(),
    createBadgePlugin({ text: "热卖" }),
    createActionsPlugin({ showCartButton: true, showWishlistButton: true }),
  ],
});

interface ProductData {
  id: string;
  name: string;
  price: number;
  image: string;
}

export default function App() {
  const data: ProductData = {
    id: "s1",
    name: "示例商品 · C1 本地源码联调",
    price: 99,
    image: "https://via.placeholder.com/300x200",
  };
  return (
    <div style={{ padding: 24, display: "flex", gap: 16 }}>
      <ProductCard cardId="c1" data={data}>
        <div style={{ padding: 12 }}>
          <div>{data.name}</div>
          <div>¥{data.price}</div>
        </div>
      </ProductCard>
    </div>
  );
}
