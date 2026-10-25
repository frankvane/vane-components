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
  type PluginManagerOptions,
} from "../manager/PluginManager";
import { resolveDependencyOrder } from "../dependency/DependencyResolver";
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

  const managerRef = useRef<ReturnType<typeof createPluginManager<TProps, TData>> | null>(null);
  if (!managerRef.current) {
    managerRef.current = createPluginManager<TProps, TData>(managerOptions);
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

  // 插件集合变化（按 name 比对，避免内联数组每次渲染都重注册）时重新装配
  const namesKey = plugins.map((p) => p.name).join("|");
  useLayoutEffect(() => {
    manager.clear();
    manager.registerAll(plugins);
    if (enableDebug) {
      console.debug("[vane/plugin-core] plugins registered:", namesKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesKey]);

  // 卸载：先执行 onUnmount 钩子链，再清理管理器。
  // 说明：hook 链在 executeHook 循环内已捕获插件引用，随后的 clear 不会
  // 中断已启动的链；反过来（先 clear 再 onUnmount）会让插件列表已空、
  // 钩子丢失。领域包因此不需要自己桥接 onUnmount。
  useLayoutEffect(
    () => () => {
      void manager.executeHook("onUnmount", contextRef.current!);
      manager.clear();
    },
    [manager]
  );

  const orderedPlugins = useMemo(
    () => resolveDependencyOrder(plugins),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namesKey]
  );

  const contextRef = useRef<PluginContext<TProps, TData> | null>(null);

  const context = useMemo<PluginContext<TProps, TData>>(() => {
    const ctx: PluginContext<TProps, TData> = {
      props,
      data,
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
  }, [props, data, state, deviceInfo, bus, extendContext]);

  contextRef.current = context;

  const transformProps = useCallback(
    (input: TProps): TProps => {
      let next = input;
      for (const plugin of orderedPlugins) {
        const fn = plugin.hooks?.transformProps;
        if (typeof fn === "function") next = fn(next);
      }
      return next;
    },
    [orderedPlugins]
  );

  const transformData = useCallback(
    (input: TData): TData => {
      let next = input;
      for (const plugin of orderedPlugins) {
        const fn = plugin.hooks?.transformData as
          | ((ctx: PluginContext<TProps, TData>, d: TData) => TData)
          | undefined;
        if (typeof fn === "function") next = fn(contextRef.current!, next);
      }
      return next;
    },
    [orderedPlugins]
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
