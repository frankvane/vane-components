import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { usePluginRuntime } from "vane-plugin-core";
import type { PluginContext } from "vane-plugin-core";
import type {
  ModalSheetCoreProps,
  ModalSheetCoreRef,
  ModalSheetPlugin,
  ModalSheetPluginContext,
  ModalSheetWithPluginsConfig,
} from "./types";
import { createSheetState, type SheetEngineState } from "../engine";
import { ModalSheetSlotProvider } from "./ModalSheetSlotProvider";

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
  config: ModalSheetWithPluginsConfig | ModalSheetPlugin<unknown>[]
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

      const extendContext = useCallback(
        (
          base: PluginContext<ModalSheetCoreProps, unknown>
        ): PluginContext<ModalSheetCoreProps, unknown> => {
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
        // 领域 context 是内核 context 的超集，结构兼容，按内核签名返回
        return ctx as unknown as PluginContext<ModalSheetCoreProps, unknown>;
      }, []);

      const runtime = usePluginRuntime<ModalSheetCoreProps, unknown>({
        plugins,
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

      // 生命周期钩子链（onMount 只跑一次；onUnmount / onMount cleanup 由
      // usePluginRuntime 卸载时统一执行，这里不重复捕获返回值）。
      // 首帧即 isOpen：先合成一次「关闭 → 打开」的 onPropsChange，让
      // ScrollLock / FocusTrap / History 等行为插件收到翻转；再执行 onMount。
      // 门控：只有在语义相关 props（开关 / 吸附点 / 高度语义 / 宽度）变化时
      // 才跑 onPropsChange，children / 内联样式等高频 props 不触发插件链。
      const changeKey = [
        props.isOpen,
        JSON.stringify(props.snapPoints),
        props.detent,
        props.maxHeight,
        props.width,
      ].join("|");
      const prevPropsRef = useRef<ModalSheetCoreProps | null>(null);
      const prevKeyRef = useRef<string | null>(null);
      const mountedRef = useRef(false);
      useEffect(() => {
        const prevKey = prevKeyRef.current;
        prevKeyRef.current = changeKey;
        const prev = prevPropsRef.current;
        prevPropsRef.current = props;
        if (!mountedRef.current) {
          mountedRef.current = true;
          const first = props;
          if (first.isOpen) {
            void execute("onPropsChange", { ...first, isOpen: false }, first);
          }
          void execute("onMount");
          return;
        }
        if (prevKey === changeKey) return;
        if (prev) void execute("onPropsChange", prev, props);
        // 每次渲染都要比对 key；execute 在组件生命周期内稳定
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
        onClose: (fromExternal?: boolean) => {
          // 外部受控关闭时用户已在父级处理，不重复回调；插件链始终收尾
          if (!fromExternal) props.onClose?.();
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
          orderedPlugins={runtime.orderedPlugins as unknown as ModalSheetPlugin<unknown>[]}
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
