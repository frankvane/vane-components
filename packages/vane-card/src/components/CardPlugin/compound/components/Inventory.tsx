import React from "react";
import { useProductCard } from "../ProductCard";
import { matchVariant, variantListOf } from "../../types/product";
import { useSelectedAttributes } from "../../plugins/slots";

export type InventoryProps = {
  available?: number; // 可用库存（若不传则从 data/variants 或 data.inventory 推断）
  threshold?: number; // 低库存阈值
  style?: React.CSSProperties;
  className?: string;
};

export const Inventory: React.FC<InventoryProps> = ({ available, threshold = 5, style, className }) => {
  const { data, state } = useProductCard();
  const attributes = useSelectedAttributes(state.attributes);

  // 与 InventoryPlugin 同一口径：选中变体库存 > data.inventory > 未知。
  // 未知不能折算成 0 —— 那会让「没传库存字段」的卡片直接显示「已售罄」（P0-1）。
  const selectedStock = matchVariant(variantListOf(data), attributes)?.stock;
  const qty =
    typeof available === "number"
      ? available
      : typeof selectedStock === "number"
        ? selectedStock
        : typeof data?.inventory === "number"
          ? data.inventory
          : undefined;

  if (typeof qty !== "number") return null;

  const isLow = qty > 0 && qty <= threshold;
  const text = qty <= 0 ? "已售罄" : isLow ? `仅剩 ${qty} 件` : `库存充足（${qty}）`;
  const tone = qty <= 0 ? "out" : isLow ? "low" : "in";

  return (
    <div className={`vc-inventory vc-inventory--${tone} ${className ?? ""}`.trim()} style={style}>
      {text}
    </div>
  );
};