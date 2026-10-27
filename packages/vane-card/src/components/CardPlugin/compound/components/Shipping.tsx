import React from "react";
import { useProductCard } from "../ProductCard";

export type ShippingProps = {
  info?: string;
  style?: React.CSSProperties;
  className?: string;
};

export const Shipping: React.FC<ShippingProps> = ({ info, style, className }) => {
  const { data } = useProductCard();
  const final = info ?? data?.shippingInfo ?? data?.shipping;
  if (!final) return null;
  return <div style={{ color: "#333", fontSize: 12, ...style }} className={className}>配送：{final}</div>;
};