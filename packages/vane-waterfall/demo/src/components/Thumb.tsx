/**
 * 缩略图
 *
 * 两层结构：底层是按 `hue` 算出的渐变（+ 细网纹），上层是 `src` 给的真实照片。
 * 图片还没到、图床抽风、离线断网时看到的是「一张色样」而不是白洞——`<img>` 出错
 * 就地藏起来即可，不做状态、不重渲染，瀑布流也不会为「一张图挂了」重排。
 *
 * 配色刻意去饱和：图床的色温五花八门，`filter` 压一档彩度，让 13 个场景里的照片
 * 读起来像同一批印刷样张，而不是一堆糖果色海报。
 */
import React from "react";

export interface ThumbProps {
  /** 高度；等高网格里传 "100%" 让封面吃掉卡片剩余空间 */
  height: number | string;
  hue: number;
  /** 真实缩略图地址；不给就只画渐变块 */
  src?: string;
  /** 右下角的角标，如价格 / 时长 / 分辨率 */
  badge?: React.ReactNode;
  /** 左上角角标 */
  glyph?: React.ReactNode;
  radius?: number;
  /** 竖构图（视频竖屏）用更深的渐变 */
  deep?: boolean;
}

export function Thumb({ height, hue, src, badge, glyph, radius = 0, deep }: ThumbProps) {
  const h2 = (hue + 42) % 360;
  return (
    <div
      className={`thumb${src ? " has-img" : ""}`}
      style={{
        height,
        borderRadius: radius,
        backgroundImage: [
          `radial-gradient(132% 92% at 16% 6%, hsl(${hue} 21% ${deep ? 36 : 64}%) 0%, hsl(${h2} 17% ${deep ? 15 : 33}%) 100%)`,
        ].join(","),
      }}
    >
      {src ? (
        <img
          className="thumb-img"
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      {glyph ? <span className="thumb-glyph">{glyph}</span> : null}
      {badge ? <span className="thumb-badge">{badge}</span> : null}
    </div>
  );
}
