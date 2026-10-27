import React from "react";
import { useProductCard } from "../ProductCard";

export type SKUCodeProps = {
  code?: string;
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
};

export const SKUCode: React.FC<SKUCodeProps> = ({ code, prefix = "SKU", className, style }) => {
  const { data, state } = useProductCard();

  const getActiveVariant = (): any | undefined => {
    const attrs = state.attributes || {};
    const variants: any[] | undefined = (data?.variants && Array.isArray(data.variants)) ? data.variants : undefined;
    if (!variants || !Object.keys(attrs).length) return undefined;
    return variants.find((v) => {
      const opts = (v.options || v.attributes) || {};
      return Object.keys(attrs).every((k) => String(opts[k]) === String((attrs as any)[k]));
    });
  };

  const active = getActiveVariant();
  const final = code ?? (active?.sku ?? data?.sku);
  if (!final) return null;
  return <div className={className} style={{ color: "#777", fontSize: 12, ...style }}>{prefix}：{final}</div>;
};