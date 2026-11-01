import React from "react";
import { useProductCard } from "../ProductCard";
import { usePluginSlot, useBusValue, useSelectedAttributes } from "../../plugins/slots";
import { matchVariant, variantListOf } from "../../types/product";
import { BusKeys } from "../../plugins/BusKeys";

export type PriceProps = {
  value?: number | string;
  currency?: string;
  style?: React.CSSProperties;
  className?: string;
};

export const Price: React.FC<PriceProps> = ({ value, currency = "¥", style, className }) => {
  const { data, state } = useProductCard();

  // 单一真源（P1-4）：插件与复合组件都把变体价写进总线，
  // 因此总线优先；没装插件时再退回本地完全匹配 / 商品级价格。
  const attributes = useSelectedAttributes(state.attributes);
  const skuPrice = useBusValue<number>(BusKeys.skuPrice);
  const active = matchVariant(variantListOf(data), attributes);
  const price = value ?? skuPrice ?? active?.price ?? data?.price;

  const priceAreaNodes = usePluginSlot("priceArea");
  if (price == null) return null;

  return (
    <div className={`vc-price ${className ?? ""}`.trim()} style={style}>
      {currency}
      {price}
      {priceAreaNodes.length > 0 && (
        <div className="vc-price__area" data-slot="price-area">
          {priceAreaNodes}
        </div>
      )}
    </div>
  );
};
