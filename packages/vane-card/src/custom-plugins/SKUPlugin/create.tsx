/**
 * SKUPlugin - 基础变体选择与匹配
 *
 * 口径统一（P1-2）：与复合组件完全一致地使用 `attributesMatchExactly` ——
 * 只有「已选属性集 == 变体属性集」才算命中；只选了颜色还没选尺码时不写价格，
 * 让价格回退到商品级字段，而不是拿数组里第一条同色变体顶上去。
 *
 * 派生键（P1-3）：每次选择变化都先清后写（`writeSkuDerivedKeys`），
 * 并且 onMount 返回总线订阅，只装 SKUPlugin 时选中态也能刷新。
 */
import type { CardPlugin, PluginCreator } from "../../components/CardPlugin/plugins/types";
import { BusKeys } from "../../components/CardPlugin/plugins/BusKeys";
import { attributesMatchExactly } from "../../components/CardPlugin/types/product";
import { setupForceUpdateOnBusKeys } from "../../components/CardPlugin/plugins/utils/busHelpers";
import { writeSkuDerivedKeys } from "../../components/CardPlugin/plugins/utils/sku";
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

function matchVariant(
  variants: SKUVariant[],
  selection: Record<string, string>
): SKUVariant | undefined {
  if (!variants.length) return undefined;
  return variants.find((v) => attributesMatchExactly(v.attrs, selection));
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
                    border: active ? "2px solid #2e7d32" : "1px solid #ddd",
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

  /** 唯一的「写选择 + 写派生键 + 发事件」入口（footer / overlay / 首屏共用） */
  const applySelection = (
    context: { bus?: any },
    next: Record<string, string>
  ) => {
    const bus = context.bus;
    bus?.setData?.(BusKeys.skuSelection, next);
    const matched = matchVariant(variants, next);
    // 先清后写：未命中时把 skuVariant / skuPrice / skuImage 全部清掉
    writeSkuDerivedKeys(bus, matched);
    // 发布 sku:change 事件
    bus?.emit?.("sku:change", {
      attrs: next,
      variant: matched,
      stock: typeof matched?.stock === "number" ? matched.stock : undefined,
    });
  };

  const plugin: CardPlugin = {
    name: "SKUPlugin",
    version: "1.1.0",
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
        applySelection(context, initSel);
        // 只装 SKUPlugin（没有 PriceCalculator 等消费方）时，点击后也要刷新选中态
        return setupForceUpdateOnBusKeys(context, [
          BusKeys.skuSelection,
          BusKeys.skuVariant,
        ]);
      },
      renderFooter: (context) => {
        if (renderIn !== "footer") return null;
        const sel = context.bus?.getData?.<Record<string, string>>(BusKeys.skuSelection) || {};
        const setSel = (name: string, value: string) => {
          applySelection(context, { ...sel, [name]: value });
        };

        const variant = context.bus?.getData?.<SKUVariant>(BusKeys.skuVariant);
        return (
          <div style={{ padding: 12, borderTop: "1px dashed #eee" }}>
            <div style={{ fontSize: 12, color: "#6b6b6b", marginBottom: 6 }}>选择规格</div>
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
          applySelection(context, { ...sel, [name]: value });
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
