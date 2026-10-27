import React from "react";
import { useProductCard } from "../ProductCard";

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

  // 根据当前 attributes 与 data.variants 匹配选中变体
  const getActiveVariant = (): any | undefined => {
    const attrs = state.attributes || {};
    const variants: any[] | undefined = (data?.variants && Array.isArray(data.variants)) ? data.variants : undefined;
    if (!variants || !Object.keys(attrs).length) return undefined;
    return variants.find((v) => {
      const opts = (v.options || v.attributes) || {};
      return Object.keys(attrs).every((k) => String(opts[k]) === String((attrs as any)[k]));
    });
  };

  // 获取当前选中规格的库存
  const getCurrentStock = () => {
    const selected = getActiveVariant();
    if (selected && selected.stock !== undefined) {
      return selected.stock as number;
    }
    return (data?.inventory as number | undefined) ?? 0;
  };

  const currentStock = getCurrentStock();

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

  // 获取颜色样式
  const getColorStyles = () => {
    if (colorScheme !== "default") {
      // 使用指定的颜色方案
      const colorMap = {
        success: { bg: "#0a7f2e", color: "#fff" },
        warning: { bg: "#ff9800", color: "#fff" },
        danger: { bg: "#d0021b", color: "#fff" },
      };
      return colorMap[colorScheme];
    }

    // 根据库存状态自动选择颜色
    switch (stockStatus) {
      case "out-of-stock":
        return { bg: "#d0021b", color: "#fff" };
      case "low-stock":
        return { bg: "#ff9800", color: "#fff" };
      case "in-stock":
        return { bg: "#0a7f2e", color: "#fff" };
      default:
        return { bg: "#6c757d", color: "#fff" };
    }
  };

  // 获取尺寸样式
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return { fontSize: "11px", padding: "2px 6px", minWidth: "auto" };
      case "large":
        return { fontSize: "14px", padding: "6px 12px", minWidth: "60px" };
      default: // medium
        return { fontSize: "12px", padding: "4px 8px", minWidth: "50px" };
    }
  };

  // 获取边框样式
  const getBorderRadius = () => {
    switch (badgeStyle) {
      case "square":
        return "2px";
      case "rounded":
        return "6px";
      default: // pill
        return "12px";
    }
  };

  const colorStyles = getColorStyles();
  const sizeStyles = getSizeStyles();

  const badgeStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colorStyles.bg,
    color: colorStyles.color,
    borderRadius: getBorderRadius(),
    fontWeight: 500,
    textAlign: "center",
    whiteSpace: "nowrap",
    userSelect: "none",
    border: "none",
    ...sizeStyles,
    ...style,
  };

  return (
    <span
      className={`stock-badge stock-badge--${stockStatus} stock-badge--${size} ${className}`}
      style={badgeStyles}
      title={`当前库存: ${currentStock}件`}
    >
      {getDisplayText()}
    </span>
  );
};