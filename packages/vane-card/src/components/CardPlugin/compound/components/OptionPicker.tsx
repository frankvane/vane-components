import React from "react";
import { useProductCard } from "../ProductCard";

export type OptionPickerProps = {
  name: string; // 属性名，如 "color"/"size"
  options: string[];
  className?: string;
  style?: React.CSSProperties;
};

export const OptionPicker: React.FC<OptionPickerProps> = ({ name, options, className, style }) => {
  const { state, setState } = useProductCard();
  const selected = state.attributes?.[name];

  const onSelect = (val: string) => {
    setState((s) => ({
      ...s,
      attributes: { ...(s.attributes ?? {}), [name]: val },
    }));
  };

  return (
    <div className={className} style={{ display: "flex", gap: 8, flexWrap: "wrap", ...style }}>
      {options.map((opt) => (
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