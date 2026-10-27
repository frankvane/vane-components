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
  return (
    <div className={`vc-warranty ${className ?? ""}`.trim()} style={style}>
      质保：{final}
    </div>
  );
};