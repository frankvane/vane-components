import React from "react";
import { useProductCard } from "../ProductCard";
import { matchVariant, variantListOf } from "../../types/product";

export type InventoryProps = {
  available?: number; // 可用库存（若不传则从 data/variants 或 data.inventory 推断）
  threshold?: number; // 低库存阈值
  style?: React.CSSProperties;
  className?: string;
};

export const Inventory: React.FC<InventoryProps> = ({ available, threshold = 5, style, className }) => {
  const { data, state } = useProductCard();

  const selectedStock = matchVariant(variantListOf(data), state.attributes)?.stock;
  const qty =
    typeof available === "number"
      ? available
      : typeof selectedStock === "number"
        ? selectedStock
        : typeof data?.inventory === "number"
          ? data.inventory
          : 0;

  const isLow = qty > 0 && qty <= threshold;
  const text = qty <= 0 ? "已售罄" : isLow ? `仅剩 ${qty} 件` : `库存充足（${qty}）`;
  const tone = qty <= 0 ? "out" : isLow ? "low" : "in";

  return (
    <div className={`vc-inventory vc-inventory--${tone} ${className ?? ""}`.trim()} style={style}>
      {text}
    </div>
  );
};