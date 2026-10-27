/**
 * withPlugins —— FilePreviewCore 的装配器（P2 · 接 @vane/plugin-core）
 *
 * 迁移前这里自带 PluginBus + PluginManager（两个文件 689 行），还顺手做了几件不该它做的事。
 * 现在：
 *  - 注册 / 依赖解析 / 优先级排序 / 钩子执行 / 沙箱 / 错误边界 → 全部交给内核 `usePluginRuntime`
 *  - **渲染自己写**：内核的 `composeSlots` 是「多插件合成」，
 *    而文件预览是「单赢家」—— 一个文件只能有一个插件渲染正文，
 *    用槽位合成会让 17 个插件同时往同一个容器里画。
 *
 * 与内核的三处桥接：
 *  1. `extendContext`：内核 context + 领域字段（file / state 镜像 / reportState / refs / …）
 *  2. Core 的状态回调 → 领域钩子链（onLoadStart / onLoadSuccess / onLoadError）
 *  3. Core 的 `onStateChange` → 更新只读镜像（**不是第二份真源**，是单向投影）
 *
 * 刻意去掉的三件事（都是迁移前的实际缺陷）：
 *  - `isPdfPlugin = activePlugin?.name === "PdfPreviewPlugin"` 的硬编码插件名。
 *    装配层不该认识具体插件；滚动交给插件自己管（P3 让 PdfPreviewPlugin 在内部收口）。
 *  - 每次渲染遍历全部插件调 `renderOverlay`（17 个插件 0 个实现，纯浪费）。
 *    改为只问赢家。
 *  - `pluginManager.executeHook(...).catch(() => {})` 吞掉钩子异常。
 *    交给内核的沙箱与 `PluginErrorBoundary`。
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PluginErrorBoundary,
  usePluginRuntime,
  type Plugin as KernelPlugin,
} from "@vane/plugin-core";

import type {
  FilePreviewCoreProps,
  FilePreviewCoreRef,
} from "../core/FilePreviewCore";
import type {
  DeviceInfo,
  FileInfo,
  FilePreviewPlugin,
  FilePreviewPluginContext,
  PluginBus,
  PreviewDimensions,
  PreviewStateInfo,
  WithPluginsConfig,
} from "./types";
import { resolvePreview, unsupportedMessage } from "./resolve";

/** 路由失败时替代正文的面板 */
function UnsupportedNotice({ file }: { file: FileInfo }) {
  return (
    <div
      data-vfp-unsupported
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: 24,
        textAlign: "center",
        color: "#8a8a8a",
        boxSizing: "border-box",
      }}
    >
      <span style={{ fontSize: 14 }}>{unsupportedMessage(file)}</span>
      <span style={{ fontSize: 12, color: "#b0b0b0" }}>
        没有插件声明支持它。装上对应的插件，或传一个自定义插件。
      </span>
    </div>
  );
}

