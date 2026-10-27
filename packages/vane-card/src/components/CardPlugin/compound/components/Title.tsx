import React from "react";
import { useProductCard } from "../ProductCard";

export type TitleProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export const Title: React.FC<TitleProps> = ({ children, style, className }) => {
  const { data } = useProductCard();
  const final = children ?? data?.title;
  return <h3 style={style} className={className}>{final}</h3>;
};