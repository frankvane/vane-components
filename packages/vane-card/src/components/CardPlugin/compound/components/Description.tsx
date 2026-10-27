import React from "react";
import { useProductCard } from "../ProductCard";

export type DescriptionProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  lines?: number; // 可选：文本行数（行数截断）
};

export const Description: React.FC<DescriptionProps> = ({ children, style, className, lines }) => {
  const { data } = useProductCard();
  const final = children ?? data?.description;
  // 行数是动态值，只能内联；截断本身（display/box-orient/overflow）在 .vc-clamp
  const clampStyle: React.CSSProperties = lines ? { WebkitLineClamp: lines } : {};
  return (
    <p
      className={`vc-description ${lines ? "vc-clamp" : ""} ${className ?? ""}`.trim()}
      style={{ ...clampStyle, ...style }}
    >
      {final}
    </p>
  );
};