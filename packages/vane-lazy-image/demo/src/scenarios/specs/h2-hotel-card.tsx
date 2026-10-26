// 版式参照：酒店列表卡 —— 会员价 + 促销标 + 剩余房量角标
// 装配：价格标签 → 促销徽标 → 角标
import {
  LazyLoadImageCore,
  createBadgePlugin,
  createPriceTagPlugin,
  createPromoBadgePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 会员价：划线原价 + 折扣文案
  createPriceTagPlugin({
    price: 486,
    originalPrice: 920,
    discount: "会员 5.3 折",
    currency: "¥",
    position: "bottom-left",
    backgroundColor: "#1f6feb",
  }),
  createPromoBadgePlugin({ type: "hot", text: "限时特惠", position: "top-left" }),
  createBadgePlugin({
    text: "仅剩 2 间",
    position: "top-right",
    bgColor: "rgba(192,57,43,.9)",
    borderRadius: 2,
  }),
]);

export default function HotelCard() {
  return (
    <div style={STAGE}>
      <article style={CARD}>
        <div style={MEDIA}>
          <Lazy
            src="https://picsum.photos/seed/vane-hotel/640/400"
            alt="江景大床房"
            loading="lazy"
            containerStyle={{ width: "100%", height: "100%" }}
            imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
        <div style={BODY}>
          <h4 style={NAME}>外滩·江景大床房 · 含双早</h4>
          <p style={META}>4.8 分 · 1,204 条评价 · 距地铁 320m</p>
          <p style={TAGS}>免费取消 · 到店付 · 发票</p>
        </div>
      </article>
      <p style={HINT}>
        三个插件分别贴在左下、左上、右上——同一条房源图上有三个独立叠层，
        这正是"插件式"和"写死组件"的差别。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const CARD: CSSProperties = { borderRadius: 6, overflow: "hidden", border: "1px solid #eee" };
const MEDIA: CSSProperties = { height: 150, position: "relative" };
const BODY: CSSProperties = { padding: 10 };
const NAME: CSSProperties = { margin: 0, color: "#1a1a1a", fontSize: 13 };
const META: CSSProperties = { margin: "4px 0 0", color: "#7b7b7b", fontSize: 10.5 };
const TAGS: CSSProperties = { margin: "6px 0 0", color: "#1f6feb", fontSize: 10.5 };
const HINT: CSSProperties = { margin: "10px 0 0", color: "#9c9c9c", fontSize: 10.5, lineHeight: 1.7 };
