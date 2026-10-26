import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type URLSyncConfig = {
  /** URL 同步使用 hash 还是 search（默认 hash） */
  mode?: "hash" | "search";
  /** 需要同步的键列表（从 props 读取） */
  keys?: string[]; // e.g. ["pageIndex", "pageSize", "searchQuery", "sortKey", "filterValue"]
};

/**
 * URLSyncPlugin - 将部分状态同步到 URL（基础版）
 * - 监听 props 变化，更新 URL
 * - 初次挂载时读取 URL 并向 bus 广播（页面可据此设置状态）
 */
export function createURLSyncPlugin<T = any>(config: URLSyncConfig = {}): WaterfallPlugin<T> {
  const mode = config.mode || "hash";
  const keys = config.keys || ["pageIndex", "pageSize", "searchQuery"];

  function readFromURL() {
    try {
      if (mode === "hash") {
        const hash = window.location.hash || "";
        const idx = hash.indexOf("?");
        const paramStr = idx >= 0 ? hash.slice(idx + 1) : hash.replace(/^#/, "");
        const params = new URLSearchParams(paramStr);
        const state: Record<string, any> = {};
        keys.forEach((k) => {
          const v = params.get(k);
          if (v !== null) state[k] = v;
        });
        return state;
      } else {
        const params = new URLSearchParams(window.location.search);
        const state: Record<string, any> = {};
        keys.forEach((k) => {
          const v = params.get(k);
          if (v !== null) state[k] = v;
        });
        return state;
      }
    } catch {
      return {};
    }
  }

  function writeToURL(next: Record<string, any>) {
    try {
      const params = new URLSearchParams();
      keys.forEach((k) => {
        const v = next[k];
        if (v !== undefined && v !== null && String(v).length > 0) {
          params.set(k, String(v));
        }
      });
      const str = params.toString();
      if (mode === "hash") {
        const rawHash = window.location.hash || "";
        const withoutSharp = rawHash.replace(/^#/, "");
        const pathPart = withoutSharp.split("?")[0] || ""; // 保留现有路由路径
        const newHash = `#${pathPart}${str ? `?${str}` : ""}`;
        if (rawHash !== newHash) {
          history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}${newHash}`
          );
        }
      } else {
        const base = window.location.pathname + (str ? `?${str}` : "");
        const full = base + (window.location.hash || "");
        history.replaceState(null, "", full);
      }
    } catch {}
  }

  return {
    name: "URLSyncPlugin",
    enabled: true,
    hooks: {
      onMount: (context) => {
        const initial = readFromURL();
        context.bus?.emit("urlsync:init", initial);
      },
      onPropsChange: (context, _prev, nextProps) => {
        const next: Record<string, any> = {};
        // 按字符串键取值：keys 是运行时数组，只读基本可序列化的值
        const source = (nextProps ?? {}) as unknown as Record<string, unknown>;
        keys.forEach((k) => {
          const v = source[k];
          if (v !== undefined) next[k] = v;
        });
        writeToURL(next);
      },
    },
  };
}
