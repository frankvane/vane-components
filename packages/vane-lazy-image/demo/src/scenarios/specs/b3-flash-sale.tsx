// 版式参照：京东秒杀会场 —— 主推商品大图 + 价格标签 + 促销徽标 + 库存紧张 + 加载进度
// 装配：价格标签 → 促销徽标 → 库存状态 → 优先级 → 进度蒙层
import {
  LazyLoadImageCore,
  createBadgePlugin,
  createInventoryStatusPlugin,
  createPriceTagPlugin,
  createPriorityLoadingPlugin,
  createProgressOverlayPlugin,
  createPromoBadgePlugin,
  withPlugins,
} from "vane-lazy-image";
import type { CSSProperties } from "react";

const Lazy = withPlugins(LazyLoadImageCore as any, [
  // 秒杀主图是会场唯一的大图，优先级拉满
  createPriorityLoadingPlugin({ priority: "high" }),
  // 价格由接口下发：这里用静态价示范，真实项目接 fetchPrice
  createPriceTagPlugin({
    price: 1299,
    originalPrice: 2599,
    discount: "5 折",
    currency: "¥",
    position: "bottom-left",
    showSavings: true,
  }),
  createPromoBadgePlugin({ type: "hot", text: "限时秒杀", position: "top-left", pulse: true }),
  createInventoryStatusPlugin({ status: "low-stock", stockCount: 7, lowStockThreshold: 10 }),
  // 大图 + 慢网：给一个真实的百分比进度，比转圈更让人愿意等
  createProgressOverlayPlugin({ showWhen: "loading", height: 4, color: "#e1251b", showPercentText: true }),
  createBadgePlugin({ text: "已售 2.3 万件", position: "bottom-right", bgColor: "rgba(0,0,0,.55)" }),
]);

export default function FlashSale() {
  return (
    <div style={STAGE}>
      <div style={HEAD}>
        <strong style={TITLE}>整点秒杀</strong>
        <span style={COUNT}>距结束 00:42:17</span>
      </div>
      <div style={CARD}>
        <Lazy
          src="https://picsum.photos/seed/vane-flash/720/540"
          alt="秒杀主推商品"
          loading="eager"
          containerStyle={{ width: "100%",
 aspectRatio: "720 / 540", borderRadius: 6, overflow: "hidden" }}
          imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <p style={NAME}>人体工学椅 · 网布四向扶手 · 带脚踏</p>
      <p style={HINT}>
        价格标签显示省钱额，促销徽标呼吸、库存标「仅剩 7 件」、底部进度条走真实加载百分比——
        四个叠层插件同时挂在一个容器上，互不遮挡。
      </p>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff5f3", padding: 14, borderRadius: 6 };
const HEAD: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 10,
};
const TITLE: CSSProperties = { color: "#e1251b", fontSize: 14 };
const COUNT: CSSProperties = { color: "#a8621f", fontSize: 11.5 };
const CARD: CSSProperties = { position: "relative", borderRadius: 6, overflow: "hidden" };
const NAME: CSSProperties = { margin: "10px 0 0", color: "#1a1a1a", fontSize: 12.5 };
const HINT: CSSProperties = { margin: "8px 0 0", color: "#9c8a80", fontSize: 11, lineHeight: 1.7 };
