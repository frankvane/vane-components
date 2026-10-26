/**
 * 缩略图占位块
 *
 * 用纯 CSS 渐变画「图」，好处：离线可用、零请求、高度精确受控（瀑布流要的是高度，
 * 不是图）。斜纹 + 中心色块让它看起来像内容而不是纯色块，卡片里的视觉层级更接近
 * 真实的图文卡。
 */
import React from "react";

export interface ThumbProps {
  /** 高度；等高网格里传 "100%" 让封面吃掉卡片剩余空间 */
  height: number | string;
  hue: number;
  /** 右下角的角标，如价格 / 时长 / 分辨率 */
  badge?: React.ReactNode;
  /** 左上角角标 */
  glyph?: React.ReactNode;
  radius?: number;
  /** 竖构图（视频竖屏）用更深的渐变 */
  deep?: boolean;
}

export function Thumb({ height, hue, badge, glyph, radius = 8, deep }: ThumbProps) {
  const h2 = (hue + 42) % 360;
  return (
    <div
      className="thumb"
      style={{
        height,
        borderRadius: radius,
        backgroundImage: [
          `repeating-linear-gradient(135deg, rgba(255,255,255,.07) 0 10px, rgba(255,255,255,0) 10px 20px)`,
          `radial-gradient(120% 80% at 18% 12%, hsl(${hue} 68% ${deep ? 46 : 64}%) 0%, hsl(${h2} 58% ${deep ? 26 : 40}%) 100%)`,
        ].join(","),
      }}
    >
      {glyph ? <span className="thumb-glyph">{glyph}</span> : null}
      {badge ? <span className="thumb-badge">{badge}</span> : null}
    </div>
  );
}
