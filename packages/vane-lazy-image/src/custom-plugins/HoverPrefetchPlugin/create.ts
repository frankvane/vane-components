import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import React from "react";

import { createPreloadBadge } from "../_shared/preloadBadge";

export interface HoverPrefetchConfig {
  /** 计算需要预取的下一张图片（或多张） */
  getNextSrc?: (context: LazyImageContext) => string | string[] | Promise<string | string[]>;
  /** 绑定事件的目标：容器或图片元素 */
  target?: "container" | "image";
  /** 事件类型 */
  trigger?: "mouseenter" | "touchstart";
  /** 预取资源类型 */
  as?: "image" | "fetch";
  /** 预取的最大数量 */
  max?: number;
  /** 去重：避免重复插入相同的预取链接 */
  dedupe?: boolean;
  /** 跨域策略 */
  crossOrigin?: "anonymous" | "use-credentials" | null;
  /** 是否在卡片上显示「已预取 N」徽标（便于观察注入效果） */
  showBadge?: boolean;
  /** 调试输出 */
  debug?: boolean;
}

function addPreload(href: string, as: HoverPrefetchConfig["as"] = "image", crossOrigin: HoverPrefetchConfig["crossOrigin"] = "anonymous") {
  const id = `lli-hoverprefetch-${as}-${href}`;
  try {
    if (typeof document === "undefined") return null;
    if (document.getElementById(id)) return null; // 去重（已存在则不由本实例负责删除）
    const link = document.createElement("link");
    link.id = id;
    link.setAttribute("rel", "preload");
    link.setAttribute("as", as || "image");
    link.setAttribute("href", href);
    if (crossOrigin) link.setAttribute("crossorigin", crossOrigin);
    document.head.appendChild(link);
    return id;
  } catch {
    return null;
  }
}

/** P2-3：按 id 移除本插件插入的 preload link */
function removePreload(id: string) {
  try {
    if (typeof document === "undefined") return;
    document.getElementById(id)?.remove();
  } catch {}
}

/** 按 URL 末尾连续数字段递增派生「下一张」，作为 getNextSrc 的默认实现 */
function deriveNext(src: string): string | undefined {
  const m = src.match(/(\d+)(?=[^\d]*$)/);
  if (!m) return undefined;
  const full = m[0];
  const n = parseInt(full, 10);
  if (Number.isNaN(n)) return undefined;
  const next = src.replace(full, String(n + 1));
  return next !== src ? next : undefined;
}

const Badge = createPreloadBadge("lli-hoverprefetch-", "已预取");

export function createHoverPrefetchPlugin(config: HoverPrefetchConfig = {}): LazyImagePlugin {
  const {
    getNextSrc,
    target = "container",
    trigger = "mouseenter",
    as = "image",
    max = 2,
    dedupe = true,
    crossOrigin = "anonymous",
    showBadge = false,
    debug = false,
  } = config;

  const insertedIds = new Set<string>();
  const requested = new Set<string>();
  /** P2-3：target=image 时 img 可能尚未渲染，轮询等待 ref 可用 */
  const BIND_MAX_ATTEMPTS = 30;
  const BIND_INTERVAL_MS = 100;

  async function handlePrefetch(context: LazyImageContext) {
    try {
      let result = getNextSrc ? await Promise.resolve(getNextSrc(context)) : undefined;
      // 未提供 getNextSrc 时，按 URL 末尾数字段递增派生「下一张」，便于直接演示
      if (!result) {
        const derived = deriveNext(context.src);
        result = derived;
      }
      if (!result) return;
      const list = Array.isArray(result) ? result : [result];
      const selected = list.slice(0, Math.max(1, max));
      selected.forEach((href) => {
        if (dedupe && requested.has(href)) return;
        const id = addPreload(href, as, crossOrigin);
        if (id) insertedIds.add(id);
        requested.add(href);
        if (debug) {
          try { console.debug("[HoverPrefetch] preload", { href, as }); } catch {}
        }
      });
    } catch (e) {
      if (debug) {
        try { console.debug("[HoverPrefetch] error", e); } catch {}
      }
    }
  }

  return {
    name: "hover-prefetch",
    version: "2.1.0",
    description: "悬停预取下一张图片；image 目标延迟绑定，preload link 在卸载时移除（P2-3）",
    config,
    hooks: {
      onMount: (context: LazyImageContext) => {
        const handler = () => handlePrefetch(context);
        let cleanupBinding: (() => void) | null = null;
        let bindTimer: ReturnType<typeof setTimeout> | null = null;
        let attempts = 0;

        const bind = () => {
          const container = context.containerRef?.current as HTMLElement | null;
          const img = context.imageRef?.current as HTMLElement | null;
          const el: HTMLElement | null = target === "container" ? container : img;
          if (!el) return false;
          el.addEventListener(trigger, handler, { passive: true });
          cleanupBinding = () => {
            try { el.removeEventListener(trigger, handler); } catch {}
          };
          return true;
        };

        const tryBind = () => {
          if (bind()) return;
          // P2-3：idle 阶段 Core 还未渲染 <img>，轮询等待它出现（上限 3s）
          if (target === "image" && attempts < BIND_MAX_ATTEMPTS) {
            attempts += 1;
            bindTimer = setTimeout(tryBind, BIND_INTERVAL_MS);
          }
        };

        tryBind();

        context.sharedData?.set("hover-prefetch:cleanup", () => {
          if (bindTimer) clearTimeout(bindTimer);
          if (cleanupBinding) cleanupBinding();
        });
      },
      onUnmount: (context: LazyImageContext) => {
        const cleanup = context.sharedData?.get("hover-prefetch:cleanup");
        if (typeof cleanup === "function") {
          try { cleanup(); } catch {}
        }
        context.sharedData?.delete("hover-prefetch:cleanup");
        // P2-3：移除本实例插入的 preload link，避免长会话内持续累积
        insertedIds.forEach((id) => removePreload(id));
        insertedIds.clear();
        requested.clear();
      },
      renderOverlay: () => (showBadge ? React.createElement(Badge) : null),
    },
  };
}
