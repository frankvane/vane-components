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
    <span style={{ display: "inline-block", padding: "2px 6px", background: "#ffe08a", borderRadius: 4, fontSize: 12, ...style }} className={className}>
      {finalText}
    </span>
  );
};