import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type StatePersistenceConfig = {
  /** 存储键（localStorage） */
  storageKey?: string;
  /** 是否持久化滚动位置 */
  persistScroll?: boolean;
  /** 是否持久化分页与查询（从 props 读取） */
  persistKeys?: string[]; // e.g. ["pageIndex", "pageSize", "searchQuery"]
};

/**
 * StatePersistencePlugin - 状态快照与恢复（基础版）
 * - 挂载时尝试恢复快照；卸载时写入快照
 * - 快照包含：scrollTop（可选）与部分 props 键
 */
export function createStatePersistencePlugin<T = any>(config: StatePersistenceConfig = {}): WaterfallPlugin<T> {
  const key = config.storageKey || "waterfall-state";
  const persistScroll = config.persistScroll ?? true;
  const persistKeys = config.persistKeys || ["pageIndex", "pageSize", "searchQuery"];
  // 一次性注入标记：避免 transformProps 重复覆盖
  let initialInjected = false;

  function read(): Record<string, any> | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function write(data: Record<string, any>) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }

  return {
    name: "StatePersistencePlugin",
    enabled: true,
    hooks: {
      // 首次渲染时，尽量将本地快照中的分页/查询键注入到 props，便于核心按恢复后的状态渲染
      transformProps: (props) => {
        if (initialInjected) return props;
        const snap = read();
        if (!snap) return props;
        const next: Record<string, any> = { ...props };
        let changed = false;
        persistKeys.forEach((k) => {
          if (snap[k] !== undefined) {
            next[k] = snap[k];
            changed = true;
          }
        });
        if (changed) initialInjected = true;
        return next as typeof props;
      },
      onMount: (context) => {
        const snap = read();
        if (!snap) return;
        // 恢复滚动
        if (persistScroll) {
          const top = Number(snap.scrollTop ?? 0);
          const el = context.containerRef.current;
          if (el) {
            el.scrollTo({ top, behavior: "auto" });
          } else {
            context.scrollToTop?.({ behavior: "auto" });
          }
        }
        // 广播持久化的键，便于页面采用
        const restored: Record<string, any> = {};
        persistKeys.forEach((k) => {
          if (snap[k] !== undefined) restored[k] = snap[k];
        });
        if (Object.keys(restored).length > 0) {
          context.bus?.emit("state:restored", restored);
          // 同步广播到全局，方便页面级状态订阅恢复事件（不需页面直接读取 localStorage）
          if (typeof window !== "undefined") {
            try {
              window.dispatchEvent(new CustomEvent("waterfall:state-restored", { detail: restored }));
            } catch {}
          }
        }
      },
      // props 变化时，增量更新快照（立即持久化分页/查询键）
      onPropsChange: (_context, _prev, nextProps) => {
        const snap = read() || {};
        const data: Record<string, any> = { ...snap };
        // 按字符串键取值：persistKeys 是运行时数组，无法在类型层收窄到 keyof props
        const source = (nextProps ?? {}) as unknown as Record<string, unknown>;
        persistKeys.forEach((k) => {
          const v = source[k];
          if (v !== undefined) data[k] = v;
        });
        // 保留已有的 scrollTop，不在此处覆盖
        write(data);
      },
      onUnmount: (context) => {
        const data: Record<string, any> = {};
        if (persistScroll) {
          data.scrollTop = context.containerRef.current?.scrollTop || 0;
        }
        const source = (context.props ?? {}) as unknown as Record<string, unknown>;
        persistKeys.forEach((k) => {
          const v = source[k];
          if (v !== undefined) data[k] = v;
        });
        write(data);
      },
    },
  };
}
