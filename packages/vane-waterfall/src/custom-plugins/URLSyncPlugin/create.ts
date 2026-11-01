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
  /** 首次读到的 URL 快照：既用于注入 props，也用于判断「这次 props 变化要不要写 URL」 */
  let initialParams: Record<string, any> | null = null;
  let initialInjected = false;
  const getInitialParams = (): Record<string, any> => {
    if (initialParams === null) initialParams = readFromURL();
    return initialParams;
  };

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
      // 首次渲染就把 URL 里的值注入 props：旧实现只广播 `urlsync:init`，
      // 页面不手动订阅时深链参数根本不会生效（「只写不读」，P2-6）
      transformProps: (props) => {
        if (initialInjected) return props;
        const initial = getInitialParams();
        const next: Record<string, any> = { ...props };
        let changed = false;
        keys.forEach((k) => {
          if (initial[k] !== undefined) {
            next[k] = initial[k];
            changed = true;
          }
        });
        if (changed) initialInjected = true;
        return next as typeof props;
      },
      onMount: (context) => {
        context.bus?.emit("urlsync:init", getInitialParams());
      },
      onPropsChange: (context, _prev, nextProps) => {
        const next: Record<string, any> = {};
        // 按字符串键取值：keys 是运行时数组，只读基本可序列化的值
        const source = (nextProps ?? {}) as unknown as Record<string, unknown>;
        keys.forEach((k) => {
          const v = source[k];
          if (v !== undefined) next[k] = v;
        });
        const initial = getInitialParams();
        // props 与 URL 现状一致（典型是挂载后的首次 props 变化）时不重写：
        // 旧实现会在这时把默认值写进 URL，把深链里没被消费的参数冲掉（P2-6）
        const differs = keys.some(
          (k) => String(next[k] ?? "") !== String(initial[k] ?? "")
        );
        if (!differs) return;
        writeToURL(next);
      },
    },
  };
}
