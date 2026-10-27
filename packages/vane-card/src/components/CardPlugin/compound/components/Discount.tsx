import React from "react";
import { useProductCard } from "../ProductCard";

export type DiscountProps = {
  percent?: number; // 0-100
  fromPrice?: number;
  toPrice?: number;
  style?: React.CSSProperties;
  className?: string;
};

export const Discount: React.FC<DiscountProps> = ({ percent, fromPrice, toPrice, style, className }) => {
  const { data } = useProductCard();
  const oldP = fromPrice ?? data?.oldPrice;
  const newP = toPrice ?? data?.price;

  let p = percent;
  if (p == null && oldP && newP && oldP > 0) {
    p = Math.round((1 - newP / oldP) * 100);
  }
  if (!p || p <= 0) return null;

  return (
    <span className={`vc-badge ${className ?? ""}`.trim()} style={style}>
      -{p}%
    </span>
  );
};