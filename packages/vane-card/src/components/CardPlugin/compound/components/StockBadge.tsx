import React from "react";
import { useProductCard } from "../ProductCard";
import { matchVariant, variantListOf } from "../../types/product";

export type StockBadgeProps = {
  className?: string;
  style?: React.CSSProperties;
  showQuantity?: boolean; // 是否显示具体库存数量
  lowStockThreshold?: number; // 低库存阈值
  outOfStockText?: string; // 缺货文本
  lowStockText?: string; // 低库存文本
  inStockText?: string; // 有库存文本
  badgeStyle?: "pill" | "rounded" | "square"; // 徽章样式
  size?: "small" | "medium" | "large"; // 尺寸
  colorScheme?: "default" | "success" | "warning" | "danger"; // 颜色方案
  hideWhenInStock?: boolean; // 库存充足时是否隐藏
};

export const StockBadge: React.FC<StockBadgeProps> = ({
  className = "",
  style,
  showQuantity = false,
  lowStockThreshold = 10,
  outOfStockText = "缺货",
  lowStockText = "库存紧张",
  inStockText = "现货",
  badgeStyle = "pill",
  size = "medium",
  colorScheme = "default",
  hideWhenInStock = false,
}) => {
  const { data, state } = useProductCard();

  // 选中变体库存优先，与 Quantity / Inventory 同一口径
  const selected = matchVariant(variantListOf(data), state.attributes);
  const currentStock =
    typeof selected?.stock === "number"
      ? selected.stock
      : typeof data?.inventory === "number"
        ? data.inventory
        : 0;

  // 确定库存状态
  const getStockStatus = () => {
    if (currentStock <= 0) {
      return "out-of-stock";
    } else if (currentStock <= lowStockThreshold) {
      return "low-stock";
    } else {
      return "in-stock";
    }
  };

  const stockStatus = getStockStatus();

  // 如果库存充足且设置了隐藏，则不显示
  if (hideWhenInStock && stockStatus === "in-stock") {
    return null;
  }

  // 获取显示文本
  const getDisplayText = () => {
    switch (stockStatus) {
      case "out-of-stock":
        return outOfStockText;
      case "low-stock":
        return showQuantity ? `${lowStockText} (${currentStock}件)` : lowStockText;
      case "in-stock":
        return showQuantity ? `${inStockText} (${currentStock}件)` : inStockText;
      default:
        return inStockText;
    }
  };

  // 底色：显式指定 colorScheme 时按它走，否则跟随库存状态
  const tone =
    colorScheme !== "default"
      ? colorScheme
      : stockStatus === "out-of-stock"
        ? "out"
        : stockStatus === "low-stock"
          ? "low"
          : "in";

  return (
    <span
      className={`vc-stock vc-stock--${size} vc-stock--${badgeStyle} vc-stock--${tone} ${className}`.trim()}
      style={style}
      title={`当前库存: ${currentStock}件`}
    >
      {getDisplayText()}
    </span>
  );
};