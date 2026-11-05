import type { LazyImagePlugin } from "../../components/LazyLoadImagePlugin/plugins/types";

import { SkeletonOverlay } from "./internal";

export interface SkeletonPluginConfig {
  type?: "shimmer" | "pulse";
  backgroundColor?: string;
  highlightColor?: string; // shimmer 高亮色
  borderRadius?: number;
  zIndex?: number;
  showWhen?: "always" | "loading";
}

export function createSkeletonPlugin(config: SkeletonPluginConfig = {}): LazyImagePlugin {
  return {
    name: "skeleton",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context) => (
        <SkeletonOverlay
          imageState={context.imageState}
          type={config.type}
          backgroundColor={config.backgroundColor}
          highlightColor={config.highlightColor}
          borderRadius={config.borderRadius}
          zIndex={config.zIndex}
          showWhen={config.showWhen}
        />
      ),
    },
  };
}
