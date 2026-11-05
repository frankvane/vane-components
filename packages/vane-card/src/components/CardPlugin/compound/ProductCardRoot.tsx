/**
 * 商品卡片根容器（组件实现）
 *
 * 上下文 / hook / 类型在 ProductCard.tsx（纯运行时模块），这里只导出组件，
 * 避免 react-refresh 把「组件 + 非组件导出」判为不可热更新。
 */

import React, { useMemo, useState } from "react";

import CardCore from "../core/CardCore";
import type { CardPlugin } from "../plugins";
import { withPlugins } from "../plugins/withPlugins";
import type { ProductData } from "../types/product";
import {
  ProductCardContext,
  type ProductCardContextValue,
  type ProductCardProps,
  type ProductCardState,
} from "./ProductCard";

/**
 * 配置指纹：把插件 config 折成稳定字符串，供 Core 记忆键使用。
 *
 * 只按 name 记忆会漏掉「同名插件换配置」：`plugins={[createSKUPlugin({ variants: 数据到达后才有的数组 })]}`
 * 首帧把 variants 定成 []，数据到了 key 不变 → Core 不重建 → 规格选择器永远空白（P1-1）。
 */
const fingerprintCache = new WeakMap<object, string>();

function stableFingerprint(value: unknown): unknown {
  if (typeof value === "function") return "fn";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stableFingerprint);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      out[key] = stableFingerprint((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

function pluginConfigFingerprint(plugin: CardPlugin): string {
  const config = plugin.config;
  if (!config) return "";
  const cached = fingerprintCache.get(config);
  if (cached !== undefined) return cached;
  let result: string;
  try {
    result = JSON.stringify(stableFingerprint(config));
  } catch {
    // config 里有循环引用等无法序列化的结构时退回「引用不稳定」，宁可重建也不静默失效
    result = "";
  }
  fingerprintCache.set(config, result);
  return result;
}

function pluginsFingerprint(plugins: CardPlugin[] | undefined): string {
  if (!plugins?.length) return "";
  return plugins.map((p) => `${p.name}#${pluginConfigFingerprint(p)}`).join("|");
}

/**
 * 商品卡片复合组件根容器：提供 `useProductCard()` 上下文，并按需挂上插件系统。
 */
export function ProductCard<T extends ProductData = ProductData>({
  productId,
  data,
  plugins,
  className = "",
  containerStyle,
  children,
}: ProductCardProps<T>) {
  const [state, setState] = useState<ProductCardState>({
    cart: {},
    wishlist: {},
    attributes: {},
    quantity: 1,
  });

  const ctxValue = useMemo<ProductCardContextValue>(
    () => ({ productId, data, state, setState }),
    [productId, data, state]
  );

  // 插件数组常被写成内联字面量（每次渲染都是新引用）。若按引用重建 Core，
  // 父组件每次重渲染都会卸载重挂整棵树 —— 插件 onMount 重跑、内部状态全丢。
  // 这里按「插件名 + 配置指纹」记忆：名字和配置都没变才复用，同名换配置一定会重建。
  const pluginKey = pluginsFingerprint(plugins);
  const Core = useMemo(() => {
    if (!pluginKey) return CardCore;
    return withPlugins(CardCore, { plugins: plugins ?? [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 依赖语义就是 pluginKey（见上）
  }, [pluginKey]);

  return (
    <ProductCardContext.Provider value={ctxValue}>
      <div className={`vc-product-card ${className}`.trim()} style={containerStyle}>
        <Core cardId={productId} data={data}>
          {children}
        </Core>
      </div>
    </ProductCardContext.Provider>
  );
}
