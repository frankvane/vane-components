import type React from "react";

import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

import { SocialShareOverlay } from "./internal";

export interface SocialSharePluginConfig {
  platforms?: Array<
    "facebook" | "twitter" | "pinterest" | "linkedin" | "whatsapp" | "wechat"
  >;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showOnHover?: boolean;
  url?: string;
  title?: string;
  description?: string;
  ogImage?: string;
  onShare?: (platform: string) => void;
  style?: React.CSSProperties;
  size?: "small" | "medium" | "large";
}

export function createSocialSharePlugin(
  config: SocialSharePluginConfig = {}
): LazyImagePlugin {
  return {
    name: "social-share",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => {
        if (!context.imageState.isLoaded) return null;
        return <SocialShareOverlay config={config} context={context} />;
      },
    },
  };
}
