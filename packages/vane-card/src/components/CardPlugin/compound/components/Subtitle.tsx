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
  return <div style={{ color: "#666", fontSize: 13, ...style }} className={className}>{final}</div>;
};