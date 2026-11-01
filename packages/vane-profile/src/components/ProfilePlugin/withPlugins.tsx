/**
 * withPlugins - HOC 组合器（接 vane-plugin-core）
 *
 * 领域适配在此补齐，对齐 vane-card / vane-waterfall 的 withPlugins 约定：
 *  1. 领域上下文扩展：在内核 context 基础上附加主页专属字段
 *     （activeTab / setActiveTab / stats / followState / verified / badgeType / banner）；
 *     extendContext 用 useCallback 稳定，避免每次渲染重建 context；
 *  2. Core 回调 → 钩子链：onMount / onPropsChange（onUnmount 由内核统一执行）；
 *  3. onTabChange：activeTab 变化后触发，供插件订阅页签切换；
 *  4. 渲染插槽：composeSlots（before-header → children → overlay → after-header → footer）
 *     兜底叠加类；主页结构化段落走包内领域槽（ProfileSlotProvider 下发）；
 *  5. 内核三槽的外部化依赖策略：vane-plugin-core 已声明为 peer（模板默认），构建期
 *     外部化，不进 dist。
 *
 * priority 同向：内核「越大越先执行」，渲染插槽内「越大越靠后」，不做反转。
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  composeSlots,
  PluginErrorBoundary,
  usePluginRuntime,
} from "vane-plugin-core";
import type { WithPluginsConfig } from "vane-plugin-core";
import type {
  ProfileCoreProps,
  ProfileCoreRef,
  ProfilePlugin,
  ProfilePluginContext,
} from "./plugins/types";
import { ProfileSlotProvider } from "./plugins/slots";

export function withPlugins<T = any>(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<ProfileCoreProps<T>> & React.RefAttributes<ProfileCoreRef>
  >,
  config: WithPluginsConfig<ProfileCoreProps<T>> | ProfilePlugin<T>[]
) {
  const normalized: WithPluginsConfig<ProfileCoreProps<T>> = Array.isArray(config)
    ? { plugins: config }
    : config;
  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<ProfileCoreRef, ProfileCoreProps<T>>(
    (props, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);

      // 页签是否受控：显式传 activeTab 即受控（含 null），否则由内部 state 管。
      const isTabControlled = props.activeTab !== undefined;

      // 领域上下文扩展：在内核 context 基础上附加主页专属字段。
      // 返回类型放宽到 any：内核要求返回 PluginContext，而领域 ProfilePluginContext 是
      // 在其上叠加字段的超集（含 base 的 refs/shared/logger），结构兼容，仅需绕过
      // 类型系统的精确匹配。
      //  - 受控模式：activeTab 只读 props.onActiveTabChange 回调，不写内部 state；
      //  - 非受控模式：写内核 state（base.setState）触发 context 重建。
      // 依赖收敛到真正参与渲染的字段，避免宿主任意 props 变化都让 extendContext 换身份。
      const extendContext = useCallback(
        (base: any): any => {
          const currentTab: string | null = isTabControlled
            ? ((props.activeTab as string | null | undefined) ?? null)
            : ((base.state?.activeTab as string | null | undefined) ??
              props.defaultActiveTab ??
              null);
          const ctx: ProfilePluginContext<T> = {
            ...base,
            activeTab: currentTab,
            setActiveTab: (id: string | null) => {
              props.onActiveTabChange?.(id, currentTab);
              if (!isTabControlled) base.setState({ activeTab: id });
            },
            stats: props.stats ?? [],
            followState: props.followState ?? "none",
            verified: props.verified ?? false,
            badgeType: props.badgeType ?? "personal",
            banner: props.banner ?? null,
          };
          return ctx;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
          isTabControlled,
          props.activeTab,
          props.defaultActiveTab,
          props.onActiveTabChange,
          props.stats,
          props.followState,
          props.verified,
          props.badgeType,
          props.banner,
        ]
      );

      const runtime = usePluginRuntime<ProfileCoreProps<T>, T>({
        plugins,
        props,
        data: props.data,
        containerRef,
        extendContext,
        enableDebug,
      });

      const runtimeContext = runtime.context as ProfilePluginContext<T>;

      // transformData 接线：内核声明了该钩子但领域包此前从未执行（假契约）。
      // 这里按内核排序执行一次并下发到领域上下文；钩子拿到的是内核 context（原始 data）。
      const transformedData = useMemo(
        () =>
          props.data === undefined
            ? undefined
            : runtime.transformData(props.data as T),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.data, runtime.transformData]
      );

      const domainContext = useMemo<ProfilePluginContext<T>>(
        () => ({ ...runtimeContext, data: transformedData }),
        [runtimeContext, transformedData]
      );

      const execute = useCallback(
        (hookName: string, ...args: unknown[]) =>
          runtime.execute(hookName as any, ...args),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      const transformedProps = runtime.transformProps(props) as ProfileCoreProps<T>;

      // onMount：挂载后触发钩子链（内核不自动跑 onMount）
      useEffect(() => {
        void execute("onMount");
      }, [execute]);

      // onUnmount 由内核在卸载的 useLayoutEffect 内统一执行（executeHook + clear）

      // onPropsChange
      const prevPropsRef = useRef(props);
      useEffect(() => {
        const prev = prevPropsRef.current;
        if (prev !== props) {
          prevPropsRef.current = props;
          void execute("onPropsChange", prev, props);
        }
      }, [props, execute]);

      // onTabChange：activeTab 变化后触发（非受控时 TabSync 写 state；受控时消费方回写 props）。
      // 用渲染期拿到的值（currentTab）而不是渲染期写 ref，避免并发渲染下读到未提交的中间态。
      const currentTab = domainContext.activeTab;
      const prevTabRef = useRef<string | null>(currentTab);
      useEffect(() => {
        if (prevTabRef.current !== currentTab) {
          const old = prevTabRef.current;
          prevTabRef.current = currentTab;
          // 注意：runtime.execute 已预置 context，这里只传 (newTab, oldTab)
          void execute("onTabChange", currentTab, old);
        }
      }, [currentTab, execute]);

      const enhancedProps: ProfileCoreProps<T> = {
        ...transformedProps,
        containerRefExternal: containerRef,
        debug: transformedProps.debug ?? enableDebug,

        // 用户原始生命周期回调（插件链由上面 useEffect 触发，避免重复）
        onMount: () => {
          transformedProps.onMount?.();
        },
        onUnmount: () => {
          transformedProps.onUnmount?.();
        },

        // 子元素 + 内核三槽兜底（composeSlots 五段）。
        // Core 会把它与领域内容槽并列渲染（不再用内容槽整体替换 children），
        // 因此宿主内容与内核 header / overlay / footer 插件不会被内容插件吞掉。
        children: (
          <PluginErrorBoundary>
            {composeSlots(
              runtime.orderedPlugins,
              domainContext,
              transformedProps.children
            )}
          </PluginErrorBoundary>
        ),
      };

      return (
        <ProfileSlotProvider
          orderedPlugins={runtime.orderedPlugins as unknown as ProfilePlugin<any>[]}
          context={domainContext}
        >
          <WrappedComponent
            ref={ref as React.Ref<ProfileCoreRef>}
            {...enhancedProps}
          />
        </ProfileSlotProvider>
      );
    }
  );

  WithPluginsComponent.displayName = "WithPlugins(ProfileCore)";
  return WithPluginsComponent;
}

export type { WithPluginsConfig } from "vane-plugin-core";
