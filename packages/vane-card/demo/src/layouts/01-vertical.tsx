/**
 * 01 · 垂直布局
 *
 * 图在上、文在下的默认形态。它之所以是默认，是因为「图先说话」：
 * 用户扫列表时先看图能不能勾住注意力，再看标题，最后看价格。
 *
 * 这一页刻意不用 ImagePlugin 而手写 <img>：版式要控制精确比例（4:3 裁切），
 * 而插件只负责「读哪张图」，不负责「图占多大」。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import { createBadgePlugin, createHoverPlugin } from "vane-card/custom-plugins";
import { TEE } from "../data/seed";
import type { LayoutMeta } from "./types";

export const meta: LayoutMeta = {
  id: "vertical",
  title: "垂直布局",
  en: "vertical",
  use: "商品列表、搜索结果、内容卡片 —— 最通用的一种，也是默认形态。",
  width: 280,
  structure: [
    "图通栏 + 固定 4:3 裁切：不同来源的图（1:1 / 3:4 / 横图）进来都不会把卡片撑成不同高度",
    "图本身不加圆角，圆角交给容器的 overflow: hidden —— 否则「圆角里套圆角」",
    "价格单独一行、不折行：列表里扫视靠的就是价格永远在同一个位置",
  ],
  plugins: ["Badge", "Hover"],
};

const Card = withPlugins(CardCore, {
  plugins: [
    createBadgePlugin({ text: "热卖", type: "hot" }),
    createHoverPlugin({ enableShadow: true, enableScale: true }),
  ],
});

export default function VerticalLayout() {
  return (
    <Card
      cardId="layout-vertical"
      data={TEE}
      padding={0}
      containerStyle={{ background: "#fff", borderRadius: 12, overflow: "hidden" }}
    >
      <img
        src={TEE.image}
        alt=""
        style={{ display: "block", width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }}
      />
      <div style={{ padding: 14, display: "grid", gap: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>{TEE.title}</div>
        <div style={{ fontSize: 12, color: "#8a8a8a" }}>{TEE.subtitle}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
          <b style={{ fontSize: 20, color: "#d0021b", fontVariantNumeric: "tabular-nums" }}>
            ¥{TEE.price}
          </b>
          {TEE.oldPrice ? (
            <s style={{ fontSize: 12, color: "#bbb" }}>¥{TEE.oldPrice}</s>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
