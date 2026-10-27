import React, { createContext, useContext, useMemo, useState } from "react";

import CardCore from "../core/CardCore";
import type { CardPlugin } from "../plugins";
import { withPlugins } from "../plugins/withPlugins";

export type ProductCardState = {
  cart: Record<string, number>;
  wishlist: Record<string, boolean>;
  attributes?: Record<string, string>; // 选中的SKU属性（如颜色/尺码）
  quantity?: number; // 购买数量
};

export type ProductCardContextValue = {
  productId: string;
  data?: any;
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

export type ProductCardProps = {
  productId: string;
  data?: any;
  plugins?: CardPlugin[];
  className?: string;
  containerStyle?: React.CSSProperties;
  children?: React.ReactNode;
};

export const ProductCard: React.FC<ProductCardProps> = ({
  productId,
  data,
  plugins,
  className,
  containerStyle,
  children,
}) => {
  const [state, setState] = useState<ProductCardState>({ cart: {}, wishlist: {}, attributes: {}, quantity: 1 });

  const ctxValue = useMemo<ProductCardContextValue>(
    () => ({ productId, data, state, setState }),
    [productId, data, state]
  );

  const Core = useMemo(() => {
    if (plugins && plugins.length) {
      return withPlugins(CardCore, { plugins });
    }
    return CardCore;
  }, [plugins]);

  return (
    <ProductCardContext.Provider value={ctxValue}>
      <div className={className} style={containerStyle}>
        <Core cardId={productId} data={data}>{children}</Core>
      </div>
    </ProductCardContext.Provider>
  );
};