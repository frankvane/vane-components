/**
 * 04 · 下图布局（图在下）
 *
 * 少数派但有用：当**文字比图更重要**时（内容型商品、课程、票务、服务类），
 * 把标题和价格放上面，图变成佐证而不是主角。
 *
 * 注意：这类卡片放在列表里时，图的高度必须固定，否则「文字行数不同」
 * 会让每张卡的图起点不在同一水平线上，整片列表看着参差。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import { createHoverPlugin } from "vane-card/custom-plugins";
import { TEE } from "../data/seed";
import type { LayoutMeta } from "./types";

export const meta: LayoutMeta = {
  id: "bottom-image",
  title: "下图布局",
  en: "bottom-image",
  use: "文字比图重要的类目：课程、票务、服务、内容 —— 标题决定点不点，图只是佐证。",
  width: 280,
  structure: [
    "文字区在上，先给「是什么、多少钱」；图在下当佐证",
    "图高固定（16:9）而不是按比例：否则文字行数不同，一列卡片的图起点会参差",
    "适合配合「一行说明」使用 —— 这类卡的说服力在文字，不在图",
  ],
  plugins: ["Hover"],
};

const Card = withPlugins(CardCore, {
  plugins: [createHoverPlugin({ enableShadow: true })],
});

export default function BottomImageLayout() {
  return (
    <Card
      cardId="layout-bottom-image"
      data={TEE}
      padding={0}
      containerStyle={{ background: "#fff", borderRadius: 12, overflow: "hidden" }}
    >
      <div style={{ padding: "14px 14px 10px", display: "grid", gap: 6 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "#5f6553" }}>
          {TEE.brand}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>{TEE.title}</div>
        <div style={{ fontSize: 12, color: "#6b6b6b", lineHeight: 1.5 }}>{TEE.subtitle}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
          <b style={{ fontSize: 20, color: "#d0021b", fontVariantNumeric: "tabular-nums" }}>
            ¥{TEE.price}
          </b>
          <span style={{ fontSize: 11, color: "#5f6553" }}>起</span>
        </div>
      </div>
      <img
        src={TEE.image}
        alt=""
        style={{
          display: "block",
          width: "100%",
          height: 110,
          objectFit: "cover",
        }}
      />
    </Card>
  );
}
