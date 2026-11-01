import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface IDBCacheConfig {
  enabled?: boolean;
  dbName?: string;
  storeName?: string;
  ttlMs?: number; // 过期时间（毫秒）
  debug?: boolean;
}

// IDB 中存储的结构：优先存 Blob，其次存字符串（dataURL 或原始 URL）
type IDBValue = { blob?: Blob; value?: string; time: number; mime?: string };

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(dbName: string, storeName: string): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise!;
}

// 读取原始存储值（用于插件内部决定返回何种 src）
async function idbGetRaw(
  key: string,
  cfg: Required<
    Pick<IDBCacheConfig, "dbName" | "storeName" | "ttlMs" | "debug">
  >
): Promise<IDBValue | undefined> {
  try {
    const db = await openDB(cfg.dbName, cfg.storeName);
    const tx = db.transaction(cfg.storeName, "readonly");
    const store = tx.objectStore(cfg.storeName);
    const value: IDBValue | undefined = await new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as any);
      req.onerror = () => reject(req.error);
    });
    if (!value) return undefined;
    if (cfg.ttlMs > 0 && Date.now() - value.time > cfg.ttlMs) {
      // 过期，清理
      try {
        const tx2 = db.transaction(cfg.storeName, "readwrite");
        tx2.objectStore(cfg.storeName).delete(key);
      } catch {}
      return undefined;
    }
    return value;
  } catch (e) {
    if (cfg.debug) {
      try {
        console.warn("[IDBCache] get failed", e);
      } catch {}
    }
    return undefined;
  }
}

