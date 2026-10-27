import React from "react";
import { useProductCard } from "../ProductCard";

export type ColorSwatchesProps = {
  colors?: Array<{ name: string; hex: string }> | string[];
  attributeName?: string; // 默认 "color"
  className?: string;
  style?: React.CSSProperties;
};

export const ColorSwatches: React.FC<ColorSwatchesProps> = ({ colors, attributeName = "color", className, style }) => {
  const { data, state, setState } = useProductCard();
  const list: Array<{ name: string; hex: string }> = (colors ?? data?.colors ?? []).map((c: any) =>
    typeof c === "string" ? { name: c, hex: c } : c
  );
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
      {list.map(({ name, hex }) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          title={name}
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: selected === name ? "2px solid #007aff" : "1px solid #ddd",
            background: hex,
            cursor: "pointer",
          }}
          aria-label={`选择颜色 ${name}`}
        />
      ))}
    </div>
  );
};