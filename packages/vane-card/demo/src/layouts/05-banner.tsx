/**
 * 05 · Banner 横幅
 *
 * 不是「列表卡」，是**页面里的一块版面**：活动头图、品类入口、新人礼包。
 * 所以它的宽度、字号、留白都比卡片大一号，左右分栏也是一半对一半。
 *
 * 关键判断：Banner 里**不要试图塞完整商品信息**。它只回答「这是什么活动、
 * 现在去不去」，具体参数留给点进去之后的页面。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import { createHoverPlugin } from "vane-card/custom-plugins";
import { svgPlate } from "../data/images";
import { CHAIR } from "../data/seed";
import type { LayoutMeta } from "./types";

/** 侧图用无字装饰图：竖版商品图在 240 宽的列里会被 cover 裁掉一半标签 */
const HERO = svgPlate({ width: 600, height: 900, hue: 32 });

export const meta: LayoutMeta = {
  id: "banner",
  title: "Banner 横幅",
  en: "banner",
  use: "活动头图、品类入口、新人礼包 —— 版面级而非列表级，一屏最多一个。",
  // 580 而不是 620：舞台这一列的实际可用宽是 610，620 会溢出 10px。
  // 版式的宽度值不是装饰，超一像素就会被体检脚本抓住。
  width: 580,
  structure: [
    "左文右图 6:4：文字区 flex: 1 自适应，图固定 240 —— 文字变长时压文字不压图",
    "图 height: 100% + object-fit: cover，跟着左侧内容高度走，不会比文字区矮一截",
    "只放一个主按钮：Banner 的职责是「去不去」，不是「选哪个」",
  ],
  plugins: ["Hover"],
};

const Card = withPlugins(CardCore, {
  plugins: [createHoverPlugin({ enableShadow: true, shadowIntensity: "medium" })],
});

export default function BannerLayout() {
  return (
    <Card
      cardId="layout-banner"
      data={CHAIR}
      padding={0}
      containerStyle={{
        display: "flex",
        background: "linear-gradient(100deg, #f4f3ec 0%, #eceae0 58%, #e6e4d8 100%)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: "26px 24px",
          display: "grid",
          alignContent: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            justifySelf: "start",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#565c48",
            border: "1px solid rgba(124, 131, 104, 0.4)",
            borderRadius: 999,
            padding: "3px 10px",
          }}
        >
          夏季出行季
        </span>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
          轻装出发
          <span style={{ color: "#565c48" }}> · 满 399 减 60</span>
        </div>
        <div style={{ fontSize: 13, color: "#545a48", lineHeight: 1.6 }}>
          1.9kg 铝合金折叠椅，收起来 38cm。活动到 8 月 31 日。
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button
            type="button"
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "1px solid #2a2f22",
              background: "#2a2f22",
              color: "#f4f3ec",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            立即抢购
          </button>
          <button
            type="button"
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "1px solid rgba(42, 47, 34, 0.25)",
              background: "transparent",
              color: "#2a2f22",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            查看会场
          </button>
        </div>
      </div>

      <div style={{ width: 240, flexShrink: 0 }}>
        <img
          src={HERO}
          alt=""
          style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </Card>
  );
}
