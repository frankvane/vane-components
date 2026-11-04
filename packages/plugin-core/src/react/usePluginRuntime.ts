import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPluginBus } from "../bus/PluginBus";
import {
  createPluginManager,
  type PluginManagerInternal,
  type PluginManagerOptions,
} from "../manager/PluginManager";
import { resolveDependencyOrderSafe } from "../dependency/DependencyResolver";
import { detectDevice } from "../utils/detectDevice";
import type {
  DeviceInfo,
  Plugin,
  PluginBus,
  PluginContext,
  PluginHooks,
} from "../types";

export interface PluginRuntime<TProps = any, TData = any> {
  manager: ReturnType<typeof createPluginManager<TProps, TData>>;
  bus: PluginBus;
  context: PluginContext<TProps, TData>;
  state: Record<string, unknown>;
  setState: (patch: Record<string, unknown>) => void;
  execute: <K extends keyof PluginHooks<TProps, TData>>(
    hookName: K,
    ...args: unknown[]
  ) => Promise<any>;
  transformProps: (props: TProps) => TProps;
  transformData: (data: TData) => TData;
  /** 依赖解析 + 优先级排序后的插件列表（渲染插槽只读这个） */
  orderedPlugins: Plugin<TProps, TData>[];
}

/** 浅比较：props / data 内容不变时保持上一次的对象引用，避免 context 每次渲染都重建 */
function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) =>
    Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}

export interface UsePluginRuntimeOptions<TProps = any, TData = any> {
  plugins: Plugin<TProps, TData>[];
  props: TProps;
  data?: TData;
  initialState?: Record<string, unknown>;
  containerRef?: React.RefObject<HTMLElement | null>;
  enableDebug?: boolean;
  managerOptions?: PluginManagerOptions;
  /**
   * 上下文扩展：在内核 context 基础上附加领域字段（src / imageState / …）。
   * 每次 context 重建时应用；executeHook / transformData 拿到的都是扩展后的 context。
   * 领域包应传入 useCallback 包装的稳定函数，避免每次渲染重建 context。
   */
  extendContext?: (
    context: PluginContext<TProps, TData>
  ) => PluginContext<TProps, TData>;
}

/**
 * 插件运行时：一个宿主组件实例一套 runtime。
 * 组件包一般不直接用这个 hook，而是用 withPlugins；需要完全自定义装配时才用它。
 */
