import React from "react";
import { useProductCard } from "../ProductCard";

export type FeatureListProps = {
  items?: string[];
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export const FeatureList: React.FC<FeatureListProps> = ({ items, icon = "✔", style, className }) => {
  const { data } = useProductCard();
  const list: string[] = items ?? data?.features ?? [];
  if (!list.length) return null;
  return (
    <ul className={`vc-features ${className ?? ""}`.trim()} style={style}>
      {list.map((t, i) => (
        <li key={i} className="vc-features__item">
          <span aria-hidden>{icon}</span>
          <span className="vc-features__text">{t}</span>
        </li>
      ))}
    </ul>
  );
};