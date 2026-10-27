/**
 * 02 · 横向布局（图在左）
 *
 * 搜索结果、购物车、订单列表的形态。一屏能放下的条数比垂直布局多一倍，
 * 代价是图变小 —— 所以它适合「用户已经知道要找什么」的场景。
 *
 * 三个必须写对的细节：
 *   1. 图 flexShrink: 0 —— 否则窄屏时图先被压扁
 *   2. 文字列 minWidth: 0 —— 没有它，长标题会把整行撑爆，ellipsis 不生效
 *   3. 价格 marginTop: auto —— 贴底，让一列卡片的底边齐平
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import { createHoverPlugin } from "vane-card/custom-plugins";
import { MUG } from "../data/seed";
import type { LayoutMeta } from "./types";

export const meta: LayoutMeta = {
  id: "horizontal",
  title: "横向布局",
  en: "horizontal",
  use: "搜索结果、购物车、订单列表 —— 用户已知道要找什么，一屏多看几条。",
  width: 440,
  structure: [
    "图固定 112×112 且 flexShrink: 0：窄屏时先压文字，不压图",
    "文字列必须 minWidth: 0，否则长标题撑爆容器、ellipsis 失效",
    "价格 marginTop: auto 贴底：并排几张卡时底边才会齐",
  ],
  plugins: ["Hover"],
};

const Card = withPlugins(CardCore, {
  plugins: [createHoverPlugin({ enableShadow: true, shadowIntensity: "light" })],
});

export default function HorizontalLayout() {
  return (
    <Card
      cardId="layout-horizontal"
      data={MUG}
      padding={0}
      containerStyle={{
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        background: "#fff",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <img
        src={MUG.image}
        alt=""
        style={{
          width: 112,
          flexShrink: 0,
          // 不用固定 height：文字区行数变了卡片就变高，固定高会在底部留一条白边。
          // alignSelf: stretch 让图跟着卡片长，object-fit 负责裁切。
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
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {MUG.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#8a8a8a",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {MUG.subtitle}
        </div>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <b style={{ fontSize: 18, color: "#d0021b", fontVariantNumeric: "tabular-nums" }}>
            ¥{MUG.price}
          </b>
          {MUG.oldPrice ? <s style={{ fontSize: 12, color: "#bbb" }}>¥{MUG.oldPrice}</s> : null}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9aa08c" }}>
            库存 {MUG.inventory}
          </span>
        </div>
      </div>
    </Card>
  );
}
