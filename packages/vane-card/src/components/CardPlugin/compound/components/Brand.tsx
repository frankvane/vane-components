import React from "react";
import { useProductCard } from "../ProductCard";

export type BrandProps = {
  name?: string;
  style?: React.CSSProperties;
  className?: string;
};

export const Brand: React.FC<BrandProps> = ({ name, style, className }) => {
  const { data } = useProductCard();
  const final = name ?? data?.brand;
  if (!final) return null;
  return (
    <div className={`vc-brand ${className ?? ""}`.trim()} style={style}>
      品牌：{final}
    </div>
  );
};