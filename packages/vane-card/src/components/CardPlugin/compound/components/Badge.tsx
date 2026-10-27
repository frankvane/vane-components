import React from "react";
import { useProductCard } from "../ProductCard";

export type BadgeProps = {
  text?: string;
  style?: React.CSSProperties;
  className?: string;
};

export const Badge: React.FC<BadgeProps> = ({ text, style, className }) => {
  const { data } = useProductCard();
  const finalText = text ?? data?.badge;
  if (!finalText) return null;
  return (
    <span className={`vc-badge ${className ?? ""}`.trim()} style={style}>
      {finalText}
    </span>
  );
};