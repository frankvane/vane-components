import React from "react";
import { useProductCard } from "../ProductCard";

export type ImageProps = {
  src?: string;
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
};

export const Image: React.FC<ImageProps> = ({ src, alt, style, className }) => {
  const { data } = useProductCard();
  const finalSrc = src ?? data?.image;
  return <img src={finalSrc} alt={alt ?? data?.title ?? ""} style={style} className={className} />;
};