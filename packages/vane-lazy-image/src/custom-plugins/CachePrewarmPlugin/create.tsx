import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import React from "react";

import { IDBCache } from "../CacheIDBPlugin/create";
import { MemoryCache } from "../CacheMemoryPlugin/create";

import { CacheBadge } from "./internal";

export interface CachePrewarmConfig {
  enabled?: boolean;
  trigger?: "enter" | "mount"; // 触发时机：进入视口或挂载
  preferMemory?: boolean; // 预热时优先写内存
  /** 是否在卡片上显示预热状态徽标（便于观察） */
  showBadge?: boolean;
  debug?: boolean;
}

// ⭐ 添加预热状态追踪，防止重复预热和并发控制
const prewarmingKeys = new Set<string>();
const prewarmedKeys = new Set<string>();

async function prewarm(src: string, preferMemory: boolean, debug: boolean) {
  // ⭐ 防止重入：如果正在预热或已预热，跳过
  if (prewarmingKeys.has(src) || prewarmedKeys.has(src)) {
    if (debug) {
      try { console.debug("[CachePrewarm] skipped (already in progress or cached)", src); } catch {}
    }
    return;
  }

  prewarmingKeys.add(src);
  try {
    // ⭐ 添加超时控制（预热可以更长，10秒）
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(src, {
      cache: "force-cache",
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return;
    const blob = await res.blob();
    // P2-6：内存缓存统一写 Blob，读取（CacheMemoryPlugin.onLoad）时才创建 objectURL，
    // 避免预热阶段创建的对象 URL 因 revoke 时机不确定而失效。
    if (preferMemory) {
      MemoryCache.set(src, blob, 200);
    }
    // IDB：直接持久化 Blob
    await IDBCache.set(src, blob, { dbName: "LLI-Cache", storeName: "images", debug });

    // ⭐ 标记为已预热
    prewarmedKeys.add(src);

    if (debug) {
      try { console.debug("[CachePrewarm] prewarmed", { src, size: blob.size }); } catch {}
    }
  } catch (e) {
    // ⭐ 只在非超时错误时警告
    const isAbortError =
      typeof e === "object" &&
      e !== null &&
      "name" in e &&
      (e as { name?: unknown }).name === "AbortError";
    if (debug && !isAbortError) {
      try { console.warn("[CachePrewarm] failed", e); } catch {}
    }
  } finally {
    // ⭐ 清理预热中状态
    prewarmingKeys.delete(src);
  }
}

export function createCachePrewarmPlugin(config: CachePrewarmConfig = {}): LazyImagePlugin {
  const { enabled = true, trigger = "enter", preferMemory = true, showBadge = false, debug = false } = config;

  return {
    name: "cache-prewarm",
    version: "2.0.0",
    config,
    hooks: {
      onMount: (context: LazyImageContext) => {
        if (!enabled || trigger !== "mount") return;
        // 若已有命中则不重复预热
        const hit = MemoryCache.get(context.src) || undefined;
        if (!hit) prewarm(context.src, preferMemory, debug);
      },
      onEnterViewport: (context: LazyImageContext) => {
        if (!enabled || trigger !== "enter") return;
        const hit = MemoryCache.get(context.src) || undefined;
        if (!hit) prewarm(context.src, preferMemory, debug);
      },
      renderOverlay: (context) =>
        showBadge
          ? React.createElement(CacheBadge, { src: context.src, prewarmed: prewarmedKeys })
          : null,
    },
  };
}
