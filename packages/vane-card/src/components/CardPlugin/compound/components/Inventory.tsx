import React from "react";
import { useProductCard } from "../ProductCard";

export type InventoryProps = {
  available?: number; // 可用库存（若不传则从 data/variants 或 data.inventory 推断）
  threshold?: number; // 低库存阈值
  style?: React.CSSProperties;
  className?: string;
};

export const Inventory: React.FC<InventoryProps> = ({ available, threshold = 5, style, className }) => {
  const { data, state } = useProductCard();

  const getSelectedVariantStock = (): number | undefined => {
    const attrs = state.attributes || {};
    const variants: any[] | undefined = (data?.variants && Array.isArray(data.variants)) ? data.variants : undefined;
    if (!variants || !Object.keys(attrs).length) return undefined;
    const match = variants.find((v) => {
      const opts = (v.options || v.attributes) || {};
      return Object.keys(attrs).every((k) => String(opts[k]) === String((attrs as any)[k]));
    });
    return typeof match?.stock === "number" ? match.stock : undefined;
  };

  const qty =
    typeof available === "number"
      ? available
      : getSelectedVariantStock() ?? (typeof data?.inventory === "number" ? data.inventory : 0);

  const isLow = qty > 0 && qty <= threshold;
  const text = qty <= 0 ? "已售罄" : isLow ? `仅剩 ${qty} 件` : `库存充足（${qty}）`;
  const color = qty <= 0 ? "#999" : isLow ? "#d0021b" : "#0a7f2e";

  return (
    <div className={className} style={{ color, fontSize: 13, ...style }}>{text}</div>
  );
};