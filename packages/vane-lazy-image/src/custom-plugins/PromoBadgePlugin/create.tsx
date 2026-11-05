import type React from "react";

import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

import { PromoBadgeOverlay } from "./internal";

export interface PromoBadgePluginConfig {
  type?: "new" | "hot" | "sale" | "limited" | "bestseller" | "custom";
  text?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  color?: string;
  backgroundColor?: string;
  animate?: boolean;
  pulse?: boolean;
  ribbon?: boolean;
  style?: React.CSSProperties;
}

let uid = 0;

export function createPromoBadgePlugin(
  config: PromoBadgePluginConfig = {}
): LazyImagePlugin {
  return {
    name: `promo-badge-${++uid}`,
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => {
        if (!context.imageState.isLoaded) return null;
        return <PromoBadgeOverlay config={config} />;
      },
    },
  };
}
