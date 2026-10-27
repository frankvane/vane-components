import React, { useMemo } from "react";
import { useProductCard } from "../ProductCard";
import { usePluginSlot } from "../../plugins/SlotsContext";

export type OrderSummaryPanelProps = {
  className?: string;
  style?: React.CSSProperties;
  showTax?: boolean;
  showShipping?: boolean;
  showDiscount?: boolean;
  taxRate?: number; // 税率，如 0.08 表示 8%
  shippingFee?: number;
  freeShippingThreshold?: number; // 免邮门槛
  currency?: string;
  onOrderChange?: (summary: OrderSummary) => void;
};

export interface OrderSummary {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  quantity: number;
  unitPrice: number;
}

export const OrderSummaryPanel: React.FC<OrderSummaryPanelProps> = ({
  className,
  style,
  showTax = true,
  showShipping = true,
  showDiscount = true,
  taxRate = 0.08,
  shippingFee = 10,
  freeShippingThreshold = 99,
  currency = "¥",
  onOrderChange,
}) => {
  const { data, state } = useProductCard();

  const summary = useMemo(() => {
    const quantity = state.quantity ?? 1;
    const unitPrice = Number(data?.price ?? 0);
    const oldPrice = Number(data?.oldPrice ?? 0);
    
    const subtotal = unitPrice * quantity;
    const discount = oldPrice > unitPrice ? (oldPrice - unitPrice) * quantity : 0;
    const tax = showTax ? subtotal * taxRate : 0;
    const shipping = showShipping 
      ? (subtotal >= freeShippingThreshold ? 0 : shippingFee)
      : 0;
    const total = subtotal + tax + shipping;

    return {
      subtotal,
      discount,
      tax,
      shipping,
      total,
      quantity,
      unitPrice,
    };
  }, [
    state.quantity,
    data?.price,
    data?.oldPrice,
    showTax,
    showShipping,
    showDiscount,
    taxRate,
    shippingFee,
    freeShippingThreshold,
  ]);

  // 使用 useEffect 触发回调；改为依赖原子字段，避免对象引用变化造成的循环
  React.useEffect(() => {
    onOrderChange?.(summary);
    // 仅在关键数值变化时触发，以避免“Maximum update depth exceeded”
  }, [
    summary.subtotal,
    summary.tax,
    summary.shipping,
    summary.total,
    summary.quantity,
    summary.unitPrice,
    onOrderChange,
  ]);

  const formatPrice = (price: number) => `${currency}${price.toFixed(2)}`;

  const summaryRow = (
    label: string,
    value: number | string,
    highlight = false,
    color?: string
  ) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: highlight ? "2px solid #e0e0e0" : "1px solid #f0f0f0",
        fontWeight: highlight ? 600 : 400,
        fontSize: highlight ? 16 : 14,
        color: color || (highlight ? "#333" : "#666"),
      }}
    >
      <span>{label}</span>
      <span>{typeof value === "number" ? formatPrice(value) : value}</span>
    </div>
  );

  const priceAreaNodes = usePluginSlot("priceArea");

  return (
    <div
      className={className}
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: 16,
        background: "#fafafa",
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#333",
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: "2px solid #e0e0e0",
        }}
      >
        订单明细
      </div>

      {summaryRow("商品小计", summary.subtotal)}
      
      {showDiscount && summary.discount > 0 && 
        summaryRow("优惠金额", -summary.discount, false, "#d0021b")
      }
      
      {showTax && summary.tax > 0 && 
        summaryRow(`税费 (${(taxRate * 100).toFixed(1)}%)`, summary.tax)
      }
      
      {showShipping && (
        summary.shipping > 0 
          ? summaryRow("配送费", summary.shipping)
          : summaryRow("配送费", "免费", false, "#0a7f2e")
      )}

      {summaryRow("总计", summary.total, true, "#333")}

      <div
        style={{
          marginTop: 12,
          padding: 8,
          background: "#f0f8ff",
          borderRadius: 6,
          fontSize: 12,
          color: "#666",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>数量: {summary.quantity}</span>
        <span>单价: {formatPrice(summary.unitPrice)}</span>
      </div>

      {priceAreaNodes.length > 0 && (
        <div className="vc-price__area" data-slot="price-area" style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {priceAreaNodes.map((node, i) => (
            <React.Fragment key={i}>{node}</React.Fragment>
          ))}
        </div>
      )}

      {showShipping && summary.subtotal < freeShippingThreshold && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            background: "#fff3cd",
            borderRadius: 6,
            fontSize: 12,
            color: "#856404",
            textAlign: "center",
          }}
        >
          再购买 {formatPrice(freeShippingThreshold - summary.subtotal)} 即可免邮
        </div>
      )}
    </div>
  );
};