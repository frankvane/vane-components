import React from "react";
import { useProductCard } from "../ProductCard";

export type OldPriceProps = {
  value?: number | string;
  currency?: string;
  style?: React.CSSProperties;
  className?: string;
};

export const OldPrice: React.FC<OldPriceProps> = ({ value, currency = "¥", style, className }) => {
  const { data } = useProductCard();
  const v = value ?? data?.oldPrice;
  if (v == null) return null;
  return <div style={{ color: "#999", textDecoration: "line-through", ...style }} className={className}>{currency}{v}</div>;
};