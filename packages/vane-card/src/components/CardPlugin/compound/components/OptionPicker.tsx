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
    <div className={`vc-options ${className ?? ""}`.trim()} style={style}>
      {options.map((opt) => (
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