import type { CardPlugin, CardPluginContext } from "../../plugins";
import React from "react";

export interface AnalyticsPluginConfig {
  transport?: (event: string, payload: any) => void; // 自定义上报管道
  sdk?: { track?: (event: string, payload: any) => void }; // 第三方 SDK
  minExposureMs?: number; // 最小曝光时长阈值，短于此不记入曝光退出
}

export const createAnalyticsPlugin = (
  config: AnalyticsPluginConfig = {}
): CardPlugin => ({
  name: "AnalyticsPlugin",
  version: "1.2.0",
  description: "点击、购物车与曝光统计（含上报管道与总线事件）",
  priority: 50,
  hooks: {
    onMount: (context: CardPluginContext) => {
      const el = context.getContainer();
      if (!el) return;

      const send = (event: string, payload: any) => {
        try {
          if (typeof config.transport === "function") {
            config.transport(event, payload);
          } else if (config.sdk?.track) {
            config.sdk.track(event, payload);
          } else {
            console.log(`[Analytics] ${event}`, payload);
          }
        } catch (e) {
          console.warn("[Analytics] transport failed", e);
        }
      };

      // 订阅总线事件：sku:change, price:change
      const offSku = context.bus?.on?.("sku:change", (data: any) => {
        send("sku_change", { cardId: context.cardId, ...data });
      });
      const offPrice = context.bus?.on?.("price:change", (data: any) => {
        send("price_change", { cardId: context.cardId, ...data });
      });

      // 曝光监测
      let visibleSince: number | null = null;
      const io = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const isVisible = entry.isIntersecting;
        if (isVisible) {
          visibleSince = performance.now();
          send("exposure_enter", { cardId: context.cardId, ts: Date.now() });
        } else {
          const dwellMs = visibleSince ? performance.now() - visibleSince : 0;
          visibleSince = null;
          if (!config.minExposureMs || dwellMs >= config.minExposureMs) {
            send("exposure_exit", {
              cardId: context.cardId,
              ts: Date.now(),
              dwellMs: Math.round(dwellMs),
            });
          }
        }
      });
      io.observe(el);

      // 返回的清理函数会被内核在卸载时执行（R2 修复）
      return () => {
        try {
          io.disconnect();
        } catch {}
        if (offSku) {
          try {
            offSku();
          } catch {}
        }
        if (offPrice) {
          try {
            offPrice();
          } catch {}
        }
      };
    },

    onVisibilityChange: (context: CardPluginContext, isVisible: boolean) => {
      const send = (event: string, payload: any) => {
        try {
          if (typeof config.transport === "function") {
            config.transport(event, payload);
          } else if (config.sdk?.track) {
            config.sdk.track(event, payload);
          } else {
            console.log(`[Analytics] ${event}`, payload);
          }
        } catch {}
      };
      send("visibility", { cardId: context.cardId, visible: isVisible });
    },

    onClick: (context: CardPluginContext, event: React.MouseEvent) => {
      const send = (eventName: string, payload: any) => {
        try {
          if (typeof config.transport === "function") {
            config.transport(eventName, payload);
          } else if (config.sdk?.track) {
            config.sdk.track(eventName, payload);
          } else {
            console.log(`[Analytics] ${eventName}`, payload);
          }
        } catch {}
      };
      send("click", {
        cardId: context.cardId,
        position: { x: event.clientX, y: event.clientY },
      });
    },

    // 旧版 onCartChange 死钩子 → 改为监听 onStateChange 的 cart 差分
    onStateChange: (
      context: CardPluginContext,
      prev: { cart?: boolean; wishlist?: boolean },
      next: { cart?: boolean; wishlist?: boolean }
    ) => {
      const send = (eventName: string, payload: any) => {
        try {
          if (typeof config.transport === "function") {
            config.transport(eventName, payload);
          } else if (config.sdk?.track) {
            config.sdk.track(eventName, payload);
          } else {
            console.log(`[Analytics] ${eventName}`, payload);
          }
        } catch {}
      };
      if (prev.cart !== next.cart) {
        send("cart", {
          cardId: context.cardId,
          action: next.cart ? "add" : "remove",
        });
      }
      if (prev.wishlist !== next.wishlist) {
        send("wishlist", {
          cardId: context.cardId,
          action: next.wishlist ? "add" : "remove",
        });
      }
    },
  },
});
