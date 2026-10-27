import React, { useMemo } from "react";
import { useProductCard } from "../ProductCard";

export type SavingsBadgeProps = {
  className?: string;
  style?: React.CSSProperties;
  currency?: string;
  showPercentage?: boolean;
  showAmount?: boolean;
  minSavings?: number; // 最小节省金额，低于此值不显示
  badgeStyle?: "pill" | "rounded" | "square";
  color?: string;
  backgroundColor?: string;
  size?: "small" | "medium" | "large";
};

export const SavingsBadge: React.FC<SavingsBadgeProps> = ({
  className,
  style,
  currency = "¥",
  showPercentage = true,
  showAmount = true,
  minSavings = 0,
  badgeStyle = "pill",
  color = "#fff",
  backgroundColor = "#d0021b",
  size = "medium",
}) => {
  const { data, state } = useProductCard();

  const savings = useMemo(() => {
    const quantity = state.quantity ?? 1;
    const currentPrice = Number(data?.price ?? 0);
    const oldPrice = Number(data?.oldPrice ?? 0);
    
    if (!oldPrice || !currentPrice || currentPrice >= oldPrice) {
      return null;
    }

    const unitSavings = oldPrice - currentPrice;
    const totalSavings = unitSavings * quantity;
    const percentage = Math.round((unitSavings / oldPrice) * 100);

    return {
      unitSavings,
      totalSavings,
      percentage,
      quantity,
    };
  }, [data?.price, data?.oldPrice, state.quantity]);

  if (!savings || savings.totalSavings < minSavings) {
    return null;
  }

  const getBorderRadius = () => {
    switch (badgeStyle) {
      case "pill":
        return 999;
      case "rounded":
        return 6;
      case "square":
        return 0;
      default:
        return 6;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "small":
        return 11;
      case "medium":
        return 12;
      case "large":
        return 14;
      default:
        return 12;
    }
  };

  const getPadding = () => {
    switch (size) {
      case "small":
        return "2px 6px";
      case "medium":
        return "4px 8px";
      case "large":
        return "6px 12px";
      default:
        return "4px 8px";
    }
  };

  const formatAmount = (amount: number) => `${currency}${amount.toFixed(2)}`;

  const getText = () => {
    const parts: string[] = [];
    
    if (showAmount) {
      parts.push(`省${formatAmount(savings.totalSavings)}`);
    }
    
    if (showPercentage) {
      parts.push(`${savings.percentage}%`);
    }

    return parts.join(" ");
  };

  // 单价 → 合计价：先取兜底再相乘，避免 data 缺字段时 `data?.x!` 的
  // 「对可选链做非空断言」写法（运行时仍可能是 undefined → NaN 文案）
  const unitOldPrice = data?.oldPrice ?? 0;
  const unitPrice = data?.price ?? 0;
  const totalOldPrice =
    savings.quantity > 1 ? unitOldPrice * savings.quantity : unitOldPrice;
  const totalCurrentPrice =
    savings.quantity > 1 ? unitPrice * savings.quantity : unitPrice;

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: getPadding(),
        fontSize: getFontSize(),
        fontWeight: 600,
        color,
        backgroundColor,
        borderRadius: getBorderRadius(),
        whiteSpace: "nowrap",
        lineHeight: 1,
        ...style,
      }}
      title={`原价 ${formatAmount(totalOldPrice)}, 现价 ${formatAmount(totalCurrentPrice)}, 节省 ${formatAmount(savings.totalSavings)}`}
    >
      {getText()}
    </span>
  );
};