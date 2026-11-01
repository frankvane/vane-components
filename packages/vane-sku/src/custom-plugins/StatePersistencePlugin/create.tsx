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
 * 存储键必须能区分商品/场景（P2-5）：同一页有两个 SKU 面板、或换商品复用时，
 * 单 key 会把 A 商品的选择还原到 B 商品上（并进而触发全灰死锁）。
 * 用 productKey 拼出 `key:productKey`；解出的值仍会经内核的 normalizeSelection 校验，
 * 即使残留脏数据也不会写进选择态（P0-1）。
 *
 * meta 在同目录 index.ts 挂载。
 */
export interface StatePersistenceConfig {
  /** 存储键，默认 "vane-sku:selection" */
  key?: string;
  /** "local"（默认）或 "session" */
  scope?: "local" | "session";
  /** 商品 / 场景维度（建议必传，如 skuId）：最终键为 `key:productKey` */
  productKey?: string | null;
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
  const baseKey = config.key ?? "vane-sku:selection";
  const scope = config.scope ?? "local";
  const storageKey =
    config.productKey == null || config.productKey === ""
      ? baseKey
      : `${baseKey}:${config.productKey}`;

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
          const raw = store.getItem(storageKey);
          if (!raw) return;
          const parsed = JSON.parse(raw) as SkuSelection;
          if (parsed && typeof parsed === "object" && Object.keys(parsed).length) {
            // 走归一化入口：非法键值被丢弃，不给矩阵留脏值（P0-1）
            context.setSelection(parsed);
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
          if (Object.keys(selection).length) store.setItem(storageKey, JSON.stringify(selection));
          else store.removeItem(storageKey);
        } catch {
          // 配额超限时静默失败
        }
      },
    },
  };
}
