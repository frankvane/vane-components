import React from "react";
import { useProductCard } from "../ProductCard";

export type SubtitleProps = {
  text?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export const Subtitle: React.FC<SubtitleProps> = ({ text, children, style, className }) => {
  const { data } = useProductCard();
  const final = children ?? text ?? data?.subtitle;
  if (!final) return null;
  return (
    <div className={`vc-subtitle ${className ?? ""}`.trim()} style={style}>
      {final}
    </div>
  );
};