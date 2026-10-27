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
  return (
    <div className={`vc-upsell ${className}`.trim()} style={style}>
      <div className={`vc-upsell__list ${layout === "vertical" ? "vc-upsell__list--vertical" : ""}`.trim()}>
        {bundles.map((b) => {
          const original = b.items.reduce((sum, it) => sum + it.price, 0);
          const final =
            typeof b.bundlePrice === "number"
              ? b.bundlePrice
              : Math.round(original * (1 - (b.savingsPercent ?? 0) / 100));
          const savings = Math.max(0, original - final);

          return (
            <div key={b.id} className="vc-upsell__card">
              <div className="vc-upsell__head">
                <strong>{b.title}</strong>
                {showSavings && savings > 0 && (
                  <span className="vc-upsell__savings">立省 {formatPrice(savings, currency)}</span>
                )}
              </div>

              <div className="vc-upsell__items">
                {b.items.map((it) => (
                  <div key={it.id} className="vc-upsell__item">
                    <div className="vc-upsell__thumb">
                      {it.image ? (
                        <img src={it.image} alt={it.title} className="vc-media__fill" />
                      ) : (
                        <div className="vc-upsell__thumb-empty">无图</div>
                      )}
                    </div>
                    <div className="vc-upsell__info">
                      <div className="vc-upsell__name">{it.title}</div>
                      <div className="vc-upsell__price">{formatPrice(it.price, currency)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="vc-upsell__foot">
                <div>
                  <div className="vc-upsell__origin">原价合计：{formatPrice(original, currency)}</div>
                  <div>
                    搭配购：
                    <strong className="vc-upsell__final">{formatPrice(final, currency)}</strong>
                  </div>
                </div>
                <button type="button" className="vc-btn" onClick={() => onAddBundle?.(b)}>
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