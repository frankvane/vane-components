import React, { useMemo, useState } from "react";
import { useProductCard } from "../ProductCard";

export type SelectedInfoProps = {
  className?: string;
  style?: React.CSSProperties;
  showJSON?: boolean;
};

export const SelectedInfo: React.FC<SelectedInfoProps> = ({ className, style, showJSON = false }) => {
  const { productId, data, state } = useProductCard();
  const [copied, setCopied] = useState(false);

  const discountPct = useMemo(() => {
    const oldP = Number(data?.oldPrice ?? 0);
    const p = Number(data?.price ?? 0);
    if (!oldP || !p || p >= oldP) return 0;
    return Math.round(((oldP - p) / oldP) * 100);
  }, [data?.oldPrice, data?.price]);

  const info = useMemo(() => {
    const quantity = state.quantity ?? 1;
    const unitPrice = Number(data?.price ?? 0);
    const totalPrice = unitPrice * quantity;
    return {
      productId,
      title: data?.title,
      sku: data?.sku,
      attributes: state.attributes ?? {},
      quantity,
      unitPrice,
      discountPct,
      totalPrice,
    };
  }, [productId, data, state, discountPct]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(info, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const tag = (label: string, value?: React.ReactNode) => (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ color: "#666", fontSize: 12 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );

  return (
    <div
      className={className}
      style={{
        border: "1px solid #eee",
        borderRadius: 8,
        padding: 12,
        background: "#fafafa",
        display: "grid",
        gap: 8,
        ...style,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>选中信息</div>
        <button
          onClick={onCopy}
          style={{ padding: "4px 10px", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: copied ? "#e6f0ff" : "#fff" }}
        >
          {copied ? "已复制" : "复制JSON"}
        </button>
      </div>

      {tag("商品", info.title)}
      {tag("SKU", info.sku)}
      {tag("数量", info.quantity)}
      {tag("单价", `${info.unitPrice}`)}
      {tag("折扣", discountPct ? `${discountPct}%` : "-")}
      {tag("总价", `${info.totalPrice}`)}

      {!!Object.keys(info.attributes || {}).length && (
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ color: "#666", fontSize: 12 }}>属性</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(info.attributes || {}).map(([k, v]) => (
              <span key={k} style={{ padding: "2px 8px", border: "1px solid #ddd", borderRadius: 999, fontSize: 12 }}>{k}: {String(v)}</span>
            ))}
          </div>
        </div>
      )}

      {showJSON && (
        <pre style={{ margin: 0, padding: 8, background: "#fff", border: "1px solid #eee", borderRadius: 6, fontSize: 12, overflow: "auto" }}>
          {JSON.stringify(info, null, 2)}
        </pre>
      )}
    </div>
  );
};