import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface MemoryCacheConfig {
  enabled?: boolean;
  maxEntries?: number; // LRU 最大条目
  ttlMs?: number; // 过期时间，默认不过期
  debug?: boolean;
}

// P2-6：内存缓存支持 Blob（预热的 Blob 在读取时才 createObjectURL）
type Entry = { value: string | Blob; time: number };

// 简单的全局 LRU 内存缓存（跨组件实例共享）
const store = new Map<string, Entry>();
const order: string[] = [];

function now() {
  return Date.now();
}

function evictIfNeeded(maxEntries: number) {
  if (maxEntries <= 0) return;
  while (order.length > maxEntries) {
    const oldest = order.shift();
    if (oldest && store.has(oldest)) {
      store.delete(oldest);
    }
  }
}

function touch(key: string) {
  const idx = order.indexOf(key);
  if (idx >= 0) order.splice(idx, 1);
  order.push(key);
}

function getFromMemory(key: string, ttlMs?: number): string | Blob | undefined {
  const e = store.get(key);
  if (!e) return undefined;
  if (ttlMs && ttlMs > 0 && now() - e.time > ttlMs) {
    store.delete(key);
    const idx = order.indexOf(key);
    if (idx >= 0) order.splice(idx, 1);
    return undefined;
  }
  touch(key);
  return e.value;
}

function setToMemory(key: string, value: string | Blob, maxEntries: number) {
  store.set(key, { value, time: now() });
  touch(key);
  evictIfNeeded(maxEntries);
}

export const MemoryCache = {
  get: getFromMemory,
  set: setToMemory,
  has: (key: string, ttlMs?: number) => getFromMemory(key, ttlMs) !== undefined,
  clear: () => {
    store.clear();
    order.splice(0, order.length);
  },
  size: () => store.size,
};

export function createMemoryCachePlugin(config: MemoryCacheConfig = {}): LazyImagePlugin {
  const { enabled = true, maxEntries = 200, ttlMs, debug = false } = config;

  // 跟踪由缓存返回的 objectURL，便于在卸载或切换时回收
  const createdObjectURLs = new Map<string, string>();

  // ⭐ 添加状态追踪，防止重入
  const processingKeys = new Set<string>();

  // ⭐ 添加事件防抖机制
  const lastEmitTime = new Map<string, number>();
  const DEBOUNCE_TIME = 100; // 100ms

  function safeEmit(bus: any, event: string, data: any) {
    const key = `${event}:${data.src}`;
    const now = Date.now();
    const last = lastEmitTime.get(key) || 0;

    if (now - last < DEBOUNCE_TIME) {
      return; // 防抖：短时间内重复事件不触发
    }

    lastEmitTime.set(key, now);
    bus?.emit(event, data);

    // 定期清理旧记录
    setTimeout(() => {
      lastEmitTime.delete(key);
    }, 1000);
  }

  return {
    name: "cache-memory",
    version: "1.0.0",
    config,
    hooks: {
      onLoad: async (context: LazyImageContext) => {
        if (!enabled) return undefined;

        // ⭐ 防止重入
        if (processingKeys.has(context.src)) {
          if (debug) {
            try { console.warn("[MemoryCache] Prevented reentry for", context.src); } catch {}
          }
          return undefined;
        }

        processingKeys.add(context.src);
        try {
          const hit = getFromMemory(context.src, ttlMs);
          if (hit) {
            if (debug) {
              try { console.debug("[MemoryCache] hit", { src: context.src, isBlob: hit instanceof Blob }); } catch {}
            }
            // ⭐ 使用防抖的事件触发
            safeEmit(context.bus, "cache:hit", { level: "memory", src: context.src });
            // P2-6：内存缓存统一存 Blob，读取时才创建 objectURL（不再直接丢弃缓存内容）
            if (hit instanceof Blob) {
              let url = context.sharedData?.get("fetch-loader:object-url") as string | undefined;
              if (!url) {
                url = URL.createObjectURL(hit);
                createdObjectURLs.set(context.src, url);
                try {
                  context.sharedData?.set("fetch-loader:object-url", url);
                  context.sharedData?.set("fetch-loader:blob", hit);
                } catch {}
              }
              return url;
            }
            // 不返回已缓存的 blob: 字符串，避免引用已撤销的对象 URL
            if (!hit.startsWith("blob:")) {
              return hit; // 返回替代 src
            }
          }
          return undefined;
        } finally {
          // ⭐ 确保清理状态
          processingKeys.delete(context.src);
        }
      },
      onLoadSuccess: (context: LazyImageContext, displaySrc: string) => {
        if (!enabled) return;
        // P2-6：有共享 Blob 时缓存 Blob（读取时再创建 objectURL）；
        // 仅缓存非 blob: 的字符串，blob 字符串交由 IDB 缓存处理。
        const sharedBlob = context.sharedData?.get("fetch-loader:blob");
        if (sharedBlob instanceof Blob) {
          setToMemory(context.src, sharedBlob, maxEntries);
        } else if (!displaySrc.startsWith("blob:")) {
          setToMemory(context.src, displaySrc, maxEntries);
        }
        if (debug) {
          try { console.debug("[MemoryCache] set", { src: context.src, length: displaySrc.length }); } catch {}
        }
      },
      onSrcChange: (context: LazyImageContext, oldSrc: string, newSrc: string) => {
        if (!enabled) return;
        // 轻量策略：不主动迁移旧 key，仅按需命中
        // ⭐ 使用防抖的事件触发
        safeEmit(context.bus, "cache:src-change", { oldSrc, newSrc, src: oldSrc });
        const old = createdObjectURLs.get(oldSrc);
        if (old) {
          try { URL.revokeObjectURL(old); } catch {}
          createdObjectURLs.delete(oldSrc);
        }
      },
      onUnmount: (context: LazyImageContext) => {
        // 可选：不在卸载时清除，以提高复用率
        // 若需要激进清理，可在此删除：store.delete(context.src)
        const url = createdObjectURLs.get(context.src);
        if (url) {
          try { URL.revokeObjectURL(url); } catch {}
          createdObjectURLs.delete(context.src);
        }
      },
    },
  };
}