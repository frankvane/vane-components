import React from "react";

export type BundleItem = {
  id: string;
  title: string;
  price: number; // 单价（分）
  image?: string;
};

export type Bundle = {
  id: string;
  title: string;
  items: BundleItem[];
  bundlePrice?: number; // 搭配购价（分）
  savingsPercent?: number; // 直接提供折扣百分比
};

export type UpsellBundleProps = {
  className?: string;
  style?: React.CSSProperties;
  bundles: Bundle[];
  layout?: "horizontal" | "vertical";
  showSavings?: boolean;
  currency?: string; // 默认 RMB
  onAddBundle?: (bundle: Bundle) => void;
};

function formatPrice(cents: number, currency = "¥") {
  return `${currency}${(cents / 100).toFixed(2)}`;
}

export const UpsellBundle: React.FC<UpsellBundleProps> = ({
  className = "",
  style,
  bundles,
  layout = "horizontal",
  showSavings = true,
  currency = "¥",
  onAddBundle,
}) => {
  const containerStyles: React.CSSProperties = {
    display: "grid",
    gap: 12,
    ...style,
  };

  const cardStyles: React.CSSProperties = {
    display: "grid",
    gap: 8,
    border: "1px solid #eee",
    borderRadius: 8,
    padding: 12,
    background: "#fafafa",
  };

  const listStyles: React.CSSProperties = {
    display: "grid",
    gap: 8,
    gridTemplateColumns: layout === "horizontal" ? "repeat(auto-fill, minmax(220px, 1fr))" : "1fr",
  };

  const imageBox: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 6,
    overflow: "hidden",
    border: "1px solid #eee",
    background: "#fff",
  };

  return (
    <div className={`upsell-bundle ${className}`} style={containerStyles}>
      <div style={listStyles}>
        {bundles.map((b) => {
          const original = b.items.reduce((sum, it) => sum + it.price, 0);
          const final = typeof b.bundlePrice === "number" ? b.bundlePrice : Math.round(original * (1 - (b.savingsPercent ?? 0) / 100));
          const savings = Math.max(0, original - final);

          return (
            <div key={b.id} style={cardStyles}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{b.title}</strong>
                {showSavings && savings > 0 && (
                  <span style={{ color: "#d0021b" }}>立省 {formatPrice(savings, currency)}</span>
                )}
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {b.items.map((it) => (
                  <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={imageBox}>
                      {it.image ? (
                        <img src={it.image} alt={it.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#999", fontSize: 12 }}>无图</div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14 }}>{it.title}</div>
                      <div style={{ color: "#666", fontSize: 12 }}>{formatPrice(it.price, currency)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div>
                  <div style={{ color: "#666", fontSize: 12 }}>原价合计：{formatPrice(original, currency)}</div>
                  <div>
                    搭配购：<strong style={{ color: "#333" }}>{formatPrice(final, currency)}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAddBundle?.(b)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #ddd",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  加入搭配购
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};