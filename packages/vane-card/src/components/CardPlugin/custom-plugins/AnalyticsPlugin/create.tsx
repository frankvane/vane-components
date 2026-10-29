/**
 * AnalyticsPlugin - 曝光 / 点击 / 加购 / 心愿单 上报
 *
 * 迁移要点（C3.2）：
 *  - 不再自建 IntersectionObserver。CardCore 已经在做可见性观测并通过
 *    onVisibilityChange 下发，重复建 IO 等于每张卡两套观测、两份回调；
 *  - 曝光时长改为「进入可见时在 sharedData 里记时间戳，离开时算差」。
 *    不能用工厂作用域的变量：同一个插件对象会被所有卡片共享，会把 A 卡的
 *    进入时间和 B 卡的离开时间算在一起。
 *  - 上报通道 send 提到工厂层，原来在 4 个钩子里各抄了一遍。
 */

import type { CardPlugin, CardPluginContext } from "../../plugins";
import React from "react";

export interface AnalyticsPluginConfig {
  transport?: (event: string, payload: any) => void; // 自定义上报管道
  sdk?: { track?: (event: string, payload: any) => void }; // 第三方 SDK
  minExposureMs?: number; // 最小曝光时长阈值，短于此不记入曝光退出
}

/** 每张卡各自的「本次进入可见的时间戳」存放键 */
const VISIBLE_SINCE = "__analytics.visibleSince";

export const createAnalyticsPlugin = (
  config: AnalyticsPluginConfig = {}
): CardPlugin => {
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

  return {
    name: "AnalyticsPlugin",
    version: "1.3.0",
    description: "点击、购物车与曝光统计（曝光复用 Core 的可见性，不重复建 IO）",
    priority: 50,
    hooks: {
      onMount: (context: CardPluginContext) => {
        // 只订阅总线；曝光交给 onVisibilityChange
        const offSku = context.bus?.on?.("sku:change", (data: any) => {
          send("sku_change", { cardId: context.cardId, ...data });
        });
        const offPrice = context.bus?.on?.("price:change", (data: any) => {
          send("price_change", { cardId: context.cardId, ...data });
        });

        return () => {
          try {
            offSku?.();
          } catch {}
          try {
            offPrice?.();
          } catch {}
        };
      },

      onVisibilityChange: (context: CardPluginContext, isVisible: boolean) => {
        const shared = context.sharedData;
        if (isVisible) {
          shared?.set?.(VISIBLE_SINCE, Date.now());
          send("exposure_enter", { cardId: context.cardId, ts: Date.now() });
          return;
        }

        const since = shared?.get?.(VISIBLE_SINCE) as number | undefined;
        shared?.delete?.(VISIBLE_SINCE);
        const dwellMs = typeof since === "number" ? Date.now() - since : 0;
        if (!config.minExposureMs || dwellMs >= config.minExposureMs) {
          send("exposure_exit", {
            cardId: context.cardId,
            ts: Date.now(),
            dwellMs,
          });
        }
      },

      onClick: (context: CardPluginContext, event: React.MouseEvent) => {
        send("click", {
          cardId: context.cardId,
          position: { x: event.clientX, y: event.clientY },
        });
      },

      // 旧版 onCartChange / onWishlistChange 死钩子 → 订阅 onStateChange 的差分
      onStateChange: (
        context: CardPluginContext,
        prev: { cart?: boolean; wishlist?: boolean },
        next: { cart?: boolean; wishlist?: boolean }
      ) => {
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
  };
};
