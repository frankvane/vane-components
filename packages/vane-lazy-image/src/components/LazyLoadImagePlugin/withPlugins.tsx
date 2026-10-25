/**
 * vane-lazy-image 插件装配层。
 *
 * 复用 @vane/plugin-core 的 usePluginRuntime / composeSlots / PluginErrorBoundary，
 * 在此补齐图片领域适配（对比旧版内置插件系统的差异，见 tasks/01 差距表）：
 *
 *   1. priority 语义适配：领域「越小越优先（默认 100）」→ 内核「越大越优先」；
 *   2. 领域上下文：在内核 context 上追加 src / imageState / isIntersecting /
 *      imageRef / containerRef / networkInfo / sharedData / performanceData；
 *   3. progress 桥接：订阅 bus "progress" 事件 → 执行 onProgress 钩子；
 *   4. Core 生命周期 props → 领域钩子链（onLoad / onBeforeLoad / onLoadSuccess …）；
 *   5. 全局网络/设备变化 → onNetworkChange / onResize 钩子。
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  composeSlots,
  PluginErrorBoundary,
  usePluginRuntime,
} from "@vane/plugin-core";
import { toKernelPlugins } from "./plugins/priority";
import {
  addGlobalContextListener,
  getGlobalDeviceInfo,
  getGlobalNetworkInfo,
} from "../../utils/GlobalContext";
import type {
  LazyLoadImageCoreProps,
  LazyLoadImageCoreRef,
} from "./LazyLoadImageCore";
import type {
  ImageState,
  LazyImageContext,
  LazyImagePlugin,
  NetworkInfo,
  ProgressInfo,
} from "./plugins/types";

/** 领域 priority 基准：越小越优先 → 内核 kernelPriority = BASE - domainPriority */

export interface WithPluginsConfig {
  plugins: LazyImagePlugin[];
  enableDebug?: boolean;
}

// ---------- HOC ----------