export function usePluginRuntime<TProps = any, TData = any>(
  options: UsePluginRuntimeOptions<TProps, TData>
): PluginRuntime<TProps, TData> {
  const {
    plugins,
    props,
    data,
    initialState,
    containerRef: externalRef,
    enableDebug = false,
    managerOptions,
    extendContext,
  } = options;

  const localRef = useRef<HTMLElement | null>(null);
  const containerRef = externalRef ?? localRef;

  const managerRef = useRef<PluginManagerInternal<TProps, TData> | null>(null);
  if (!managerRef.current) {
    managerRef.current = createPluginManager<TProps, TData>(
      managerOptions
    ) as PluginManagerInternal<TProps, TData>;
  }
  const manager = managerRef.current;

  const busRef = useRef<PluginBus | null>(null);
  if (!busRef.current) busRef.current = createPluginBus();
  const bus = busRef.current;

  const sharedRef = useRef<Map<string, unknown>>(new Map());
  const [state, setState] = useState<Record<string, unknown>>(initialState ?? {});
  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  const deviceInfo = useMemo<DeviceInfo>(() => detectDevice(), []);

  // 插件集合变化时重新装配。以插件对象引用为身份：元素引用不变就复用上次快照，
  // 同名新配置（FilterToggle 传 enabled:false、敏感词换词库…）仍能生效。
  const pluginsSnapshotRef = useRef(plugins);
  const prevPlugins = pluginsSnapshotRef.current;
  if (
    prevPlugins !== plugins &&
    (prevPlugins.length !== plugins.length ||
      plugins.some((p, i) => p !== prevPlugins[i]))
  ) {
    pluginsSnapshotRef.current = plugins;
  }
  const stablePlugins = pluginsSnapshotRef.current;
  const alignTokenRef = useRef(0);

  // P1-2：差集对齐。register 阶段不自动 onMount；装配完成后对「未挂载」插件
  // 显式执行一次 onMount（管理器按插件对象幂等，未变更插件零重跑）。
  useLayoutEffect(() => {
    const token = ++alignTokenRef.current;
    const context = contextRef.current!;
    void manager.align(stablePlugins, context).then(() => {
      if (alignTokenRef.current !== token) return;
      if (enableDebug) {
        console.debug(
          "[vane/plugin-core] plugins registered:",
          stablePlugins.map((p) => p.name).join("|")
        );
      }
      void manager.executeHook("onMount", context);
    });
    return () => {
      alignTokenRef.current += 1;
    };
  }, [stablePlugins, manager, enableDebug]);

  // 卸载：先执行 onUnmount 钩子链，链完成后再 clear，避免清理函数先于 onUnmount。
  // 管理器对 onUnmount 做并发合并：宿主重复调用也返回同一条链。
  useLayoutEffect(
    () => () => {
      const task = manager.executeHook("onUnmount", contextRef.current!);
      void task.finally(() => manager.clear());
    },
    [manager]
  );

  // 执行顺序来自 manager 的单一缓存；渲染前若缓存尚未覆盖当前插件集合
  // （首次渲染/增删插件尚未对齐），退回本地安全排序，避免插槽少渲染。
  const cachedOrder = manager.peekOrder();
  const orderedPlugins = useMemo(() => {
    const byName = new Map(stablePlugins.map((plugin) => [plugin.name, plugin]));
    const current = stablePlugins.filter(
      (plugin) =>
        plugin.enabled !== false &&
        manager.getPlugin(plugin.name)?.enabled !== false
    );
    if (cachedOrder.length === current.length) {
      return cachedOrder.map((plugin) => byName.get(plugin.name) ?? plugin);
    }
    return resolveDependencyOrderSafe(current);
  }, [stablePlugins, manager, cachedOrder]);

  const contextRef = useRef<PluginContext<TProps, TData> | null>(null);

  // props / data 只做浅比较：父组件每次渲染都新建同内容对象时，
  // context 不应该跟着重建，否则所有插槽与 memo 子组件都会全量重渲染。
  const stablePropsRef = useRef(props);
  if (!shallowEqual(stablePropsRef.current, props)) stablePropsRef.current = props;
  const stableProps = stablePropsRef.current;

  const stableDataRef = useRef(data);
  if (!shallowEqual(stableDataRef.current, data)) stableDataRef.current = data;
  const stableData = stableDataRef.current;

  const context = useMemo<PluginContext<TProps, TData>>(() => {
    const ctx: PluginContext<TProps, TData> = {
      props: stableProps,
      data: stableData,
      bus,
      refs: { container: containerRef, getContainer: () => containerRef.current },
      state,
      setState: (patch) => setState((prev) => ({ ...prev, ...patch })),
      shared: sharedRef.current,
      deviceInfo,
      forceUpdate,
      getSize: () => {
        const el = containerRef.current;
        return el ? { width: el.offsetWidth, height: el.offsetHeight } : { width: 0, height: 0 };
      },
      logger: console,
    };
    return extendContext ? extendContext(ctx) : ctx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableProps, stableData, state, deviceInfo, bus, extendContext]);

  contextRef.current = context;

  // transformProps / transformData 共用一条链：两者语义相同，只差是否传 context。
  // orderedPlugins 已排除 enabled:false 的插件，disabled 插件因此真正停用。
  const applyTransform = useCallback(
    (hook: "transformProps" | "transformData", input: unknown): unknown => {
      let next = input;
      for (const plugin of orderedPlugins) {
        const fn = plugin.hooks?.[hook] as unknown as
          | ((ctx: unknown, data?: unknown) => unknown)
          | undefined;
        if (typeof fn !== "function") continue;
        // 单个插件抛错不能连带整棵渲染树：跳过该插件并告警，其余插件继续生效
        try {
          next = hook === "transformData" ? fn(contextRef.current!, next) : fn(next);
        } catch (err) {
          (contextRef.current?.logger ?? console).warn(
            `[plugin-core] ${plugin.name}.${hook} 执行失败，已跳过`,
            err
          );
        }
      }
      return next;
    },
    [orderedPlugins]
  );

  const transformProps = useCallback(
    (input: TProps): TProps => applyTransform("transformProps", input) as TProps,
    [applyTransform]
  );

  const transformData = useCallback(
    (input: TData): TData => applyTransform("transformData", input) as TData,
    [applyTransform]
  );

  const execute = useCallback(
    <K extends keyof PluginHooks<TProps, TData>>(hookName: K, ...args: unknown[]) =>
      manager.executeHook(hookName, contextRef.current!, ...args),
    [manager]
  );

  return {
    manager,
    bus,
    context,
    state,
    setState: context.setState,
    execute,
    transformProps,
    transformData,
    orderedPlugins,
  };
}
