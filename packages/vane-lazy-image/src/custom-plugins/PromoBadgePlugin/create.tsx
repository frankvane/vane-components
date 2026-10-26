import React from "react";
import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

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

const PRESETS: Record<
  string,
  { text: string; bg: string; color: string }
> = {
  new: { text: "NEW", bg: "#4CAF50", color: "#fff" },
  hot: { text: "HOT", bg: "#FF5722", color: "#fff" },
  sale: { text: "SALE", bg: "#F44336", color: "#fff" },
  limited: { text: "LIMITED", bg: "#9C27B0", color: "#fff" },
  bestseller: { text: "BEST", bg: "#FF9800", color: "#fff" },
  custom: { text: "NEW", bg: "#2196F3", color: "#fff" },
};

const POSITIONS: Record<string, React.CSSProperties> = {
  "top-left": { top: 10, left: 10 },
  "top-right": { top: 10, right: 10 },
  "bottom-left": { bottom: 10, left: 10 },
  "bottom-right": { bottom: 10, right: 10 },
};

const KEYFRAMES = `
  @keyframes promoBadgeFadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes promoBadgePulse {
    0%, 100% { transform: scale(1); box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
    50% { transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
  }
`;

let uid = 0;

function PromoBadgeOverlay({
  config,
  context,
}: {
  config: PromoBadgePluginConfig;
  context: LazyImageContext;
}) {
  const {
    type = "hot",
    text,
    position = "top-left",
    color,
    backgroundColor,
    animate = true,
    pulse = false,
    ribbon = false,
    style = {},
  } = config;

  const preset = PRESETS[type] ?? PRESETS.hot;
  const label = type === "custom" && text ? text : preset.text;
  const bg = backgroundColor ?? preset.bg;
  const fg = color ?? preset.color;

  const ribbonStyle: React.CSSProperties = ribbon
    ? {
        padding: "6px 16px",
        transform: position.includes("left")
          ? "rotate(-45deg) translateX(-20px)"
          : "rotate(45deg) translateX(20px)",
        transformOrigin: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        top: ribbon ? -5 : 10,
        left: ribbon ? -5 : 10,
        right: ribbon ? -5 : 10,
        bottom: ribbon ? -5 : 10,
      }
    : {};

  const badgeStyle: React.CSSProperties = {
    position: "absolute",
    ...POSITIONS[position],
    backgroundColor: bg,
    color: fg,
    padding: ribbon ? "6px 16px" : "4px 10px",
    borderRadius: ribbon ? 2 : 4,
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    boxShadow: ribbon
      ? "0 4px 12px rgba(0,0,0,0.3)"
      : "0 2px 6px rgba(0,0,0,0.2)",
    zIndex: 10,
    animation: animate
      ? pulse
        ? "promoBadgePulse 1.5s ease-in-out infinite"
        : "promoBadgeFadeIn 0.4s ease-out"
      : "none",
    ...ribbonStyle,
    ...style,
  };

  return (
    <>
      <div style={badgeStyle}>{label}</div>
      {animate && <style>{KEYFRAMES}</style>}
    </>
  );
}

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
        return <PromoBadgeOverlay config={config} context={context} />;
      },
    },
  };
}
