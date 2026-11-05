import type React from "react";

import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

import { PriceTagOverlay } from "./internal";

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
