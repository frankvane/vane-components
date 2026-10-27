import React from "react";
import { useProductCard } from "../ProductCard";

export type TagsProps = {
  items?: string[];
  style?: React.CSSProperties;
  className?: string;
};

export const Tags: React.FC<TagsProps> = ({ items, style, className }) => {
  const { data } = useProductCard();
  const list: string[] = items ?? data?.tags ?? [];
  if (!list.length) return null;
  return (
    <div className={className} style={{ display: "flex", flexWrap: "wrap", gap: 6, ...style }}>
      {list.map((t, i) => (
        <span key={i} style={{ fontSize: 12, color: "#555", background: "#f2f2f2", padding: "2px 6px", borderRadius: 4 }}>{t}</span>
      ))}
    </div>
  );
};