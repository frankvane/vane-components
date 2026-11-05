import type React from "react";

import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

import { DownloadButtonOverlay } from "./internal";

export interface DownloadButtonPluginConfig {
  filename?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: "small" | "medium" | "large";
  buttonStyle?: React.CSSProperties;
  showOnHover?: boolean;
  onBeforeDownload?: (src: string) => void | Promise<void>;
  onDownloadSuccess?: (filename: string) => void;
  onDownloadError?: (error: unknown) => void;
  customIcon?: React.ReactNode;
  showTooltip?: boolean;
  tooltipText?: string;
}

export function createDownloadButtonPlugin(
  config: DownloadButtonPluginConfig = {}
): LazyImagePlugin {
  return {
    name: "download-button",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => {
        if (!context.imageState.isLoaded) return null;
        return <DownloadButtonOverlay config={config} context={context} />;
      },
    },
  };
}
