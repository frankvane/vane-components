import React from "react";
import { useProductCard } from "../ProductCard";
import { attributeMapOf, variantListOf, variantOptionsOf } from "../../types/product";

export type VariantSelectorProps = {
  attributes?: Record<string, string[]>; // 直接传属性选项集
  className?: string;
  style?: React.CSSProperties;
};

export const VariantSelector: React.FC<VariantSelectorProps> = ({ attributes, className, style }) => {
  const { data, state, setState } = useProductCard();

  // 兼容两种数据结构：
  // 1) variants 数组形如 [{ options|attributes: {...}, stock, price }] → 反推出属性选项集
  // 2) variants 映射形如 { 尺码: ["38","39"], 颜色: ["蓝","红"] }
  const buildAttributesFromVariants = (list: ReturnType<typeof variantListOf>): Record<string, string[]> => {
    const map: Record<string, Set<string>> = {};
    (list ?? []).forEach((variant) => {
      const opts = variantOptionsOf(variant);
      Object.keys(opts).forEach((key) => {
        if (!map[key]) map[key] = new Set();
        map[key].add(String(opts[key]));
      });
    });
    const result: Record<string, string[]> = {};
    Object.keys(map).forEach((key) => (result[key] = Array.from(map[key])));
    return result;
  };

  let attrs: Record<string, string[]> = attributes ?? {};
  if (!Object.keys(attrs).length) {
    const list = variantListOf(data);
    attrs = list ? buildAttributesFromVariants(list) : (attributeMapOf(data) ?? {});
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