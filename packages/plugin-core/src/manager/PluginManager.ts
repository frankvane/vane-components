import { resolveDependencyOrder } from "../dependency/DependencyResolver";
import { runHookInSandbox } from "../sandbox/PluginSandbox";
import type {
  Plugin,
  PluginContext,
  PluginHooks,
  PluginManager,
} from "../types";

export interface PluginManagerOptions {
  /** 默认开启沙箱 */
  sandbox?: boolean;
  /** 异步钩子默认超时 */
  timeout?: number;
  onError?: (pluginName: string, hookName: string, error: unknown) => void;
  logger?: Pick<Console, "warn" | "error">;
}

/**
 * 插件管理器：注册/注销/启停/钩子执行。
 * 执行顺序 = 依赖拓扑序（稳定）→ 优先级降序，由 resolveDependencyOrder 统一决定。
 * 钩子语义（生命周期钩子）：返回函数 → 注册为清理（clear 时逆序执行）；
 * 返回 false → 中断链；返回其他值 → 短路返回。详见 types.ts PluginHooks 注释。
 */
const LIFECYCLE_HOOKS = new Set(["onMount", "onUnmount", "onPropsChange", "onError"]);

export function createPluginManager<TProps = any, TData = any>(
  options: PluginManagerOptions = {}
): PluginManager<TProps, TData> {
  const logger = options.logger ?? console;
  const defaultSandbox = options.sandbox ?? true;
  const defaultTimeout = options.timeout ?? 3000;
  const errors: Array<{ plugin: string; hook: string; error: unknown }> = [];
  const cleanups: Array<() => void> = [];

  const plugins = new Map<string, Plugin<TProps, TData>>();

  // 执行顺序完全由 resolveDependencyOrder 决定：依赖约束绝对优先，
  // 优先级只在依赖已满足的候选之间起作用，平级保持注册顺序。
  const ordered = (): Plugin<TProps, TData>[] =>
    resolveDependencyOrder([...plugins.values()].filter((p) => p.enabled !== false));

  const register = (plugin: Plugin<TProps, TData>) => {
    plugins.set(plugin.name, { ...plugin, enabled: plugin.enabled ?? true });
    if (plugin.init) {
      Promise.resolve(plugin.init()).catch((error) => {
        logger.warn(`[PluginManager] init failed for ${plugin.name}`, error);
      });
    }
  };

  const registerAll = (list: Plugin<TProps, TData>[]) => {
    for (const plugin of list) register(plugin);
  };

  const unregister = (name: string) => {
    const plugin = plugins.get(name);
    if (!plugin) return;
    if (plugin.destroy) {
      Promise.resolve(plugin.destroy()).catch((error) => {
        logger.warn(`[PluginManager] destroy failed for ${plugin.name}`, error);
      });
    }
    plugins.delete(name);
  };

  const executeHook = async <K extends keyof PluginHooks<TProps, TData>>(
    hookName: K,
    context: PluginContext<TProps, TData>,
    ...args: unknown[]
  ): Promise<any> => {
    for (const plugin of ordered()) {
      const hook = plugin.hooks?.[hookName];
      if (typeof hook !== "function") continue;

      const useSandbox = plugin.sandbox ?? defaultSandbox;
      const timeout = plugin.timeout ?? defaultTimeout;

      let result: any;
      try {
        result = useSandbox
          ? await runHookInSandbox(
              () => (hook as any)(context, ...args),
              { timeout, name: plugin.name, hook: String(hookName) }
            )
          : await (hook as any)(context, ...args);
      } catch (error) {
        errors.push({ plugin: plugin.name, hook: String(hookName), error });
        logger.warn(
          `[PluginManager] hook ${String(hookName)} failed in ${plugin.name}`,
          error
        );
        options.onError?.(plugin.name, String(hookName), error);
        // onError 自己失败时不再传播，避免递归
        if (hookName === "onError") break;
        continue;
      }

      // 生命周期钩子返回函数 = 注册清理，不参与短路语义
      if (LIFECYCLE_HOOKS.has(String(hookName)) && typeof result === "function") {
        cleanups.push(result as () => void);
        continue;
      }

      if (result === false) return false;
      if (result !== undefined && result !== true) return result;
    }
    return undefined;
  };

  const clear = () => {
    // 先快照再清空：清理函数自身可能触发新的注册/执行
    const pending = cleanups.splice(0);
    for (const fn of pending.reverse()) {
      try {
        fn();
      } catch (error) {
        logger.warn("[PluginManager] cleanup failed", error);
      }
    }
    for (const plugin of plugins.values()) {
      if (plugin.destroy) {
        Promise.resolve(plugin.destroy()).catch((error) => {
          logger.warn(`[PluginManager] destroy failed for ${plugin.name}`, error);
        });
      }
    }
    plugins.clear();
  };

  return {
    register,
    registerAll,
    unregister,
    getPlugin: (name) => plugins.get(name),
    getAllPlugins: () => [...plugins.values()],
    getEnabledPlugins: () => [...plugins.values()].filter((p) => p.enabled !== false),
    getExecutionOrder: ordered,
    enable: (name) => {
      const p = plugins.get(name);
      if (p) p.enabled = true;
    },
    disable: (name) => {
      const p = plugins.get(name);
      if (p) p.enabled = false;
    },
    has: (name) => plugins.has(name),
    executeHook,
    clear,
    getErrors: () => [...errors],
  };
}
