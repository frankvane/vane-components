import React from "react";
import { useProductCard } from "../ProductCard";

export type SizeSelectorProps = {
  sizes?: string[];
  attributeName?: string; // 默认 "size"
  className?: string;
  style?: React.CSSProperties;
};

export const SizeSelector: React.FC<SizeSelectorProps> = ({ sizes, attributeName = "size", className, style }) => {
  const { data, state, setState } = useProductCard();
  const list: string[] = sizes ?? data?.sizes ?? [];
  if (!list.length) return null;
  const selected = state.attributes?.[attributeName];

  const onSelect = (val: string) => {
    setState((s) => ({
      ...s,
      attributes: { ...(s.attributes ?? {}), [attributeName]: val },
    }));
  };

  return (
    <div className={className} style={{ display: "flex", gap: 8, flexWrap: "wrap", ...style }}>
      {list.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            border: selected === opt ? "2px solid #007aff" : "1px solid #ddd",
            background: selected === opt ? "#e6f0ff" : "#fff",
            cursor: "pointer",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};