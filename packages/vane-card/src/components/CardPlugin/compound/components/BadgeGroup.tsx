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
    <div className={`vc-badge-group ${className ?? ""}`.trim()} style={style}>
      {list.map((b, i) => (
        <span key={i} className="vc-badge">
          {b}
        </span>
      ))}
    </div>
  );
};