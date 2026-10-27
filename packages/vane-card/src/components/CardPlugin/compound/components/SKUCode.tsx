import React from "react";
import { useProductCard } from "../ProductCard";
import { matchVariant, variantListOf } from "../../types/product";

export type SKUCodeProps = {
  code?: string;
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
};

export const SKUCode: React.FC<SKUCodeProps> = ({ code, prefix = "SKU", className, style }) => {
  const { data, state } = useProductCard();

  const active = matchVariant(variantListOf(data), state.attributes);
  const final = code ?? active?.sku ?? data?.sku;
  if (!final) return null;
  return <div className={className} style={{ color: "#777", fontSize: 12, ...style }}>{prefix}：{final}</div>;
};