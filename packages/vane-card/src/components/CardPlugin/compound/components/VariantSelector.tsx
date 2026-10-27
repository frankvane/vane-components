import React from "react";
import { useProductCard } from "../ProductCard";

export type VariantSelectorProps = {
  attributes?: Record<string, string[]>; // 直接传属性选项集
  className?: string;
  style?: React.CSSProperties;
};

export const VariantSelector: React.FC<VariantSelectorProps> = ({ attributes, className, style }) => {
  const { data, state, setState } = useProductCard();

  // 兼容两种数据结构：
  // 1) attributes 形如 { 尺码: ["38","39"], 颜色: ["蓝","红"] }
  // 2) variants 数组形如 [{ options|attributes: {...}, stock, price }]
  const buildAttributesFromVariants = (list: any[]): Record<string, string[]> => {
    const map: Record<string, Set<string>> = {};
    list.forEach((v) => {
      const opts = (v.options || v.attributes) || {};
      Object.keys(opts).forEach((k) => {
        if (!map[k]) map[k] = new Set();
        map[k].add(String(opts[k]));
      });
    });
    const result: Record<string, string[]> = {};
    Object.keys(map).forEach((k) => (result[k] = Array.from(map[k])));
    return result;
  };

  let attrs: Record<string, string[]> = attributes ?? {};
  if (!Object.keys(attrs).length) {
    if (Array.isArray(data?.variants)) {
      attrs = buildAttributesFromVariants(data!.variants as any[]);
    } else if (data?.variants && typeof data.variants === "object") {
      attrs = data.variants as Record<string, string[]>;
    }
  }

  const keys = Object.keys(attrs);
  if (!keys.length) return null;

  const onSelect = (name: string, val: string) => {
    setState((s) => ({
      ...s,
      attributes: { ...(s.attributes ?? {}), [name]: val },
    }));
  };

  return (
    <div className={className} style={{ display: "grid", gap: 10, ...style }}>
      {keys.map((name) => {
        const options = attrs[name] ?? [];
        const selected = state.attributes?.[name];
        return (
          <div key={name}>
            <div style={{ marginBottom: 6, color: "#666", fontSize: 12 }}>{name}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onSelect(name, opt)}
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
          </div>
        );
      })}
    </div>
  );
};