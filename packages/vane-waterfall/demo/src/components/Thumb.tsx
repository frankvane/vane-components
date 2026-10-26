/**
 * 缩略图占位块
 *
 * 用纯 CSS 渐变画「图」，好处：离线可用、零请求、高度精确受控（瀑布流要的是高度，
 * 不是图）。
 *
 * 配色刻意去饱和：只保留 18% 左右的彩度，让 13 个场景里的「照片」读起来像同一批
 * 印刷样张，而不是一堆糖果色块；网纹由 `.thumb::after` 统一叠（见 App.css）。
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

export function Thumb({ height, hue, badge, glyph, radius = 0, deep }: ThumbProps) {
  const h2 = (hue + 42) % 360;
  return (
    <div
      className="thumb"
      style={{
        height,
        borderRadius: radius,
        backgroundImage: [
          `radial-gradient(132% 92% at 16% 6%, hsl(${hue} 21% ${deep ? 36 : 64}%) 0%, hsl(${h2} 17% ${deep ? 15 : 33}%) 100%)`,
        ].join(","),
      }}
    >
      {glyph ? <span className="thumb-glyph">{glyph}</span> : null}
      {badge ? <span className="thumb-badge">{badge}</span> : null}
    </div>
  );
}
