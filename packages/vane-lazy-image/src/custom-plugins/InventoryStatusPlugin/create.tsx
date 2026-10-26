import React from "react";
import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

export interface InventoryStatusPluginConfig {
  status?: "in-stock" | "out-of-stock" | "low-stock" | "pre-order";
  stockCount?: number;
  lowStockThreshold?: number;
  showBadge?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  fetchStock?: () => Promise<{ status?: string; count?: number }>;
  onStatusChange?: (status: string) => void;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  style?: React.CSSProperties;
}

const STATUS_MAP: Record<
  string,
  { text: string; bg: string; color: string; icon: string }
> = {
  "in-stock": { text: "有货", bg: "#4CAF50", color: "#fff", icon: "✓" },
  "out-of-stock": { text: "缺货", bg: "#F44336", color: "#fff", icon: "✕" },
  "low-stock": { text: "库存紧张", bg: "#FF9800", color: "#fff", icon: "⚠" },
  "pre-order": { text: "预订", bg: "#2196F3", color: "#fff", icon: "🕐" },
};

const POSITIONS: Record<string, React.CSSProperties> = {
  "top-left": { top: 10, left: 10 },
  "top-right": { top: 10, right: 10 },
  "bottom-left": { bottom: 10, left: 10 },
  "bottom-right": { bottom: 10, right: 10 },
};

const KEYFRAMES = `
  @keyframes inventoryFadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

function InventoryStatusOverlay({
  config,
  context,
}: {
  config: InventoryStatusPluginConfig;
  context: LazyImageContext;
}) {
  const {
    status,
    stockCount,
    lowStockThreshold = 10,
    showBadge = true,
    autoRefresh = false,
    refreshInterval = 30000,
    fetchStock,
    onStatusChange,
    position = "top-right",
    style = {},
  } = config;

  const [currentStatus, setCurrentStatus] = React.useState<string | undefined>(
    status
  );
  const [count, setCount] = React.useState<number | undefined>(stockCount);

  React.useEffect(() => {
    if (!autoRefresh || !fetchStock) return;
    const timer = setInterval(async () => {
      try {
        const data = await fetchStock();
        if (data.status !== undefined) setCurrentStatus(data.status);
        if (data.count !== undefined) setCount(data.count);
        if (data.status !== undefined) onStatusChange?.(data.status);
      } catch (err) {
        console.error("[InventoryStatusPlugin] fetchStock failed:", err);
      }
    }, refreshInterval);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchStock, refreshInterval, onStatusChange]);

  if (!showBadge) return null;

  let resolved: string = currentStatus ?? "in-stock";
  if (count !== undefined) {
    if (count === 0) resolved = "out-of-stock";
    else if (count <= lowStockThreshold) resolved = "low-stock";
    else if (resolved !== "pre-order") resolved = "in-stock";
  }

  const meta = STATUS_MAP[resolved] ?? STATUS_MAP["in-stock"];
  const badgeStyle: React.CSSProperties = {
    position: "absolute",
    ...POSITIONS[position],
    backgroundColor: meta.bg,
    color: meta.color,
    padding: "6px 12px",
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: 4,
    animation: "inventoryFadeIn 0.3s ease-out",
    ...style,
  };

  return (
    <>
      <div style={badgeStyle}>
        <span>{meta.icon}</span>
        <span>{meta.text}</span>
        {count !== undefined && resolved !== "out-of-stock" && (
          <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.9 }}>
            ({count})
          </span>
        )}
      </div>
      <style>{KEYFRAMES}</style>
    </>
  );
}

export function createInventoryStatusPlugin(
  config: InventoryStatusPluginConfig = {}
): LazyImagePlugin {
  return {
    name: "inventory-status",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => {
        if (!context.imageState.isLoaded) return null;
        return <InventoryStatusOverlay config={config} context={context} />;
      },
    },
  };
}
