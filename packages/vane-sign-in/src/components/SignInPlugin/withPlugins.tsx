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
import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import {
  composeSlots,
  PluginErrorBoundary,
  usePluginRuntime,
} from "vane-plugin-core";
import type { WithPluginsConfig } from "vane-plugin-core";
import type {
  SignInCoreProps,
  SignInCoreRef,
  SignInData,
  SignInPlugin,
  SignInPluginContext,
} from "./plugins/types";
import { SignInSlotProvider } from "./plugins/slots";

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

      // 领域上下文扩展：在内核 context 上附加 data / callbacks。
      const extendContext = useCallback(
        (base: any): any => {
          const ctx: SignInPluginContext = {
            ...base,
            data: props.data,
            callbacks: props.callbacks ?? {},
          };
          return ctx;
        },
        [props]
      );

      const runtime = usePluginRuntime<SignInCoreProps, SignInData>({
        plugins,
        props,
        data: props.data,
        containerRef,
        extendContext,
        enableDebug,
      });

      const ctxRef = useRef<SignInPluginContext>(
        runtime.context as unknown as SignInPluginContext
      );
      ctxRef.current = runtime.context as unknown as SignInPluginContext;

      const execute = useCallback(
        (hookName: string, ...args: unknown[]) =>
          runtime.execute(hookName as any, ...args),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      const transformedProps = runtime.transformProps(props) as SignInCoreProps;

      // onMount：挂载后触发钩子链
      useEffect(() => {
        void execute("onMount");
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        containerRefExternal: containerRef,
        debug: transformedProps.debug ?? enableDebug,
        onMount: () => {
          transformedProps.onMount?.();
        },
        onUnmount: () => {
          transformedProps.onUnmount?.();
        },
        // overlay 钩子链兜底（绝对定位层）
        children: (
          <PluginErrorBoundary>
            {composeSlots(
              runtime.orderedPlugins,
              runtime.context,
              transformedProps.children
            )}
          </PluginErrorBoundary>
        ),
      };

      return (
        <SignInSlotProvider
          orderedPlugins={runtime.orderedPlugins as unknown as SignInPlugin<any>[]}
          context={runtime.context as unknown as SignInPluginContext}
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
