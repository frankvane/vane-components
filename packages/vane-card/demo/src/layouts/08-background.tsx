/**
 * 08 · 背景图布局
 *
 * 图当背景、字压在图上。只有一个硬要求：**文字必须可读**。
 * 压在亮图上的白字、压在暗图上的黑字，都是靠运气 —— 所以要一层遮罩。
 *
 * 这里用「左下角更暗」的斜向渐变，而不是整张压黑：
 * 整张压黑会让图失去意义，斜向渐变只压文字所在的那一半，图的主体还看得见。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import { createHoverPlugin } from "vane-card/custom-plugins";
import { svgPlate } from "../data/images";
import { CHAIR } from "../data/seed";
import type { LayoutMeta } from "./types";

/** 背景图不能用带标签的图：中心的大字会和压在上面的文案叠成一团 */
const BACKDROP = svgPlate({ width: 1000, height: 640, hue: 96 });

export const meta: LayoutMeta = {
  id: "background",
  title: "背景图布局",
  en: "background",
  use: "活动海报、品牌大片、专题封面 —— 图就是内容，文字压在上面。",
  width: 420,
  structure: [
    "遮罩用斜向渐变而不是整张压黑：只压文字所在的左下角，图的主体保留",
    "高度用 minHeight 而不是固定高：文案长度变化时不裁字",
    "白字必须配一层遮罩才有保障 —— 依赖「这张图够暗」是运气，不是设计",
  ],
  plugins: ["Hover"],
  tone: "dark",
};

const Card = withPlugins(CardCore, {
  plugins: [createHoverPlugin({ enableShadow: true, shadowIntensity: "medium" })],
});

export default function BackgroundImageLayout() {
  return (
    <Card
      cardId="layout-background"
      data={CHAIR}
      padding={0}
      containerStyle={{
        position: "relative",
        minHeight: 240,
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
        backgroundImage: `url("${BACKDROP}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* 遮罩：单独一层，方便以后换成「按需压暗」的变量 */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(28deg, rgba(12, 16, 10, 0.86) 0%, rgba(12, 16, 10, 0.55) 42%, rgba(12, 16, 10, 0.06) 78%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", padding: "22px 24px", display: "grid", gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255, 255, 255, 0.72)",
          }}
        >
          {CHAIR.brand}
        </span>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.25 }}>
          {CHAIR.title}
        </div>
        <div style={{ fontSize: 12.5, color: "rgba(255, 255, 255, 0.78)", lineHeight: 1.6 }}>
          {CHAIR.subtitle}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
          <b style={{ fontSize: 20, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
            ¥{CHAIR.price}
          </b>
          <button
            type="button"
            style={{
              padding: "7px 16px",
              borderRadius: 999,
              border: "1px solid rgba(255, 255, 255, 0.55)",
              background: "rgba(255, 255, 255, 0.12)",
              color: "#fff",
              fontSize: 12.5,
              cursor: "pointer",
              backdropFilter: "blur(6px)",
            }}
          >
            查看详情
          </button>
        </div>
      </div>
    </Card>
  );
}
