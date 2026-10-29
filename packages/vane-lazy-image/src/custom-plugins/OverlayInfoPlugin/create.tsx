import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import React from "react";

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

function OverlayInfoView({
  context,
  cfg,
}: {
  context: LazyImageContext;
  cfg: OverlayInfoConfig;
}) {
  const {
    position = "bottom",
    // 白字压在 rgba(0,0,0,.45) 上，浅色底图透出来会稀释成 #878787（3.6:1）；
    // .62 才能让白字在任意浅底上稳过 4.5 —— 深色照片上观感几乎无差。
    background = "rgba(0,0,0,0.62)",
    color = "#fff",
    fontSize = 12,
    padding = "6px 8px",
    borderRadius = 4,
    zIndex = 4,
    showWhen = "loading",
    trigger = "always",
  } = cfg;

  const { imageState } = context;
  const shouldShow =
    showWhen === "always" ||
    (showWhen === "loading" && imageState.isLoading) ||
    (showWhen === "loaded" && imageState.isLoaded) ||
    (showWhen === "error" && imageState.isError);

  const [hovered, setHovered] = React.useState(false);
  const visible = trigger === "always" ? shouldShow : shouldShow && hovered;
  if (!visible) {
    return (
      <div
        style={{ position: "absolute", inset: 0, zIndex, pointerEvents: trigger === "hover" ? "auto" : "none" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
    );
  }

  const text = typeof cfg.content === "function" ? cfg.content(context) : cfg.content || "Loading...";

  const base: React.CSSProperties = {
    position: "absolute",
    left: 8,
    right: 8,
    background,
    color,
    fontSize,
    padding,
    borderRadius,
    zIndex,
    pointerEvents: trigger === "hover" ? "auto" : "none",
    textAlign: "center",
  };

  const posStyle: Record<string, React.CSSProperties> = {
    top: { top: 8 },
    bottom: { bottom: 8 },
    center: { top: "50%", transform: "translateY(-50%)" },
  };

  return (
    <div
      style={{ position: "absolute", inset: 0, zIndex, pointerEvents: trigger === "hover" ? "auto" : "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ ...base, ...posStyle[position] }}>{text}</div>
    </div>
  );
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