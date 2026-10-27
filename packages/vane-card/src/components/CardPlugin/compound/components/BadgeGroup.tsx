import React from "react";
import { useProductCard } from "../ProductCard";

export type BadgeGroupProps = {
  badges?: string[];
  className?: string;
  style?: React.CSSProperties;
};

export const BadgeGroup: React.FC<BadgeGroupProps> = ({ badges, className, style }) => {
  const { data } = useProductCard();
  const list: string[] = badges ?? data?.badges ?? (data?.badge ? [data.badge] : []);
  if (!list.length) return null;
  return (
    <div className={className} style={{ display: "flex", gap: 6, flexWrap: "wrap", ...style }}>
      {list.map((b, i) => (
        <span key={i} style={{ display: "inline-block", padding: "2px 6px", background: "#ffe08a", borderRadius: 4, fontSize: 12 }}>{b}</span>
      ))}
    </div>
  );
};