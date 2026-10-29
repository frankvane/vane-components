import React from "react";
import { useProductCard } from "../ProductCard";

export type RatingProps = {
  value?: number; // 0-5
  count?: number; // 总评价数
  style?: React.CSSProperties;
  className?: string;
};

export const Rating: React.FC<RatingProps> = ({ value, count, style, className }) => {
  const { data } = useProductCard();
  const v = value ?? data?.rating ?? 0;
  const c = count ?? data?.ratingCount ?? 0;
  const stars = Math.round(v);

  return (
    // role="img" + aria-label：整组评分对读屏是一张图，读「评分 4.5/5，128 人评价」，
    // 而不是把「★★★★★ 4.5 (128)」逐字念一遍。
    <div
      className={`vc-rating ${className ?? ""}`.trim()}
      style={style}
      role="img"
      aria-label={`评分 ${v} / 5，共 ${c} 人评价`}
    >
      {/*
        星星是装饰：评分由 aria-label 与旁边的数字承担。
        标成 aria-hidden 之后，「金色星星在白底上只有 2:1」就不再是问题 ——
        装饰性内容不受 WCAG 1.4.3 约束；为了凑 4.5:1 把星级压成橄榄色并不划算。
      */}
      <span aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`vc-rating__star ${i < stars ? "is-on" : ""}`.trim()}>
            ★
          </span>
        ))}
      </span>
      <span className="vc-rating__count" aria-hidden="true">
        {v.toFixed(1)} ({c})
      </span>
    </div>
  );
};