// 存储：优先写 Blob，其次写字符串
async function idbSet(
  key: string,
  value: string | Blob,
  cfg: Required<Pick<IDBCacheConfig, "dbName" | "storeName" | "debug">>
) {
  try {
    const db = await openDB(cfg.dbName, cfg.storeName);
    const tx = db.transaction(cfg.storeName, "readwrite");
    const store = tx.objectStore(cfg.storeName);
    const data: IDBValue =
      typeof value === "string"
        ? { value, time: Date.now() }
        : { blob: value, time: Date.now(), mime: value.type };
    await new Promise<void>((resolve, reject) => {
      const req = store.put(data, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    if (cfg.debug) {
      try {
        console.warn("[IDBCache] set failed", e);
      } catch {}
    }
  }
}

export const IDBCache = { get: idbGetRaw, set: idbSet };

// 将 dataURL 转为 Blob（避免 IDB 存储字符串的空间放大与解析成本）
function dataURLToBlob(dataUrl: string): Blob | null {
  try {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}

export function createIDBCachePlugin(
  config: IDBCacheConfig = {}
): LazyImagePlugin {
  const {
    enabled = true,
    dbName = "LLI-Cache",
    storeName = "images",
    ttlMs = 7 * 24 * 60 * 60 * 1000, // 默认 7 天
    debug = false,
  } = config;

  // 记录由缓存创建的 objectURL，以便在卸载时回收
  const createdObjectURLs = new Map<string, string>();

  // ⭐ 添加状态追踪，防止重入和重复操作
  const processingKeys = new Set<string>();
  const writingKeys = new Set<string>();

  return {
    name: "cache-idb",
    version: "1.0.0",
    config,
    hooks: {
      onLoad: async (context: LazyImageContext) => {
        if (!enabled) return undefined;

        // ⭐ 防止重入：如果正在处理同一个 src，立即返回
        if (processingKeys.has(context.src)) {
          if (debug) {
            try {
              console.warn("[IDBCache] Prevented reentry for", context.src);
            } catch {}
          }
          return undefined;
        }

        processingKeys.add(context.src);
        try {
          const raw = await idbGetRaw(context.src, {
            dbName,
            storeName,
            ttlMs,
            debug,
          });
          if (raw) {
            if (debug) {
              try {
                console.debug("[IDBCache] hit", { src: context.src });
              } catch {}
            }
            context.bus?.emit("cache:hit", { level: "idb", src: context.src });
            if (raw.blob) {
              // 🚀 P1-3 优化：避免重复创建 ObjectURL
              // 先检查 sharedData 中是否已有 objectURL
              let url = context.sharedData?.get("fetch-loader:object-url") as
                | string
                | undefined;

              if (!url) {
                // 首次创建 objectURL
                url = URL.createObjectURL(raw.blob);
                createdObjectURLs.set(context.src, url);
                // 将 objectURL 和 blob 存入 sharedData 供其他插件复用
                try {
                  context.sharedData?.set("fetch-loader:object-url", url);
                  context.sharedData?.set("fetch-loader:blob", raw.blob);
                } catch {}
              }
              return url; // 返回对象 URL
            }
            // fallback: 返回字符串（dataURL 或原始 URL）
            return raw.value;
          }
          return undefined;
        } finally {
          // ⭐ 确保在任何情况下都清理状态
          processingKeys.delete(context.src);
        }
      },
      onLoadSuccess: async (context: LazyImageContext, displaySrc: string) => {
        if (!enabled) return;

        // ⭐ 防止重复写入：如果正在写入同一个 src，跳过
        if (writingKeys.has(context.src)) {
          if (debug) {
            try {
              console.warn("[IDBCache] Write already in progress for", context.src);
            } catch {}
          }
          return;
        }

        writingKeys.add(context.src);
        try {
          // P1-7：优先复用 FetchLoader 写入的 blob，避免二次 network fetch
          let blob = context.sharedData?.get("fetch-loader:blob") as Blob | undefined;

          // 本次显示的就是本插件从 IDB 解出的 objectURL：内容已在库里，无需再写
          if (blob && createdObjectURLs.get(context.src) === displaySrc) {
            blob = undefined;
          }

          // displaySrc 为 blob:（FetchLoader / 本插件产出）时，读取本地 Blob 不产生网络请求
          if (!blob && displaySrc.startsWith("blob:")) {
            const localUrl = createdObjectURLs.get(context.src);
            if (localUrl === displaySrc) {
              // 已经由 IDB 命中产生，无需重复写库
              return;
            }
            try {
              const res = await fetch(displaySrc);
              if (res.ok) blob = await res.blob();
            } catch {
              // 本地 blob 读取失败：放弃本次写入即可
            }
          }

          // dataURL 可直接转 Blob（无网络请求）
          if (!blob && displaySrc.startsWith("data:")) {
            const blobFromDataURL = dataURLToBlob(displaySrc);
            if (blobFromDataURL) blob = blobFromDataURL;
          }

          // P1-7：不再对原始 context.src 发起二次 fetch —— 那是完整网络请求，
          // 会把「性能优先」变成「多下载一次」。没有可复用 blob 时只记录告警。
          if (blob) {
            await idbSet(context.src, blob, { dbName, storeName, debug });
            if (debug) {
              try {
                console.debug("[IDBCache] ✅ Stored blob successfully:", {
                  src: context.src,
                  size: blob.size,
                  type: blob.type
                });
              } catch {}
            }
          } else {
            if (debug) {
              try {
                console.warn("[IDBCache] ⚠️ No blob available, skip write:", {
                  src: context.src,
                  displaySrc
                });
              } catch {}
            }
          }
        } catch {
          // 忽略写入错误
        } finally {
          // ⭐ 确保清理写入状态
          writingKeys.delete(context.src);
        }

        if (debug) {
          try {
            console.debug("[IDBCache] set", { src: context.src });
          } catch {}
        }
      },
      onSrcChange: (context: LazyImageContext, oldSrc: string) => {
        // 迁移期间回收旧 objectURL
        const old = createdObjectURLs.get(oldSrc);
        if (old) {
          try {
            URL.revokeObjectURL(old);
          } catch {}
          createdObjectURLs.delete(oldSrc);
        }
      },
      onUnmount: (context: LazyImageContext) => {
        const url = createdObjectURLs.get(context.src);
        if (url) {
          try {
            URL.revokeObjectURL(url);
          } catch {}
          createdObjectURLs.delete(context.src);
        }
      },
    },
  };
}
