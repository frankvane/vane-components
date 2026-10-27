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
    <ul className={className} style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6, ...style }}>
      {list.map((t, i) => (
        <li key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden>{icon}</span>
          <span style={{ fontSize: 13, color: "#444" }}>{t}</span>
        </li>
      ))}
    </ul>
  );
};