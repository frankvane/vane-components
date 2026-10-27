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
  return <div style={{ color: "#333", fontSize: 13, ...style }} className={className}>品牌：{final}</div>;
};