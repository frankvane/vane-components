import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import { OverlayInfoView } from "./internal";

export interface OverlayInfoConfig {
  content?: string | ((context: LazyImageContext) => string);
  position?: "top" | "bottom" | "center";
  background?: string;
  color?: string;
  fontSize?: number;
  padding?: string;
  borderRadius?: number;
  zIndex?: number;
  showWhen?: "always" | "loading" | "loaded" | "error";
  trigger?: "always" | "hover";
}

export function createOverlayInfoPlugin(config: OverlayInfoConfig = {}): LazyImagePlugin {
  return {
    name: "overlay-info",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context) => <OverlayInfoView context={context} cfg={config} />,
    },
  };
}