export function withPlugins(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<FilePreviewCoreProps> &
      React.RefAttributes<FilePreviewCoreRef>
  >,
  config: WithPluginsConfig | FilePreviewPlugin[]
) {
  const normalized: WithPluginsConfig = Array.isArray(config)
    ? { plugins: config }
    : config;
  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<
    FilePreviewCoreRef,
    FilePreviewCoreProps
  >((props, ref) => {
    const { file } = props;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const coreRef = useRef<FilePreviewCoreRef | null>(null);

    /**
     * Core 状态的只读镜像。
     *
     * 它**不是**第二份真源：唯一写入口是 Core 的 `onStateChange`，
     * 插件想改状态只能 `reportState`（转发回 Core）。
     * 存在它只是为了「state 变化时让插件重渲染」—— getter 能读到最新值，
     * 但 React 需要一次 setState 才知道该重画。
     */
    const [state, setState] = useState<PreviewStateInfo>({ state: "idle" });
    const stateRef = useRef(state);
    stateRef.current = state;

    // 赢家路由：纯函数，可单测（见 test/resolve.test.ts）
    const winner = useMemo(
      () => resolvePreview(plugins, file),
      [plugins, file]
    );

    // 领域插件 → 内核插件。
    // 结构上完全兼容（name / hooks / config / priority / enabled / dependencies），
    // 只是 hooks 的 context 是领域 context：内核 executeHook 拿到的就是 extendContext
    // 返回的那个对象，所以运行时是对的；类型上要跨过「方法参数逆变」这一关。
    const kernelPlugins = useMemo(
      () => plugins.map((p) => p as unknown as KernelPlugin),
      [plugins]
    );

    const extendContext = useCallback(
      (base: any): any => {
        const measure = (): PreviewDimensions => {
          const el = containerRef.current;
          if (!el) return { width: 0, height: 0 };
          const r = el.getBoundingClientRect();
          return { width: r.width, height: r.height };
        };

        const ctx: FilePreviewPluginContext = {
          ...base,
          props,
          file,
          state: stateRef.current,
          reportState: (patch) => coreRef.current?.reportState(patch),
          containerRef,
          contentRef,
          sharedData: (base.shared as Map<string, unknown>) ?? new Map(),
          bus: base.bus as PluginBus,
          deviceInfo: base.deviceInfo as DeviceInfo,
          forceUpdate: base.forceUpdate,
          getSize: measure,
          logger: base.logger,
        };

        // file / state 用 getter：context 不因它们频繁重建，
        // 但插件读到的一定是当前值（而不是创建 context 那一帧的快照）。
        Object.defineProperties(ctx, {
          file: { get: () => file, enumerable: true, configurable: true },
          state: {
            get: () => stateRef.current,
            enumerable: true,
            configurable: true,
          },
        });
        return ctx;
      },
      // props / file 变化必须重建 context，否则插件读到旧文件
      [props, file]
    );

    const runtime = usePluginRuntime<FilePreviewCoreProps, any>({
      plugins: kernelPlugins,
      props,
      containerRef,
      extendContext,
      enableDebug,
    });

    const ctx = runtime.context as unknown as FilePreviewPluginContext;

    const execute = useCallback(
      (hookName: string, ...args: unknown[]) =>
        // manager 在组件生命周期内稳定，不放进依赖
        runtime.execute(hookName as never, ...args),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    // onMount 由内核之外触发：内核只在卸载时统一跑 onUnmount + clear，
    // 挂载这一侧要装配器显式调一次。
    useEffect(() => {
      void execute("onMount");
    }, [execute]);

    // Core 的用户回调走 latest-ref：Core 每次渲染都传新函数进来，
    // 闭包里的 execute 是稳定的，但 props 上的用户回调不一定。
    const userCallbacks = useRef({
      onLoadStart: props.onLoadStart,
      onLoadSuccess: props.onLoadSuccess,
      onLoadError: props.onLoadError,
      onStateChange: props.onStateChange,
    });
    userCallbacks.current = {
      onLoadStart: props.onLoadStart,
      onLoadSuccess: props.onLoadSuccess,
      onLoadError: props.onLoadError,
      onStateChange: props.onStateChange,
    };

    const enhancedProps: FilePreviewCoreProps = {
      ...props,
      containerRefExternal: containerRef,
      contentRefExternal: contentRef,

      // 没有插件能处理时**不进加载流程**：Core 停在 idle，正文换成提示面板。
      // 让 Core 先走一趟 loading→loaded 再报 unsupported，会在两者之间闪一次。
      onBeforeLoad: async () => {
        if (winner === null) return false;
        // 用户没传 onBeforeLoad 时不能返回 undefined —— Core 只认 `=== false` 拦截，
        // 但类型上要返回 boolean，且语义上「没传」等于「放行」
        const allowed = await Promise.resolve(props.onBeforeLoad?.());
        return allowed !== false;
      },

      onLoadStart: () => {
        userCallbacks.current.onLoadStart?.();
        void execute("onLoadStart");
      },
      onLoadSuccess: () => {
        userCallbacks.current.onLoadSuccess?.();
        void execute("onLoadSuccess");
      },
      onLoadError: (error) => {
        userCallbacks.current.onLoadError?.(error);
        void execute("onLoadError", error);
      },

      // Core 是唯一真源，这里只做单向镜像。
      // 但**用户的 onStateChange 必须转发出去** —— 这里曾经只 setState 就完了，
      // `...props` 展开的 onStateChange 被这个键覆盖掉，于是外面永远收不到状态变化：
      // 宿主拿它做 loading 指示器 / 埋点 / 状态读数时，界面会一直停在 idle，
      // 而内容其实早就渲染完了。这类「看起来没坏」的静默丢失最难查。
      onStateChange: (info) => {
        setState((prev) =>
          prev.state === info.state &&
          prev.message === info.message &&
          prev.error === info.error
            ? prev
            : info
        );
        userCallbacks.current.onStateChange?.(info);
      },

      children: (
        <PluginErrorBoundary>
          {winner === null ? (
            <UnsupportedNotice file={file} />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              {winner.hooks.renderToolbar && (
                <div
                  data-vfp-toolbar
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                    padding: 8,
                    flexShrink: 0,
                    borderBottom: "1px solid #ececec",
                    background: "rgba(255,255,255,0.95)",
                  }}
                >
                  {winner.hooks.renderToolbar(ctx)}
                </div>
              )}
              <div
                data-vfp-body
                style={{
                  flex: 1,
                  minHeight: 0,
                  // 统一 auto：装配层不认识具体插件。PDF 那种自带滚动的东西
                  // 由插件在自己的容器上收口（P3 处理），不在这里按插件名特判。
                  overflow: "auto",
                  overscrollBehavior: "contain",
                }}
              >
                {winner.hooks.render?.(ctx)}
                {/* 叠加层只问赢家：迁移前遍历全部 17 个插件，而 0 个实现它 */}
                {winner.hooks.renderOverlay?.(ctx)}
                {props.children}
              </div>
            </div>
          )}
        </PluginErrorBoundary>
      ),
    };

    return (
      <WrappedComponent
        ref={(node: FilePreviewCoreRef | null) => {
          coreRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) {
            (
              ref as React.MutableRefObject<FilePreviewCoreRef | null>
            ).current = node;
          }
        }}
        {...enhancedProps}
      />
    );
  });

  WithPluginsComponent.displayName = "WithPlugins(FilePreviewCore)";
  return WithPluginsComponent;
}

export default withPlugins;
