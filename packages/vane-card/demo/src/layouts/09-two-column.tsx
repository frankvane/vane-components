/**
 * 09 · 双列对称
 *
 * 左右各一半，用在中屏（≥480）上「一张卡讲两件事」：
 * 主图 + 细节图、现款 + 新款、商品 + 赠品、机型对比。
 *
 * 对称不等于两列一样重：左边永远是视觉主体（图），右边承载决策信息。
 * 所以左边用 1:1 通栏裁切，右边按信息块排，中间一条 1px 分隔线——
 * 这条线不是装饰，它让人一眼看出「这是两个区」。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import { createHoverPlugin } from "vane-card/custom-plugins";
import { TEE } from "../data/seed";
import type { LayoutMeta } from "./types";

export const meta: LayoutMeta = {
  id: "two-column",
  title: "双列对称",
  en: "two-column",
  use: "主图 + 细节图、现款 + 新款、商品 + 赠品、机型对比 —— 一张卡讲两件事。",
  width: 520,
  structure: [
    "grid 1fr 1fr，中间 1px 分隔线：让「两个区」这件事在结构上成立，不靠留白暗示",
    "左列图 1:1 通栏裁切，右列按信息块排 —— 对称的是面积，不是内容",
    "窄屏（<420）时用 media query 退化为上下堆叠，别硬撑两列",
  ],
  plugins: ["Hover"],
};

const Card = withPlugins(CardCore, {
  plugins: [createHoverPlugin({ enableShadow: true, shadowIntensity: "light" })],
});

export default function TwoColumnLayout() {
  return (
    <Card
      cardId="layout-two-column"
      data={TEE}
      padding={0}
      containerStyle={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "#fff",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <img
        src={TEE.image}
        alt=""
        style={{ display: "block", width: "100%", height: "100%", aspectRatio: "1 / 1", objectFit: "cover" }}
      />

      <div
        style={{
          borderLeft: "1px solid #eee",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "#9aa08c" }}>{TEE.brand}</div>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35 }}>{TEE.title}</div>
        <div style={{ fontSize: 12, color: "#8a8a8a", lineHeight: 1.6 }}>{TEE.subtitle}</div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          {TEE.tags?.slice(0, 3).map((t) => (
            <span
              key={t}
              style={{
                fontSize: 10.5,
                color: "#6f7563",
                border: "1px solid #e4e6dd",
                borderRadius: 999,
                padding: "2px 8px",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <div style={{ marginTop: "auto", display: "flex", alignItems: "baseline", gap: 8 }}>
          <b style={{ fontSize: 20, color: "#d0021b", fontVariantNumeric: "tabular-nums" }}>
            ¥{TEE.price}
          </b>
          {TEE.oldPrice ? <s style={{ fontSize: 12, color: "#bbb" }}>¥{TEE.oldPrice}</s> : null}
        </div>

        <button
          type="button"
          style={{
            marginTop: 4,
            padding: "8px 0",
            borderRadius: 8,
            border: "1px solid #2a2f22",
            background: "#2a2f22",
            color: "#f4f3ec",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          加入购物袋
        </button>
      </div>
    </Card>
  );
}
