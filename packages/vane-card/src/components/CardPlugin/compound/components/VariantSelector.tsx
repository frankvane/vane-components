import React from "react";
import { useProductCard } from "../ProductCard";
import { attributeMapOf, matchVariant, variantListOf, variantOptionsOf } from "../../types/product";
import { useCardBus, useSelectedAttributes } from "../../plugins/slots";
import { BusKeys } from "../../plugins/BusKeys";
import { writeSkuDerivedKeys } from "../../plugins/utils/sku";

export type VariantSelectorProps = {
  attributes?: Record<string, string[]>; // 直接传属性选项集
  className?: string;
  style?: React.CSSProperties;
};

export const VariantSelector: React.FC<VariantSelectorProps> = ({ attributes, className, style }) => {
  const { data, state, setState } = useProductCard();
  const bus = useCardBus();

  // 兼容两种数据结构：
  // 1) variants 数组形如 [{ options|attributes: {...}, stock, price }] → 反推出属性选项集
  // 2) variants 映射形如 { 尺码: ["38","39"], 颜色: ["蓝", "红"] }
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

  // 单一真源（P1-4）：插件写进总线的选择优先，本地 state 只是没装插件时的兜底
  const selectedAttrs = useSelectedAttributes(state.attributes) ?? {};
  const keys = Object.keys(attrs);
  if (!keys.length) return null;

  const onSelect = (name: string, val: string) => {
    const next = { ...selectedAttrs, [name]: val };
    setState((s) => ({
      ...s,
      attributes: next,
    }));
    if (bus?.setData) {
      // 与 SKUPlugin 同一套口径：先写选择，再按「完全匹配」清/写派生键
      bus.setData(BusKeys.skuSelection, next);
      writeSkuDerivedKeys(bus, matchVariant(variantListOf(data), next));
    }
  };

  return (
    <div className={`vc-variants ${className ?? ""}`.trim()} style={style}>
      {keys.map((name) => {
        const options = attrs[name] ?? [];
        const selected = selectedAttrs[name];
        return (
          <div key={name} className="vc-variants__group">
            <div className="vc-variants__label">{name}</div>
            <div className="vc-options">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`vc-option ${selected === opt ? "is-selected" : ""}`.trim()}
                  onClick={() => onSelect(name, opt)}
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
