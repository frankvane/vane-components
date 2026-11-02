import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { usePluginRuntime } from "vane-plugin-core";
import type {
  ModalSheetCoreProps,
  ModalSheetCoreRef,
  ModalSheetPlugin,
  ModalSheetPluginContext,
  ModalSheetWithPluginsConfig,
} from "./types";
import { createSheetState, type SheetEngineState } from "../engine";
import { ModalSheetSlotProvider } from "./slots";

/**
 * withModalSheetPlugins —— 弹层装配 HOC（领域 HOC 铁律）：
 *  - children 只兜消费方内容，绝不过内核 composeSlots（backdrop/handle/header/
 *    footer/overlay 由 Core 经 SlotProvider 自渲染，同名槽不会撞车重影）；
 *  - 领域 context 时基值（progress / currentSnap / height / viewportInset /
 *    snapCount）全部 getter，直读共享引擎状态，无快照；
 *  - ctx.props 是 transformProps 之后那份；
 *  - onSnap / onOpen / onClose 先跑用户回调，再跑插件领域钩子链。
 */
export function withModalSheetPlugins(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<ModalSheetCoreProps> &
      React.RefAttributes<ModalSheetCoreRef>
  >,
  config: ModalSheetWithPluginsConfig | ModalSheetPlugin<any>[]
) {
  const normalized: ModalSheetWithPluginsConfig = Array.isArray(config)
    ? { plugins: config as ModalSheetPlugin[] }
    : config;
  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<ModalSheetCoreRef, ModalSheetCoreProps>(
    (props, ref) => {
      const rootRef = useRef<HTMLDivElement | null>(null);
      const coreRef = useRef<ModalSheetCoreRef | null>(null);
      const sheetStateRef = useRef<SheetEngineState>(createSheetState());
      const transformedRef = useRef<ModalSheetCoreProps>(props);

      const extendContext = useCallback((base: any): ModalSheetPluginContext => {
        const ctx = { ...base } as ModalSheetPluginContext;
        // 时基值 getter：直读可变引擎状态，context 不因拖拽逐帧重建
        Object.defineProperties(ctx, {
          progress: {
            get: () => sheetStateRef.current.progress,
            enumerable: true,
            configurable: true,
          },
          currentSnap: {
            get: () => sheetStateRef.current.snapIndex,
            enumerable: true,
            configurable: true,
          },
          height: {
            get: () =>
              Math.max(
                sheetStateRef.current.hiddenY - sheetStateRef.current.y,
                0
              ),
            enumerable: true,
            configurable: true,
          },
          viewportInset: {
            get: () => sheetStateRef.current.viewportInset,
            enumerable: true,
            configurable: true,
          },
          snapCount: {
            get: () => sheetStateRef.current.snapYs.length,
            enumerable: true,
            configurable: true,
          },
          // ctx.props = transformProps 之后那份
          props: {
            get: () => transformedRef.current,
            enumerable: true,
            configurable: true,
          },
        });
        // 命令入口与拖拽面都从共享 state 上的 engine 读（Core 创建后回写），
        // 不走 forwardRef：槽位渲染发生在 useImperativeHandle 之前，首帧 ref 为空。
        ctx.snapTo = (index: number) =>
          sheetStateRef.current.engine?.snapTo(index);
        ctx.close = () => sheetStateRef.current.engine?.close();
        ctx.getPanel = () => coreRef.current?.getPanel() ?? null;
        ctx.getDragProps = () => {
          const engine = sheetStateRef.current.engine;
          if (!engine) return {};
          return {
            onPointerDown: (e: { clientY: number; preventDefault(): void }) => {
              e.preventDefault();
              engine.handlePointerDown(e);
            },
            style: { touchAction: "none" as const },
            "data-vane-ms-drag": "true",
          };
        };
        ctx.setViewportInset = (px: number) =>
          sheetStateRef.current.engine?.setViewportInset(px);
        return ctx;
      }, []);

      const runtime = usePluginRuntime<ModalSheetCoreProps, any>({
        plugins: plugins as any,
        props,
        containerRef: rootRef,
        enableDebug,
        extendContext,
      });

      const execute = useCallback(
        (hookName: string, ...args: unknown[]) =>
          runtime.execute(hookName as never, ...args),
        // manager 在组件生命周期内稳定
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      // onMount 钩子链（onUnmount 由内核卸载时统一执行）
      useEffect(() => {
        void execute("onMount");
      }, [execute]);

      // onPropsChange 钩子链：ScrollLock / FocusTrap / KeyboardAvoid 靠它响应 isOpen
      const prevPropsRef = useRef<ModalSheetCoreProps | null>(null);
      useEffect(() => {
        const prev = prevPropsRef.current;
        prevPropsRef.current = props;
        if (prev) void execute("onPropsChange", prev, props);
      });

      // 引擎回调桥：用户回调 + 插件领域钩子链
      const engineCallbacks = {
        onSnap: (index: number) => {
          props.onSnap?.(index);
          void execute("onSnap", index);
        },
        onOpen: () => {
          props.onOpen?.();
          void execute("onOpen");
        },
        onClose: () => {
          props.onClose?.();
          void execute("onClose");
        },
      };

      const enhancedProps: ModalSheetCoreProps = {
        ...props,
        containerRefExternal: rootRef,
        sheetState: sheetStateRef.current,
        engineCallbacks,
      };
      // transformProps 之后那份 props（context.props 与实际渲染保持一致）
      const finalProps = {
        ...enhancedProps,
        ...runtime.transformProps(enhancedProps),
      };
      transformedRef.current = finalProps;

      const setRef = (node: ModalSheetCoreRef | null) => {
        coreRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) {
          (ref as React.MutableRefObject<ModalSheetCoreRef | null>).current =
            node;
        }
      };

      return (
        <ModalSheetSlotProvider
          orderedPlugins={runtime.orderedPlugins as unknown as ModalSheetPlugin[]}
          context={runtime.context as ModalSheetPluginContext}
        >
          <WrappedComponent ref={setRef} {...finalProps} />
        </ModalSheetSlotProvider>
      );
    }
  );

  WithPluginsComponent.displayName = "WithPlugins(ModalSheetCore)";
  return WithPluginsComponent;
}
