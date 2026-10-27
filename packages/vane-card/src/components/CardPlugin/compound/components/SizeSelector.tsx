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
    <div className={`vc-options ${className ?? ""}`.trim()} style={style}>
      {list.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`vc-option ${selected === opt ? "is-selected" : ""}`.trim()}
          onClick={() => onSelect(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};