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
  const list: Array<{ name: string; hex: string }> = (colors ?? data?.colors ?? []).map((c) =>
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
    <div className={`vc-swatches ${className ?? ""}`.trim()} style={style}>
      {list.map(({ name, hex }) => (
        <button
          key={name}
          type="button"
          className={`vc-swatch ${selected === name ? "is-selected" : ""}`.trim()}
          onClick={() => onSelect(name)}
          title={name}
          // 色值来自数据，属于动态值，留在内联
          style={{ background: hex }}
          aria-label={`选择颜色 ${name}`}
        />
      ))}
    </div>
  );
};