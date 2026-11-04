import { resolveDependencyOrderSafe } from "../dependency/DependencyResolver";
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

/** 仅装配层使用：差集对齐 + 顺序缓存只读访问，不进入根导出 */
export interface PluginManagerInternal<TProps = any, TData = any>
  extends PluginManager<TProps, TData> {
  align(
    plugins: Plugin<TProps, TData>[],
    context: PluginContext<TProps, TData>
  ): Promise<void>;
  /** 当前排序缓存（只读，调用方不要修改） */
  peekOrder(): readonly Plugin<TProps, TData>[];
}

declare const process: { env: { NODE_ENV?: string } };
const LIFECYCLE_HOOKS = new Set(["onMount", "onUnmount", "onPropsChange", "onError"]);
type HookOutcome = { value?: unknown; stop?: boolean };

/**
 * 插件管理器：注册/注销/启停/钩子执行。
 * 执行顺序 = 依赖拓扑序 → 优先级降序，由 resolveDependencyOrder 统一决定。
 * 生命周期钩子返回函数 = 清理（clear 时逆序执行），false 中断链，其他非 true 值短路。
 */
export function createPluginManager<TProps = any, TData = any>(
  options: PluginManagerOptions = {}
): PluginManager<TProps, TData> {
  const logger = options.logger ?? console;
  const defaultSandbox = options.sandbox ?? true;
  const defaultTimeout = options.timeout ?? 3000;
  const errors: Array<{ plugin: string; hook: string; error: unknown }> = [];
  let cleanups: Array<[string, () => void]> = [];
  const plugins = new Map<string, Plugin<TProps, TData>>();
  const originals = new Map<string, Plugin<TProps, TData>>();
  /** 生命周期账本：已挂载插件名集合（未变更插件因此不会重复 onMount） */
  const mounted = new Set<string>();
  let generation = 0;
  let orderCache: Plugin<TProps, TData>[] | null = null;
  let alignToken = 0;

  const record = (plugin: string, hook: string, error: unknown) => {
    errors.push({ plugin, hook, error });
    // 错误账本封顶只在开发态生效，生产构建由 NODE_ENV 常量折叠整段裁掉
    if (process.env.NODE_ENV !== "production" && errors.length > 100) {
      errors.splice(0, errors.length - 100);
    }
  };

  /** 注册表变更推进代次：迟到结果与 cleanup 不得再登记 */
  const bump = () => {
    generation += 1;
    orderCache = null;
  };

  // 依赖「在册但被停用」时依赖方一并跳过；缺失依赖仍照跑 + 告警（P1-4 红线）
  const runs = (plugin: Plugin<TProps, TData>, seen = new Set<string>()): boolean => {
    if (plugin.enabled === false) return false;
    // 环交给 resolveDependencyOrderSafe 记录，这里按可运行处理
    if (seen.has(plugin.name)) return true;
    seen.add(plugin.name);
    return (plugin.dependencies ?? []).every((name) => {
      const dep = plugins.get(name);
      return !dep || runs(dep, seen);
    });
  };

  // 单一顺序缓存：只在注册表/启停变化时重排，executeHook 与渲染共用
  const getOrder = (): Plugin<TProps, TData>[] => {
    if (orderCache) return orderCache;
    const enabled = [...plugins.values()].filter((plugin) => {
      if (runs(plugin)) return true;
      record(plugin.name, "dependencies", new Error("依赖已停用"));
      return false;
    });
    return (orderCache = resolveDependencyOrderSafe(enabled, (error) =>
      record("[order]", "resolveDependencyOrder", error)
    ));
  };

  const runCleanups = (name?: string) => {
    const pending = cleanups.filter(([owner]) => !name || owner === name).reverse();
    cleanups = name ? cleanups.filter(([owner]) => owner !== name) : [];
    for (const [, fn] of pending) {
      try {
        fn();
      } catch (error) {
        logger.warn("[vane] cleanup failed", error);
      }
    }
  };

  const destroyPlugin = (plugin: Plugin<TProps, TData>): Promise<void> =>
    // await 后 await：异步 destroy 既满足可等待，也保证旧资源先于新资源释放
    Promise.resolve(plugin.destroy?.()).catch((error) =>
      logger.warn(`[vane] destroy failed: ${plugin.name}`, error)
    );

  // 生命周期账本在进入钩子前更新，异步并发下 onMount/onUnmount 也各只跑一次
  const invoke = async (
    plugin: Plugin<TProps, TData>,
    hookName: string,
    context: PluginContext<TProps, TData>,
    args: unknown[],
    atGeneration: number
  ): Promise<HookOutcome> => {
    const isUnmount = hookName === "onUnmount";
    if (hookName === "onMount" || isUnmount) {
      if (mounted.has(plugin.name) !== isUnmount) return {};
      if (isUnmount) mounted.delete(plugin.name);
      else mounted.add(plugin.name);
    }
    const hook = plugin.hooks?.[
      hookName as keyof PluginHooks<TProps, TData>
    ] as ((context: PluginContext<TProps, TData>, ...args: unknown[]) => unknown) | undefined;
    if (typeof hook !== "function") return {};

    let result: unknown;
    try {
      const run = () => hook(context, ...args);
      result = (plugin.sandbox ?? defaultSandbox)
        ? await runHookInSandbox(run, {
            timeout: plugin.timeout ?? defaultTimeout,
            name: plugin.name,
            hook: hookName,
          })
        : await run();
    } catch (error) {
      if (atGeneration !== generation) return {};
      record(plugin.name, hookName, error);
      logger.warn(`[vane] ${hookName} failed: ${plugin.name}`, error);
      options.onError?.(plugin.name, hookName, error);
      // onError 自己失败时不再传播，避免递归
      return { stop: hookName === "onError" };
    }

    // 代次已变化（clear / 注销 / 重装配）：迟到结果与 cleanup 一律丢弃
    if (atGeneration !== generation) return {};
    // 生命周期钩子返回函数 = 注册清理，不参与短路语义
    if (LIFECYCLE_HOOKS.has(hookName) && typeof result === "function") {
      cleanups.push([plugin.name, result as () => void]);
      return {};
    }
    return { value: result };
  };

  const runChain = async (
    hookName: keyof PluginHooks<TProps, TData>,
    context: PluginContext<TProps, TData>,
    args: unknown[]
  ): Promise<unknown> => {
    const atGeneration = generation;
    for (const plugin of getOrder()) {
      if (atGeneration !== generation) return undefined;
      const outcome = await invoke(plugin, hookName as string, context, args, atGeneration);
      if (outcome.stop) return undefined;
      if (outcome.value === false) return false;
      if (outcome.value !== undefined && outcome.value !== true) return outcome.value;
    }
    return undefined;
  };

  // onUnmount 与其他钩子同链执行；重复调用的幂等由生命周期账本保证
  const executeHook = <K extends keyof PluginHooks<TProps, TData>>(
    hookName: K,
    context: PluginContext<TProps, TData>,
    ...args: unknown[]
  ): Promise<any> => runChain(hookName, context, args);

  const register = (plugin: Plugin<TProps, TData>) => {
    const previous = plugins.get(plugin.name);
    // 同名新实例：先回收旧实例的订阅并销毁，避免两份资源同时存活
    if (previous && originals.get(plugin.name) !== plugin) {
      logger.warn(`[vane] duplicate plugin, destroy old: ${plugin.name}`);
      unregister(plugin.name);
    }
    plugins.set(plugin.name, { ...plugin, enabled: plugin.enabled ?? true });
    originals.set(plugin.name, plugin);
    mounted.delete(plugin.name);
    bump();
    if (plugin.init)
      Promise.resolve(plugin.init()).catch((error) => {
        logger.warn(`[vane] init failed: ${plugin.name}`, error);
      });
  };

  const registerAll = (list: Plugin<TProps, TData>[]) => list.forEach(register);

  const forget = (name: string) => {
    plugins.delete(name);
    originals.delete(name);
    mounted.delete(name);
    orderCache = null;
  };

  const unregister = (name: string) => {
    const plugin = plugins.get(name);
    if (!plugin) return;
    bump();
    runCleanups(name);
    void destroyPlugin(plugin);
    forget(name);
  };

  // 差集对齐：按 name + 插件对象引用判断增/删/换，未变更插件零重跑（不自动 onMount）
  const align = async (
    next: Plugin<TProps, TData>[],
    context: PluginContext<TProps, TData>
  ): Promise<void> => {
    const token = ++alignToken;
    const nextByName = new Map(next.map((plugin) => [plugin.name, plugin]));
    for (const name of [...plugins.keys()]) {
      if (token !== alignToken) return;
      if (originals.get(name) === nextByName.get(name)) continue;
      const plugin = plugins.get(name)!;
      bump();
      await invoke(plugin, "onUnmount", context, [], generation);
      runCleanups(name);
      await destroyPlugin(plugin);
      forget(name);
    }
    for (const plugin of next) {
      if (token !== alignToken) return;
      if (originals.get(plugin.name) !== plugin) register(plugin);
    }
  };

  const clear = (): Promise<void> => {
    bump();
    alignToken += 1;
    runCleanups();
    const pending = [...plugins.values()].map(destroyPlugin);
    plugins.clear();
    originals.clear();
    mounted.clear();
    // 返回 Promise：调用方可 await，等异步 destroy 全部完成
    return Promise.all(pending).then(() => undefined);
  };

  return {
    register,
    registerAll,
    unregister,
    getPlugin: (name) => plugins.get(name),
    getAllPlugins: () => [...plugins.values()],
    getEnabledPlugins: () => [...plugins.values()].filter((p) => p.enabled !== false),
    getExecutionOrder: () => [...getOrder()],
    enable: (name) => {
      const plugin = plugins.get(name);
      if (plugin) {
        plugin.enabled = true;
        orderCache = null;
      }
    },
    disable: (name) => {
      const plugin = plugins.get(name);
      if (plugin) {
        plugin.enabled = false;
        orderCache = null;
      }
    },
    has: (name) => plugins.has(name),
    executeHook,
    clear,
    getErrors: () => [...errors],
    align,
    peekOrder: getOrder,
  } as PluginManagerInternal<TProps, TData>;
}
