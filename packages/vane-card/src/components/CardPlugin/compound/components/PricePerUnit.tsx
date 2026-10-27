import React from "react";
import { useProductCard } from "../ProductCard";

export type PricePerUnitProps = {
  unitLabel?: string; // 显示单位，例如 "每100g"/"每件"
  unitGram?: number; // 计算参考重量（克），默认 100g
  price?: number; // 覆盖价格
  totalGram?: number; // 商品净重（克）
  className?: string;
  style?: React.CSSProperties;
};

export const PricePerUnit: React.FC<PricePerUnitProps> = ({ unitLabel = "每100g", unitGram = 100, price, totalGram, className, style }) => {
  const { data } = useProductCard();
  const p = price ?? data?.price;
  const grams = totalGram ?? data?.weightGram;
  if (p == null || !grams || grams <= 0) return null;
  const unitPrice = (p / grams) * unitGram;
  return <div className={className} style={{ color: "#666", fontSize: 12, ...style }}>{unitLabel}约 ¥{unitPrice.toFixed(2)}</div>;
};