/**
 * 信息流卡片
 *
 * 一个组件覆盖示例页的几种卡片形态，避免 12 个场景各写一份看板式代码。
 * 关键是 `fixed` 分支：视频墙那类场景要求**整张卡等高**（FixedHeightPlugin 统一的是
 * 项高度，不是图片高度），所以外层要吃满 `item.height`、让缩略图 flex 收缩。
 */
import React from "react";
import type { SeedCard } from "../data/seed";
import { timeAgo } from "../data/seed";
import { Thumb } from "./Thumb";

export type CardVariant = "photo" | "note" | "product" | "video" | "doc" | "plain";

export interface FeedCardProps {
  card: SeedCard;
  variant?: CardVariant;
  /** 整张卡等高（配合 FixedHeightPlugin） */
  fixed?: boolean;
  /** 置顶角标 */
  pinned?: boolean;
  /** 右上角额外操作区，如拖拽手柄 */
  corner?: React.ReactNode;
}

const VBADGE = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
    <path d="M8 5v14l11-7z" />
  </svg>
);

export function FeedCard({
  card,
  variant = "photo",
  fixed,
  pinned,
  corner,
}: FeedCardProps) {
  const thumb = (
    <Thumb
      height={fixed ? "100%" : card.height}
      hue={card.hue}
      radius={0}
      deep={variant === "video"}
      badge={
        variant === "video" ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            {VBADGE}
            {Math.floor(card.minutesAgo / 60)}:{String(card.minutesAgo % 60).padStart(2, "0")}
          </span>
        ) : variant === "product" ? (
          `¥${card.price}`
        ) : pinned ? (
          "置顶"
        ) : undefined
      }
      glyph={
        variant === "doc" ? (
          <span style={{ fontSize: 11, letterSpacing: 0.5 }}>{card.tag}</span>
        ) : undefined
      }
    />
  );

  if (fixed) {
    return (
      <div className="wf-card is-fixed" style={{ height: card.height }}>
        <div className="wf-card-fill">{thumb}</div>
        <div className="wf-card-cap">
          <p className="wf-item-title">{card.title}</p>
          <p className="wf-item-meta">
            {card.author} · {timeAgo(card.minutesAgo)}
          </p>
        </div>
        {corner ? <span className="wf-card-corner">{corner}</span> : null}
      </div>
    );
  }

  return (
    <div className={`wf-card is-${variant}`}>
      {thumb}
      <div className="wf-card-cap">
        <p className="wf-item-title">{card.title}</p>
        <p className="wf-item-meta">
          {variant === "product" ? (
            <>
              <b className="wf-price">¥{card.price}</b>
              <span className="wf-sep">·</span>
              {card.likes} 人收藏
            </>
          ) : (
            <>
              {card.author}
              <span className="wf-sep">·</span>
              {timeAgo(card.minutesAgo)}
            </>
          )}
        </p>
      </div>
      {corner ? <span className="wf-card-corner">{corner}</span> : null}
    </div>
  );
}
