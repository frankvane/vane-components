/**
 * SKUPlugin - 基础变体选择与匹配
 */
import type { CardPlugin, PluginCreator } from "../../plugins/types";
import { BusKeys } from "../../plugins/BusKeys";
import React from "react";

export interface SKUAttribute {
  name: string; // 如 颜色、尺码
  options: string[]; // 如 ["红", "蓝"]
}

export interface SKUVariant {
  sku: string;
  attrs: Record<string, string>; // { 颜色: "红", 尺码: "M" }
  price?: number;
  stock?: number;
  image?: string;
}

export interface SKUPluginConfig {
  attributes: SKUAttribute[];
  variants: SKUVariant[];
  renderIn?: "footer" | "overlay"; // 选择控件位置
}

function matchVariant(variants: SKUVariant[], selection: Record<string, string>): SKUVariant | undefined {
  if (!variants.length) return undefined;
  const keys = Object.keys(selection);
  if (!keys.length) return undefined;
  return variants.find((v) => keys.every((k) => v.attrs[k] === selection[k]));
}

const Selector: React.FC<{
  attributes: SKUAttribute[];
  selection: Record<string, string>;
  onChange: (name: string, value: string) => void;
}> = ({ attributes, selection, onChange }) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
      {attributes.map((attr) => (
        <div key={attr.name} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#666", minWidth: 60 }}>{attr.name}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {attr.options.map((opt) => {
              const active = selection[attr.name] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => onChange(attr.name, opt)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: active ? "2px solid #4CAF50" : "1px solid #ddd",
                    background: active ? "#E8F5E9" : "#fff",
                    color: "#333",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export const createSKUPlugin: PluginCreator<any, SKUPluginConfig> = (config) => {
  const attributes = config?.attributes || [];
  const variants = config?.variants || [];
  const renderIn = config?.renderIn || "footer";

  const plugin: CardPlugin = {
    name: "SKUPlugin",
    version: "1.0.0",
    description: "基础 SKU 变体选择与匹配",
    priority: 60,
  hooks: {
    onMount: (context) => {
      // 初始化选择
      const initSel = attributes.reduce<Record<string, string>>((acc, a) => {
        const d = (context.data as any)?.defaultAttrs?.[a.name];
        if (d) acc[a.name] = d;
        return acc;
      }, {});
      context.bus?.setData?.(BusKeys.skuSelection, initSel);
      const matched = matchVariant(variants, initSel);
      if (matched) context.bus?.setData?.(BusKeys.skuVariant, matched);
      // 发布 sku:change 事件，包含当前选择、匹配变体与库存
      context.bus?.emit?.("sku:change", {
        attrs: initSel,
        variant: matched,
        stock: typeof matched?.stock === "number" ? matched?.stock : undefined,
      });
    },
    renderFooter: (context) => {
      if (renderIn !== "footer") return null;
      const sel = context.bus?.getData?.<Record<string, string>>(BusKeys.skuSelection) || {};
      const setSel = (name: string, value: string) => {
        const next = { ...sel, [name]: value };
        context.bus?.setData?.(BusKeys.skuSelection, next);
        const matched = matchVariant(variants, next);
        if (matched) {
          context.bus?.setData?.(BusKeys.skuVariant, matched);
          // 可选：同步价格或图片到 data 的派生层
          if (matched.price) context.bus?.setData?.(BusKeys.skuPrice, matched.price);
          if (matched.image) context.bus?.setData?.(BusKeys.skuImage, matched.image);
        }
        // 发布 sku:change 事件
        context.bus?.emit?.("sku:change", {
          attrs: next,
          variant: matched,
          stock: typeof matched?.stock === "number" ? matched?.stock : undefined,
        });
      };

        const variant = context.bus?.getData?.<SKUVariant>(BusKeys.skuVariant);
        return (
          <div style={{ padding: 12, borderTop: "1px dashed #eee" }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>选择规格</div>
            <Selector attributes={attributes} selection={sel} onChange={setSel} />
            {variant && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
                已选：{Object.entries(variant.attrs).map(([k, v]) => `${k}:${v}`).join(" / ")}（SKU：{variant.sku}）
                {typeof variant.stock === "number" && <span style={{ marginLeft: 8 }}>库存：{variant.stock}</span>}
              </div>
            )}
          </div>
        );
      },
      renderOverlay: (context) => {
        if (renderIn !== "overlay") return null;
      const sel = context.bus?.getData?.<Record<string, string>>(BusKeys.skuSelection) || {};
      const setSel = (name: string, value: string) => {
        const next = { ...sel, [name]: value };
        context.bus?.setData?.(BusKeys.skuSelection, next);
        const matched = matchVariant(variants, next);
        if (matched) context.bus?.setData?.(BusKeys.skuVariant, matched);
        // 发布 sku:change 事件（overlay 模式）
        context.bus?.emit?.("sku:change", {
          attrs: next,
          variant: matched,
          stock: typeof matched?.stock === "number" ? matched?.stock : undefined,
        });
      };
        return (
          <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, background: "rgba(255,255,255,0.9)", borderRadius: 8, padding: 8, zIndex: 9 }}>
            <Selector attributes={attributes} selection={sel} onChange={setSel} />
          </div>
        );
      },
    },
    config,
  };

  return plugin;
};