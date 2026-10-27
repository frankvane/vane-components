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
  const clampStyles: React.CSSProperties = lines
    ? {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical" as any,
        WebkitLineClamp: lines,
        overflow: "hidden",
      }
    : {};
  return <p style={{ ...clampStyles, ...style }} className={className}>{final}</p>;
};