export function withPlugins(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<LazyLoadImageCoreProps> &
      React.RefAttributes<LazyLoadImageCoreRef>
  >,
  config: WithPluginsConfig | LazyImagePlugin[]
) {
  const normalized: WithPluginsConfig = Array.isArray(config)
    ? { plugins: config }
    : config;
  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<
    LazyLoadImageCoreRef,
    LazyLoadImageCoreProps
  >((props, ref) => {
    const kernelPlugins = useMemo(
      () => toKernelPlugins(plugins),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [plugins.map((p) => p.name).join("|")]
    );

    // ---------- 领域状态（与 Core 内部状态镜像同步） ----------
    const imageRef = useRef<HTMLImageElement | null>(null);
    const [imageState, setImageState] = useState<ImageState>({
      isIdle: true,
      isLoading: false,
      isLoaded: false,
      isError: false,
    });
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [networkInfo, setNetworkInfo] = useState<NetworkInfo | undefined>(
      () => getGlobalNetworkInfo()
    );
    const performanceDataRef = useRef<{
      loadStartTime: number;
      loadEndTime?: number;
      duration?: number;
      size?: number;
    }>({ loadStartTime: 0 });
    const prevSrcRef = useRef(props.src);

    // ---------- 领域上下文：通过 extendContext 注入内核 context ----------
    // 内核 executeHook / transformData / onUnmount（卸载时）拿到的都是
    // 这个扩展后的 context，领域字段对插件始终可见。
    const extendContext = useCallback(
      (base: any): LazyImageContext => ({
        ...base,
        src: props.src,
        imageState,
        isIntersecting,
        imageRef,
        containerRef: base.refs.container as React.RefObject<HTMLElement | null>,
        networkInfo,
        // 领域别名：内核 shared（Map）→ 领域 sharedData，旧版插件零改动
        sharedData: base.shared as Map<string, any>,
        performanceData: performanceDataRef.current,
      }),
      [props.src, imageState, isIntersecting, networkInfo]
    );

    const runtime = usePluginRuntime<LazyLoadImageCoreProps, any>({
      plugins: kernelPlugins,
      props,
      enableDebug,
      extendContext,
    });

    // 注意：runtime.execute 内部会把内核 contextRef.current（已含领域字段）
    // 作为第一个参数传给插件钩子，这里只透传领域参数，不要重复传 context。
    // 依赖 runtime.manager（ref 持有，生命周期内稳定）而非 runtime 对象
    // （后者每次渲染新建），否则 onMount 会随重渲染重复触发。
    const execute = useCallback(
      (hookName: string, ...args: unknown[]) =>
        runtime.execute(hookName as any, ...args),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [runtime.manager]
    );

    // ---------- 生命周期钩子 ----------
    // onMount：layout 注册（usePluginRuntime 内）之后、本 effect 执行，插件已就绪。
    useEffect(() => {
      void execute("onMount");
    }, [execute]);

    // onUnmount 由 @vane/plugin-core 统一负责：其 useLayoutEffect cleanup 会先
    // 执行 onUnmount 链再 manager.clear()（插件引用已捕获，clear 不中断链），
    // 且 contextRef 已含领域字段。这里只订阅 progress 事件。
    useEffect(() => {
      const offProgress = runtime.bus.on("progress", (progress) => {
        void execute("onProgress", progress as ProgressInfo);
      });
      return offProgress;
    }, [execute, runtime.bus]);

    // ---------- src 变化 ----------
    useEffect(() => {
      const oldSrc = prevSrcRef.current;
      if (oldSrc !== props.src) {
        prevSrcRef.current = props.src;
        void execute("onSrcChange", oldSrc, props.src);
      }
    }, [props.src, execute]);

    // ---------- 全局网络/设备变化（集中监听，避免每实例重复注册） ----------
    useEffect(() => {
      const unsubscribe = addGlobalContextListener(() => {
        setNetworkInfo(getGlobalNetworkInfo());
        void execute("onNetworkChange");
        void execute("onResize");
      });
      return unsubscribe;
    }, [execute]);

    // ---------- Core 生命周期 props → 领域钩子链 ----------
    const handleBeforeLoad = useCallback(async () => {
      const result = await execute("onLoad");
      return result as string | undefined;
    }, [execute]);

    const handleLoadStart = useCallback(() => {
      performanceDataRef.current = {
        loadStartTime: performance.now(),
      };
      setImageState({
        isIdle: false,
        isLoading: true,
        isLoaded: false,
        isError: false,
      });
      void execute("onBeforeLoad");
    }, [execute]);

    const handleLoadSuccess = useCallback(
      (displaySrc?: string) => {
        const end = performance.now();
        performanceDataRef.current = {
          ...performanceDataRef.current,
          loadEndTime: end,
          duration: end - performanceDataRef.current.loadStartTime,
        };
        setImageState({
          isIdle: false,
          isLoading: false,
          isLoaded: true,
          isError: false,
        });
        void execute("onLoadSuccess", displaySrc ?? "");
      },
      [execute]
    );

    const handleLoadError = useCallback(
      (error: Error) => {
        setImageState({
          isIdle: false,
          isLoading: false,
          isLoaded: false,
          isError: true,
        });
        void execute("onLoadError", error);
      },
      [execute]
    );

    const handleEnterViewport = useCallback(() => {
      setIsIntersecting(true);
      void execute("onEnterViewport");
    }, [execute]);

    const handleLeaveViewport = useCallback(() => {
      setIsIntersecting(false);
      void execute("onLeaveViewport");
    }, [execute]);

    // ---------- 装配 ----------
    const enhancedProps: LazyLoadImageCoreProps = {
      ...runtime.transformProps(props),
      containerRefExternal: runtime.context.refs.container as React.RefObject<HTMLDivElement | null>,
      imageRefExternal: imageRef,
      children: (
        <PluginErrorBoundary>
          {composeSlots(runtime.orderedPlugins, runtime.context, props.children)}
        </PluginErrorBoundary>
      ),
      onBeforeLoad: handleBeforeLoad,
      onLoadStart: handleLoadStart,
      onLoadSuccess: handleLoadSuccess,
      onLoadError: handleLoadError,
      onEnterViewport: handleEnterViewport,
      onLeaveViewport: handleLeaveViewport,
    };

    return <WrappedComponent ref={ref} {...enhancedProps} />;
  });

  WithPluginsComponent.displayName = "WithPlugins(LazyLoadImageCore)";
  return WithPluginsComponent;
}

export default withPlugins;
