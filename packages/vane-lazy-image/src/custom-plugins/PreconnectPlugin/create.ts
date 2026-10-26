import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import React from "react";

import { createPreloadBadge } from "../_shared/preloadBadge";

export interface PreconnectPluginConfig {
  domains?: string[]; // 额外预连接域名
  crossOrigin?: string | null; // "anonymous" | "use-credentials" | null
  /** 是否在卡片上显示「已预连 N」徽标（便于观察注入效果） */
  showBadge?: boolean;
}

function addPreconnect(origin: string, crossOrigin: string | null = "anonymous") {
  if (typeof document === "undefined") return;
  const id = `lli-preconnect-${origin}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "preconnect";
  link.href = origin;
  if (crossOrigin) link.crossOrigin = crossOrigin as any;
  document.head.appendChild(link);
}

function removePreconnect(origin: string) {
  if (typeof document === "undefined") return;
  const id = `lli-preconnect-${origin}`;
  const el = document.getElementById(id);
  if (el) el.remove();
}

function getOrigin(src: string): string | null {
  try {
    const u = new URL(src, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

const Badge = createPreloadBadge("lli-preconnect-", "已预连");

export function createPreconnectPlugin(config: PreconnectPluginConfig = {}): LazyImagePlugin {
  const { showBadge = false } = config;
  return {
    name: "preconnect",
    version: "2.0.0",
    config,
    hooks: {
      onMount: (context: LazyImageContext) => {
        const origin = getOrigin(context.src);
        if (origin) addPreconnect(origin, config.crossOrigin ?? "anonymous");
        if (config.domains && Array.isArray(config.domains)) {
          config.domains.forEach((d) => addPreconnect(d, config.crossOrigin ?? "anonymous"));
        }
      },
      onUnmount: (context: LazyImageContext) => {
        const origin = getOrigin(context.src);
        if (origin) removePreconnect(origin);
        if (config.domains && Array.isArray(config.domains)) {
          config.domains.forEach((d) => removePreconnect(d));
        }
      },
      onSrcChange: (context: LazyImageContext, _old, next) => {
        const origin = getOrigin(next);
        if (origin) addPreconnect(origin, config.crossOrigin ?? "anonymous");
      },
      renderOverlay: () => (showBadge ? React.createElement(Badge) : null),
    },
  };
}