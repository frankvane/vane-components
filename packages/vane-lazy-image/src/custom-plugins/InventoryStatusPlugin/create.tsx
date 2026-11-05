import type React from "react";

import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

import { InventoryStatusOverlay } from "./internal";

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
        return <InventoryStatusOverlay config={config} />;
      },
    },
  };
}
