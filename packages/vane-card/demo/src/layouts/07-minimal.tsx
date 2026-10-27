/**
 * 07 · 极简布局
 *
 * 一个插件都不装，连图都不要。它证明一件事：**版式是 children 的事**。
 *
 * 极简不等于「少放点东西」，而是靠三件事撑住：
 *   1. 字号层级拉开（10 / 19 / 22），读者一眼知道先看哪
 *   2. 留白给足（24px 起），窄卡里宁可少一行字
 *   3. 有一条稳定的结构线（这里的顶部分隔线），让「少」看起来是设计而不是缺失
 */
import React from "react";
import { CardCore } from "vane-card";
import { TEE } from "../data/seed";
import type { LayoutMeta } from "./types";

export const meta: LayoutMeta = {
  id: "minimal",
  title: "极简布局",
  en: "minimal",
  use: "品牌向页面、高客单商品、内容专栏 —— 图抢戏时用它，把注意力全给文字。",
  width: 260,
  structure: [
    "零插件：连 Image 都不装，版式完全由 children 决定",
    "字号层级拉开到 10 / 19 / 22 三档，靠对比而不是靠装饰分区",
    "有一条结构线（顶部分隔）撑住「少」：否则看起来像内容没加载出来",
  ],
  plugins: [],
};

export default function MinimalLayout() {
  return (
    <CardCore
      cardId="layout-minimal"
      data={TEE}
      padding={0}
      containerStyle={{ background: "#fff", borderRadius: 12, overflow: "hidden" }}
    >
      <div style={{ padding: "22px 24px 24px", display: "grid", gap: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingBottom: 12,
            borderBottom: "1px solid #eee",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#a3a89a",
          }}
        >
          <span>{TEE.brand}</span>
          <span style={{ marginLeft: "auto" }}>{TEE.skuCode}</span>
        </div>

        <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.35, letterSpacing: "-0.01em" }}>
          {TEE.title}
        </div>

        <div style={{ fontSize: 12, color: "#8a8a8a", lineHeight: 1.7 }}>{TEE.description}</div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <b style={{ fontSize: 22, color: "#1c1f18", fontVariantNumeric: "tabular-nums" }}>
            ¥{TEE.price}
          </b>
          <span style={{ fontSize: 11, color: "#a3a89a" }}>含税 · 免运费</span>
        </div>
      </div>
    </CardCore>
  );
}
