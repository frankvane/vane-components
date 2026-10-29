/**
 * 03 · 右图布局（图在右）
 *
 * 和横向布局共用一套结构，只是把方向反过来。存在的理由不是「对称好看」，
 * 而是**列表节奏**：一长串卡片全是左图会很单调，穿插右图能让眼睛重新定位。
 *
 * 实现上用 `flexDirection: "row-reverse"` 而不是调换 DOM 顺序 ——
 * 屏幕阅读器与 Tab 顺序仍然先读文字后读图，视觉和语义不必绑在一起。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import { createHoverPlugin } from "vane-card/custom-plugins";
import { CHAIR } from "../data/seed";
import type { LayoutMeta } from "./types";

export const meta: LayoutMeta = {
  id: "right-image",
  title: "右图布局",
  en: "right-image",
  use: "长列表里穿插使用，打破「全是左图」的单调；也用于对话/时间轴这类右侧留白的结构。",
  width: 440,
  structure: [
    "row-reverse 换视觉方向，DOM 顺序不变 —— 读屏与 Tab 仍先文字后图",
    "图宽 104（比左图版窄一点），给文字更多横向空间",
    "文字右对齐会毁掉可读性，所以文字仍左对齐，只有图换边",
  ],
  plugins: ["Hover"],
};

const Card = withPlugins(CardCore, {
  plugins: [createHoverPlugin({ enableShadow: true, shadowIntensity: "light" })],
});

export default function RightImageLayout() {
  return (
    <Card
      cardId="layout-right-image"
      data={CHAIR}
      padding={0}
      containerStyle={{
        display: "flex",
        flexDirection: "row-reverse",
        background: "#fff",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <img
        src={CHAIR.image}
        alt=""
        style={{
          width: 104,
          flexShrink: 0,
          alignSelf: "stretch",
          objectFit: "cover",
          display: "block",
        }}
      />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ fontSize: 12, color: "#6b6b6b" }}>{CHAIR.brand}</div>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>{CHAIR.title}</div>
        <div
          style={{
            marginTop: "auto",
            fontSize: 12,
            color: "#6b6b6b",
          }}
        >
          {CHAIR.subtitle}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <b style={{ fontSize: 18, color: "#d0021b", fontVariantNumeric: "tabular-nums" }}>
            ¥{CHAIR.price}
          </b>
          {CHAIR.oldPrice ? <s style={{ fontSize: 12, color: "#6b6b6b" }}>¥{CHAIR.oldPrice}</s> : null}
        </div>
      </div>
    </Card>
  );
}
