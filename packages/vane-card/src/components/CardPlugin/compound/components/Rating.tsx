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
    <div className={`vc-rating ${className ?? ""}`.trim()} style={style}>
      <span aria-label={`评分 ${v} / 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`vc-rating__star ${i < stars ? "is-on" : ""}`.trim()}>
            ★
          </span>
        ))}
      </span>
      <span className="vc-rating__count">
        {v.toFixed(1)} ({c})
      </span>
    </div>
  );
};