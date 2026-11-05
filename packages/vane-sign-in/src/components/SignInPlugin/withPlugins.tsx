/**
 * withPlugins - 签到领域 HOC 组合器（接 vane-plugin-core）。
 *
 * 领域适配在此补齐：
 *  1. extendContext 在内核 context 上附加 data / callbacks（领域视图与业务动作入口）；
 *  2. Core 回调 → 钩子链：onMount / onPropsChange（onUnmount 由内核统一执行）；
 *  3. 渲染插槽：composeSlots 兜底 overlay 钩子（落在 Core 的 children）；
 *     结构化段落走包内领域槽（SignInSlotProvider 下发）。
 *  4. vane-plugin-core 声明为 peer（模板默认），构建期外部化，不进 dist。
 */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  PluginErrorBoundary,
  renderPluginSlot,
  usePluginRuntime,
} from "vane-plugin-core";
import type { PluginContext, PluginHooks, WithPluginsConfig } from "vane-plugin-core";
import type {
  SignInCallbacks,
  SignInCoreProps,
  SignInCoreRef,
  SignInData,
  SignInPlugin,
  SignInPluginContext,
  SignInPluginHooks,
} from "./plugins/types";
import { SignInSlotProvider } from "./plugins/SignInSlotProvider";
import { normalizeSignInData } from "../../utils/normalize";

/** 空回调单例：避免 `?? {}` 每次渲染造新对象，把 context 身份打散 */
const EMPTY_CALLBACKS: SignInCallbacks = {};

export function withPlugins(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<SignInCoreProps> & React.RefAttributes<SignInCoreRef>
  >,
  config: WithPluginsConfig<SignInCoreProps> | SignInPlugin[]
) {
  const normalized: WithPluginsConfig<SignInCoreProps> = Array.isArray(config)
    ? { plugins: config }
    : config;
  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<SignInCoreRef, SignInCoreProps>(
    (props, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      const callbacks = props.callbacks ?? EMPTY_CALLBACKS;

      // 领域上下文扩展：在内核 context 上附加 data / callbacks。
      // 依赖收敛到具体字段（data / callbacks）而不是整个 props：
      // 宿主任意一次 setState 都会换 props 身份，依赖 props 会让 context 每次都重建，
      // 进而让 Provider value 变化、五个领域槽全部重跑。
      const extendContext = useCallback(
        (
          base: PluginContext<SignInCoreProps, SignInData>
        ): SignInPluginContext => {
          const ctx: SignInPluginContext = {
            ...base,
            data: props.data,
            callbacks,
          };
          return ctx;
        },
        [props.data, callbacks]
      );

      const runtime = usePluginRuntime<SignInCoreProps, SignInData>({
        plugins,
        props,
        data: props.data,
        containerRef,
        extendContext,
        enableDebug,
      });

      const execute = useCallback(
        (hookName: keyof SignInPluginHooks, ...args: unknown[]) =>
          // onPropsChange 等钩子键与内核 PluginHooks 的键集合一致即可直接分发；
          // 这里收窄到内核键类型以满足 execute 的签名（实现分支未变）。
          runtime.execute(
            hookName as keyof PluginHooks<SignInCoreProps, SignInData>,
            ...args
          ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      // 数据归一：先跑 transformData 钩子链（P2-4，旧实现只在类型里声明、运行时从不执行），
      // 再统一兜底，保证插件拿到的是 calendar / rewards / makeup 一定存在的安全数据。
      const { transformData } = runtime;
      const transformedData = useMemo(
        () => normalizeSignInData(transformData(props.data)),
        [props.data, transformData]
      );

      // 领域槽专用 context：身份在 data / callbacks / 插件内部 state 不变时保持稳定，
      // 这样父级无关重渲染不会让五个槽重跑（P2-2）。
      // 注意：ctx.props 是首次 memo 时的快照；插件若要读容器 props 请改用 ctx.refs。
      const slotContext = useMemo<SignInPluginContext>(
        () =>
          ({
            ...runtime.context,
            data: transformedData,
            callbacks,
          }) as SignInPluginContext,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [transformedData, callbacks, runtime.bus, runtime.state]
      );

      const transformedProps = runtime.transformProps(props) as SignInCoreProps;

      // onMount：挂载后触发钩子链
      useEffect(() => {
        void execute("onMount");
      }, [execute]);

      // onPropsChange
      const prevPropsRef = useRef(props);
      useEffect(() => {
        const prev = prevPropsRef.current;
        if (prev !== props) {
          prevPropsRef.current = props;
          void execute("onPropsChange", prev, props);
        }
      }, [props, execute]);

      const enhancedProps: SignInCoreProps = {
        ...transformedProps,
        // 渲染树与插件读的是同一份归一化数据
        data: transformedData,
        containerRefExternal: containerRef,
        debug: transformedProps.debug ?? enableDebug,
        onMount: () => {
          transformedProps.onMount?.();
        },
        onUnmount: () => {
          transformedProps.onUnmount?.();
        },
        // overlay 钩子链兜底（绝对定位层）。
        // 铁律：这里不能走内核 composeSlots —— 它会把 renderHeader / renderFooter
        // 也组进 children，而签到的领域插件恰好用同名钩子承载五段式领域槽，
        // 结果是同一段内容渲染两遍：领域槽里一遍（带 .vs-* 包裹层和 padding），
        // children 里再裸一遍（无包裹层、无 padding、被 overflow:hidden 裁切，
        // 即用户看到的「顶边 / 文字贴边」重影）。签到的结构化段落一律走
        // SignInSlotProvider 领域槽，children 只兜 renderOverlay。
        children: (
          <PluginErrorBoundary>
            <>
              {transformedProps.children}
              {renderPluginSlot(runtime.orderedPlugins, slotContext, {
                hook: "renderOverlay",
              })}
            </>
          </PluginErrorBoundary>
        ),
      };

      return (
        <SignInSlotProvider
          orderedPlugins={runtime.orderedPlugins as unknown as SignInPlugin<unknown>[]}
          context={slotContext}
        >
          <WrappedComponent
            ref={ref as React.Ref<SignInCoreRef>}
            {...enhancedProps}
          />
        </SignInSlotProvider>
      );
    }
  );

  WithPluginsComponent.displayName = "WithPlugins(SignInCore)";
  return WithPluginsComponent;
}

export type { WithPluginsConfig } from "vane-plugin-core";
