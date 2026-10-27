import React from "react";
import { useProductCard } from "../ProductCard";
import { usePluginSlot } from "../../plugins/slots";
import { matchVariant, variantListOf } from "../../types/product";

export type PriceProps = {
  value?: number | string;
  currency?: string;
  style?: React.CSSProperties;
  className?: string;
};

export const Price: React.FC<PriceProps> = ({ value, currency = "¥", style, className }) => {
  const { data, state } = useProductCard();

  // 选中变体价格优先：必须所有已选属性都匹配上，才认这条变体
  const active = matchVariant(variantListOf(data), state.attributes);
  const price = value ?? active?.price ?? data?.price;
  const priceAreaNodes = usePluginSlot("priceArea");
  if (price == null) return null;

  return (
    <div style={style} className={className}>
      {currency}
      {price}
      {priceAreaNodes.length > 0 && (
        <div className="vc-price__area" data-slot="price-area" style={{ display: "inline-flex", gap: 8, marginLeft: 8 }}>
          {priceAreaNodes.map((node, i) => (
            <React.Fragment key={i}>{node}</React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
