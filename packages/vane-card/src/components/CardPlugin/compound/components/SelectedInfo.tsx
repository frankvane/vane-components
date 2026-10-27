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
    <div className="vc-selected__row">
      <span className="vc-selected__label">{label}</span>
      <span className="vc-selected__value">{value}</span>
    </div>
  );

  return (
    <div className={`vc-selected ${className ?? ""}`.trim()} style={style}>
      <div className="vc-selected__head">
        <div className="vc-selected__title">选中信息</div>
        <button
          type="button"
          className={`vc-btn ${copied ? "is-active" : ""}`.trim()}
          onClick={onCopy}
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
        <div className="vc-selected__row vc-selected__row--stack">
          <div className="vc-selected__label">属性</div>
          <div className="vc-selected__tags">
            {Object.entries(info.attributes || {}).map(([k, v]) => (
              <span key={k} className="vc-selected__tag">
                {k}: {String(v)}
              </span>
            ))}
          </div>
        </div>
      )}

      {showJSON && <pre className="vc-selected__json">{JSON.stringify(info, null, 2)}</pre>}
    </div>
  );
};