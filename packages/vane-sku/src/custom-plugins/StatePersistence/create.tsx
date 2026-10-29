import type {
  SkuPlugin,
  SkuPluginContext,
  SkuSelection,
} from "../../components/SkuPlugin/plugins/types";

/**
 * StatePersistencePlugin — 选择态本地持久化。
 *
 * 用户逛了一圈回来，还停在上次选的规格。写 localStorage（可换 sessionStorage），
 * 挂载时读回；选择清空时把键删掉，不留垃圾。
 *
 * meta 在同目录 index.ts 挂载。
 */
export interface StatePersistenceConfig {
  /** 存储键，默认 "vane-sku:selection" */
  key?: string;
  /** "local"（默认）或 "session" */
  scope?: "local" | "session";
}

function safeStorage(scope: "local" | "session"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return scope === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    // 隐私模式 / 禁用存储时静默降级
    return null;
  }
}

export function createStatePersistencePlugin(
  config: StatePersistenceConfig = {}
): SkuPlugin {
  const key = config.key ?? "vane-sku:selection";
  const scope = config.scope ?? "local";

  return {
    name: "StatePersistence",
    version: "0.1.0",
    description: "选择态持久化：记住上次选的规格（localStorage / sessionStorage）",
    priority: 26,
    config,
    hooks: {
      onMount: (context: SkuPluginContext) => {
        const store = safeStorage(scope);
        if (!store) return;
        try {
          const raw = store.getItem(key);
          if (!raw) return;
          const parsed = JSON.parse(raw) as SkuSelection;
          if (parsed && typeof parsed === "object" && Object.keys(parsed).length) {
            context.setState({ selection: parsed });
          }
        } catch {
          // 脏数据直接忽略，不影响主流程
        }
      },
      onSkuChange: (
        _context: SkuPluginContext,
        selection: SkuSelection
      ) => {
        const store = safeStorage(scope);
        if (!store) return;
        try {
          if (Object.keys(selection).length) store.setItem(key, JSON.stringify(selection));
          else store.removeItem(key);
        } catch {
          // 配额超限时静默失败
        }
      },
    },
  };
}
