// 版式参照：跨境站点商品卡 —— 同一张图 5 种语言的价格与文案
// 装配：本地化 → 价格标签
import {
  LazyLoadImageCore,
  createLocalizationPlugin,
  createPriceTagPlugin,
  withPlugins,
} from "vane-lazy-image";
import React from "react";
import type { CSSProperties } from "react";

const SRC = "https://picsum.photos/seed/vane-i18n/320/320";

const LOCALES = [
  { code: "zh-CN", currency: "¥", price: 899, name: "27 英寸 2K 显示器" },
  { code: "en-US", currency: "$", price: 129, name: '27" 2K Monitor' },
  { code: "ja-JP", currency: "￥", price: 19800, name: "27インチ 2K モニター" },
  { code: "de-DE", currency: "€", price: 119, name: '27" 2K Monitor' },
];

// 每个 locale 一张卡：价格符号与文案随 locale 变，图源不变（同一 SKU）
function Card({ item }: { item: (typeof LOCALES)[number] }) {
  const Lazy = React.useMemo(
    () =>
      withPlugins(LazyLoadImageCore as any, [
        // localeMap 把语言映射到对应语言的图源（这里是同一张 SKU 底图）
        createLocalizationPlugin({
          localeMap: { "zh-CN": SRC, "en-US": SRC, "ja-JP": SRC, "de-DE": SRC },
          defaultLocale: "zh-CN",
          currentLocale: item.code,
          autoDetect: false,
        }),
        createPriceTagPlugin({
          price: item.price,
          currency: item.currency,
          position: "bottom-right",
        }),
      ]),
    [item.code, item.price, item.currency],
  );

  return (
    <figure style={CELL}>
      <Lazy
        src={SRC}
        alt={item.name}
        loading="lazy"
        containerStyle={{ width: "100%", borderRadius: 4, overflow: "hidden" }}
        imageStyle={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <figcaption style={CAP}>
        <b style={LOCALE}>{item.code}</b>
        {item.name}
      </figcaption>
    </figure>
  );
}

export default function MultiCurrency() {
  return (
    <div style={STAGE}>
      <div style={GRID}>
        {LOCALES.map((item) => (
          <Card key={item.code} item={item} />
        ))}
      </div>
    </div>
  );
}

const STAGE: CSSProperties = { background: "#fff", padding: 14, borderRadius: 6 };
const GRID: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 };
const CELL: CSSProperties = { margin: 0 };
const CAP: CSSProperties = {
  display: "block",
  marginTop: 5,
  color: "#333",
  fontSize: 10.5,
  lineHeight: 1.5,
};
const LOCALE: CSSProperties = { display: "block", color: "#9c9c9c", fontSize: 10, marginBottom: 2 };
