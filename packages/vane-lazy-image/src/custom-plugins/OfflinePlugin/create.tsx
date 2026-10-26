import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import React from "react";

export interface OfflineConfig {
  /** 离线时回退的占位图（建议用 data URI / 同源图，避免再次走网络） */
  offlineSrc?: string;
  /** Cache Storage 名称，用于在线时预热、离线时回退 */
  cacheName?: string;
  /** 在线时是否把资源预热进 Cache Storage（默认 true） */
  warm?: boolean;
  /** 是否显示离线状态指示徽标（默认 true） */
  showBadge?: boolean;
}

const DEFAULT_OFFLINE_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#eceff1'/><g fill='none' stroke='#90a4ae' stroke-width='6'><path d='M60 170 L140 170 L175 110 L235 210 L275 160 L340 160'/><circle cx='200' cy='225' r='8' fill='#90a4ae' stroke='none'/></g><text x='200' y='265' font-family='sans-serif' font-size='22' fill='#607d8b' text-anchor='middle'>离线占位</text></svg>`
  );

/**
 * 离线降级插件（v2 真实实现）：
 * - 在线时（warm=true）把资源最佳努力写入 Cache Storage 预热；
 * - 离线时优先从 Cache Storage 取缓存（同域可读），否则回退 offlineSrc / 内置 SVG 占位；
 * - 监听 online/offline 事件，在离线时显示状态徽标。
 * 注意：跨域 no-cors 资源缓存后无法读取为 blob，因此离线真正可用的是「同域资源」或
 * 显式提供的 offlineSrc；跨域离线回退到占位图是预期降级路径。
 */
export function createOfflinePlugin(config: OfflineConfig = {}): LazyImagePlugin {
  const {
    offlineSrc = DEFAULT_OFFLINE_SVG,
    cacheName = "vane-lazy-image-offline",
    warm = true,
    showBadge = true,
  } = config;

  const ONLINE = "offline:online";

  const getOnline = () =>
    typeof navigator !== "undefined" ? navigator.onLine : true;

  return {
    name: "offline",
    version: "2.0.0",
    config,
    hooks: {
      onMount: (context: LazyImageContext) => {
        try {
          context.sharedData?.set(ONLINE, getOnline());
        } catch {}
        if (typeof window === "undefined") return;
        const onOnline = () => {
          try { context.sharedData?.set(ONLINE, true); } catch {}
        };
        const onOffline = () => {
          try { context.sharedData?.set(ONLINE, false); } catch {}
        };
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        try {
          context.sharedData?.set("offline:cleanup", () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
          });
        } catch {}
      },
      onUnmount: (context: LazyImageContext) => {
        const cleanup = context.sharedData?.get("offline:cleanup");
        if (typeof cleanup === "function") {
          try { cleanup(); } catch {}
        }
        try { context.sharedData?.delete(ONLINE); } catch {}
      },
      onLoad: async (context: LazyImageContext) => {
        const online = getOnline();
        if (online) {
          // 在线：预热进 Cache Storage（同域资源可被离线读取）
          if (warm && typeof caches !== "undefined") {
            try {
              const cache = await caches.open(cacheName);
              const hit = await cache.match(context.src);
              if (!hit) {
                const resp = await fetch(context.src);
                if (resp && resp.ok) {
                  await cache.put(context.src, resp.clone());
                }
              }
            } catch {
              // 跨域 / 隐私模式等失败均可忽略，仅影响离线回退能力
            }
          }
          return undefined; // 正常加载原图
        }
        // 离线：先查 Cache Storage
        if (typeof caches !== "undefined") {
          try {
            const cache = await caches.open(cacheName);
            const hit = await cache.match(context.src);
            if (hit) {
              const blob = await hit.blob();
              return URL.createObjectURL(blob);
            }
          } catch {
            // 忽略
          }
        }
        // 无缓存：回退占位图（data URI，不依赖网络）
        return offlineSrc;
      },
      renderOverlay: (context: LazyImageContext) => {
        if (!showBadge) return null;
        const online = !!context.sharedData?.get(ONLINE);
        if (online) return null;
        return (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "rgba(244,67,54,0.9)",
              color: "#fff",
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 6,
              zIndex: 6,
            }}
          >
            离线模式
          </div>
        );
      },
    },
  };
}
