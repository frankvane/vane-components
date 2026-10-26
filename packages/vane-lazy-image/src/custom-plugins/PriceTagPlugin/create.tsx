import React from "react";
import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

export interface PriceTagPluginConfig {
  price?: number;
  currency?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  originalPrice?: number;
  discount?: string;
  showSavings?: boolean;
  style?: React.CSSProperties;
  animate?: boolean;
  backgroundColor?: string;
  textColor?: string;
  /** 异步获取价格（API 集成）。返回价格信息覆盖静态配置。 */
  fetchPrice?: (context: LazyImageContext) => Promise<{
    price: number;
    originalPrice?: number;
    discount?: string;
  }>;
  loadingText?: string;
  errorText?: string;
}

const POSITIONS: Record<string, React.CSSProperties> = {
  "top-left": { top: 10, left: 10 },
  "top-right": { top: 10, right: 10 },
  "bottom-left": { bottom: 10, left: 10 },
  "bottom-right": { bottom: 10, right: 10 },
};

const KEYFRAMES = `
  @keyframes priceTagFadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

function PriceTagOverlay({
  config,
  context,
}: {
  config: PriceTagPluginConfig;
  context: LazyImageContext;
}) {
  const {
    price,
    currency = "$",
    position = "top-right",
    originalPrice,
    discount,
    showSavings = false,
    style = {},
    animate = true,
    backgroundColor = "#ff4757",
    textColor = "#fff",
    fetchPrice,
    loadingText = "加载中...",
    errorText = "价格获取失败",
  } = config;

  const [fetched, setFetched] = React.useState<{
    price: number;
    originalPrice?: number;
    discount?: string;
  } | null>(null);
  const [loading, setLoading] = React.useState<boolean>(!!fetchPrice);
  const [errored, setErrored] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!fetchPrice) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErrored(false);
        const data = await fetchPrice(context);
        if (alive) setFetched(data);
      } catch (err) {
        console.error("[PriceTagPlugin] fetchPrice failed:", err);
        if (alive) setErrored(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchPrice, context]);

  const finalPrice = fetched?.price ?? price;
  const finalOriginal = fetched?.originalPrice ?? originalPrice;
  const finalDiscount = fetched?.discount ?? discount;
  const savings =
    showSavings &&
    finalOriginal != null &&
    typeof finalPrice === "number" &&
    typeof finalOriginal === "number"
      ? finalOriginal - finalPrice
      : null;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    ...POSITIONS[position],
    backgroundColor,
    color: textColor,
    padding: "8px 12px",
    borderRadius: 4,
    fontWeight: "bold",
    fontSize: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    zIndex: 10,
    animation: animate ? "priceTagFadeIn 0.3s ease-out" : "none",
    ...style,
  };

  if (loading) {
    return (
      <>
        <div style={baseStyle}>
          <div style={{ fontSize: 14, opacity: 0.8 }}>{loadingText}</div>
        </div>
        {animate && <style>{KEYFRAMES}</style>}
      </>
    );
  }

  if (errored) {
    return (
      <>
        <div style={{ ...baseStyle, backgroundColor: "#e74c3c" }}>
          <div style={{ fontSize: 12 }}>{errorText}</div>
        </div>
        {animate && <style>{KEYFRAMES}</style>}
      </>
    );
  }

  if (finalPrice == null && finalPrice !== 0) return null;

  return (
    <>
      <div style={baseStyle}>
        {finalDiscount && (
          <div
            style={{
              fontSize: 11,
              fontWeight: "normal",
              marginBottom: 2,
              opacity: 0.9,
            }}
          >
            {finalDiscount}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 20 }}>
            {currency}
            {finalPrice}
          </span>
        </div>
        {finalOriginal != null && (
          <div
            style={{
              fontSize: 12,
              textDecoration: "line-through",
              opacity: 0.7,
              marginTop: 2,
            }}
          >
            {currency}
            {finalOriginal}
          </div>
        )}
        {savings != null && savings > 0 && (
          <div
            style={{
              fontSize: 11,
              marginTop: 4,
              backgroundColor: "rgba(255,255,255,0.2)",
              padding: "2px 6px",
              borderRadius: 2,
            }}
          >
            省 {currency}
            {savings.toFixed(2)}
          </div>
        )}
      </div>
      {animate && <style>{KEYFRAMES}</style>}
    </>
  );
}

export function createPriceTagPlugin(
  config: PriceTagPluginConfig = {}
): LazyImagePlugin {
  return {
    name: "price-tag",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => {
        if (!context.imageState.isLoaded) return null;
        return <PriceTagOverlay config={config} context={context} />;
      },
    },
  };
}
