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
    <div className={`vc-tags ${className ?? ""}`.trim()} style={style}>
      {list.map((t, i) => (
        <span key={i} className="vc-tag">
          {t}
        </span>
      ))}
    </div>
  );
};