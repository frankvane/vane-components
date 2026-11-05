import React, { createContext, useContext } from "react";

import type { CardPlugin } from "../plugins";
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

export const ProductCardContext = createContext<ProductCardContextValue | null>(
  null
);

export function useProductCard(): ProductCardContextValue {
  const ctx = useContext(ProductCardContext);
  if (!ctx) {
    throw new Error("useProductCard must be used within <ProductCard>");
  }
  return ctx;
}
