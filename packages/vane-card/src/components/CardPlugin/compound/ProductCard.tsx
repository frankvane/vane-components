import React, { createContext, useContext, useMemo, useState } from "react";

import CardCore from "../core/CardCore";
import type { CardPlugin } from "../plugins";
import { withPlugins } from "../plugins/withPlugins";
import type { ProductData } from "../types/product";

export type ProductCardState = {
  cart: Record<string, number>;
  wishlist: Record<string, boolean>;
  /** 选中的 SKU 属性（如颜色/尺码） */
  attributes?: Record<string, string>;
  quantity?: number;
};

export type ProductCardContextValue = {
  productId: string;
  data?: ProductData;
  state: ProductCardState;
  setState: React.Dispatch<React.SetStateAction<ProductCardState>>;
};

const ProductCardContext = createContext<ProductCardContextValue | null>(null);

export function useProductCard(): ProductCardContextValue {
  const ctx = useContext(ProductCardContext);
  if (!ctx) {
    throw new Error("useProductCard must be used within <ProductCard>");
  }
  return ctx;
}

export type ProductCardProps<T extends ProductData = ProductData> = {
  productId: string;
  /**
   * 商品数据。已知字段（price / variants / image…）按 {@link ProductData} 校验，
   * 业务侧自定义字段原样透传、不报错。
   */
  data?: T;
  plugins?: CardPlugin[];
  className?: string;
  containerStyle?: React.CSSProperties;
  children?: React.ReactNode;
};

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
  // 这里按「插件名签名」记忆：内容没变就不重建。
  const pluginKey = plugins?.map((p) => p.name).join("|") ?? "";
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
