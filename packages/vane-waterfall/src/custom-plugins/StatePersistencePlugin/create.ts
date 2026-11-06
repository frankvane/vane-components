import type {
  WaterfallPlugin,
  WaterfallPluginContext,
} from "../../components/WaterfallPlugin/plugins/types";

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
// T 默认 unknown：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createStatePersistencePlugin<T = unknown>(config: StatePersistenceConfig = {}): WaterfallPlugin<T> {
  const key = config.storageKey || "waterfall-state";
  const persistScroll = config.persistScroll ?? true;
  const persistKeys = config.persistKeys || ["pageIndex", "pageSize", "searchQuery"];
  // 一次性注入标记：避免 transformProps 重复覆盖
  let initialInjected = false;
  /** 快照 schema 版本：旧版本（无 version 字段）结构不保证兼容，读到直接丢弃（P2-6） */
  const SCHEMA_VERSION = 1;
  /** 每个实例只恢复一次滚动（按容器/总线区分实例） */
  const restoredInstances = new WeakSet<object>();
  const instanceKey = (context: WaterfallPluginContext<T>): object =>
    (context.containerRef?.current as unknown as object) ?? (context.bus as unknown as object);

  function read(): Record<string, unknown> | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== SCHEMA_VERSION || typeof parsed.state !== "object") {
        return null;
      }
      return parsed.state;
    } catch {
      return null;
    }
  }

  function write(data: Record<string, unknown>) {
    try {
      localStorage.setItem(key, JSON.stringify({ version: SCHEMA_VERSION, state: data }));
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
        const next: Record<string, unknown> = { ...props };
        let changed = false;
        persistKeys.forEach((k) => {
          if (snap[k] !== undefined) {
            next[k] = snap[k];
            changed = true;
          }
        });
        if (changed) initialInjected = true;
        // 值是「运行时键 + 原始 props 形状」：props 用 Record 收窄后需回到原类型
        return next as unknown as typeof props;
      },
      onMount: (context) => {
        const snap = read();
        if (!snap) return;
        // 滚动位置**不在这里恢复**：onMount 时内容总高还是 0，
        // scrollTo 会被钳到 0，看起来像「恢复没生效」。等首次布局完成再恢复（见下）
        // 广播持久化的键，便于页面采用
        const restored: Record<string, unknown> = {};
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
      onLayoutComplete: (context) => {
        if (!persistScroll) return;
        const key = instanceKey(context);
        if (restoredInstances.has(key)) return;
        const snap = read();
        const top = Number(snap?.scrollTop ?? 0);
        if (!Number.isFinite(top) || top <= 0) {
          restoredInstances.add(key);
          return;
        }
        const el = context.containerRef.current;
        if (!el) return;
        // 布局完成 → 内容总高已按真实位置提交，此时 scrollTo 不会被钳住
        el.scrollTo({ top, behavior: "auto" });
        restoredInstances.add(key);
      },
      // props 变化时，增量更新快照（立即持久化分页/查询键）
      onPropsChange: (_context, _prev, nextProps) => {
        const snap = read() || {};
        const data: Record<string, unknown> = { ...snap };
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
        const data: Record<string, unknown> = {};
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
