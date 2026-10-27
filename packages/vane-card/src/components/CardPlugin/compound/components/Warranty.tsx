import React from "react";
import { useProductCard } from "../ProductCard";

export type WarrantyProps = {
  info?: string;
  style?: React.CSSProperties;
  className?: string;
};

export const Warranty: React.FC<WarrantyProps> = ({ info, style, className }) => {
  const { data } = useProductCard();
  const final = info ?? data?.warranty;
  if (!final) return null;
  return <div style={{ color: "#333", fontSize: 12, ...style }} className={className}>质保：{final}</div>;
};