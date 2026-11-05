import type React from "react";

import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

import { VideoPosterOverlay } from "./internal";

export interface VideoPosterPluginConfig {
  videoUrl: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playButtonPosition?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  playButtonSize?: "small" | "medium" | "large";
  playButtonStyle?: React.CSSProperties;
  showPlayButton?: boolean;
  onPlay?: () => void;
  playInModal?: boolean;
  playIcon?: React.ReactNode;
}

export function createVideoPosterPlugin(
  config: VideoPosterPluginConfig
): LazyImagePlugin {
  return {
    name: "video-poster",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => {
        if (!context.imageState.isLoaded) return null;
        return <VideoPosterOverlay config={config} />;
      },
    },
  };
}
