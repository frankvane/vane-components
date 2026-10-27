/**
 * 06 · 网格紧凑
 *
 * 同一屏塞更多条。代价是「每条的信息量必须砍到骨头」：图 + 两行标题 + 价格，
 * 再多一个字段就会换行、破坏网格对齐。
 *
 * 这类卡常见错误是字号还按普通卡来（15/20），结果 170 宽的卡里字比图还重。
 * 紧凑网格的字号要整体降一级，价格也不能用 20px。
 *
 * 图这里手写 <img> 而不是装 ImagePlugin：插件挂在 children **之后**渲染，
 * 会把图放到标题下面；版式要的是「图在上」，所以结构得自己写。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import { createHoverPlugin } from "vane-card/custom-plugins";
import { MUG } from "../data/seed";
import type { LayoutMeta } from "./types";

export const meta: LayoutMeta = {
  id: "grid-compact",
  title: "网格紧凑",
  en: "grid",
  use: "首页猜你喜欢、活动会场、比价列表 —— 一屏尽量多，单条只留决策必需信息。",
  width: 170,
  structure: [
    "字号整体降一级（标题 12.5、价格 14）：170 宽的卡里 15px 标题会压过图",
    "标题固定 2 行高度（2.8em），行数不固定会让整个网格参差",
    "图 1:1 通栏；只有三个字段，多一个就换行破坏对齐",
  ],
  plugins: ["Hover"],
};

const Card = withPlugins(CardCore, {
  plugins: [createHoverPlugin({ enableShadow: true, shadowIntensity: "light" })],
});

export default function GridLayout() {
  return (
    <Card
      cardId="layout-grid"
      data={MUG}
      padding={0}
      containerStyle={{ background: "#fff", borderRadius: 10, overflow: "hidden" }}
    >
      <img
        src={MUG.image}
        alt=""
        style={{ display: "block", width: "100%", aspectRatio: "1 / 1", objectFit: "cover" }}
      />
      <div style={{ padding: "8px 8px 10px", display: "grid", gap: 4 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            lineHeight: 1.4,
            height: "2.8em",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {MUG.title}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <b style={{ fontSize: 14, color: "#d0021b", fontVariantNumeric: "tabular-nums" }}>
            ¥{MUG.price}
          </b>
          <span style={{ fontSize: 10.5, color: "#b5b5b5" }}>{MUG.ratingCount} 人买过</span>
        </div>
      </div>
    </Card>
  );
}
