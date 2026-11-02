/**
 * withResumePlugins - HOC 组合器（接 vane-plugin-core）。
 *
 * 领域适配：
 *  1. 领域上下文：在内核 context 基础上把 data 替换为「transformData 链之后」的数据，
 *     extendContext 用 useCallback 稳定，避免每次渲染重建 context；
 *  2. Core 回调 → 钩子链：onMount / onPropsChange（onUnmount 由内核统一执行）；
 *  3. 渲染插槽：composeSlots（before-header → children → overlay → after-header → footer）
 *     兜底叠加类（毛玻璃 / 灯箱 / 角标 / 模态），结构化段落走包内领域槽（ResumeSlotProvider）；
 *  4. 内核三槽的外部化依赖策略：vane-plugin-core 已声明为 peer，构建期外部化。
 *
 * priority 同向：内核「越大越先执行」，渲染插槽内「越大越靠后」，不做反转。
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { renderPluginSlot, PluginErrorBoundary, usePluginRuntime } from "vane-plugin-core";
import type { WithPluginsConfig } from "vane-plugin-core";
import type {
  ResumeCoreProps,
  ResumeCoreRef,
  ResumePlugin,
  ResumePluginContext,
} from "./plugins/types";
import { ResumeSlotProvider } from "./plugins/slots";

/** onPropsChange 浅比较时忽略的字段：children / ref 容器每次渲染都可能新建 */
const IGNORED_PROP_KEYS = new Set(["children", "containerRefExternal"]);

function resumePropsEqual(
  a: ResumeCoreProps<any>,
  b: ResumeCoreProps<any>
): boolean {
  const ra = a as Record<string, unknown>;
  const rb = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(ra), ...Object.keys(rb)]);
  for (const key of keys) {
    if (IGNORED_PROP_KEYS.has(key)) continue;
    if (!Object.is(ra[key], rb[key])) return false;
  }
  return true;
}

export function withResumePlugins<T = any>(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<ResumeCoreProps<T>> & React.RefAttributes<ResumeCoreRef>
  >,
  config: WithPluginsConfig<ResumeCoreProps<T>> | ResumePlugin<T>[]
) {
  const normalized: WithPluginsConfig<ResumeCoreProps<T>> = Array.isArray(config)
    ? { plugins: config }
    : config;
  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<ResumeCoreRef, ResumeCoreProps<T>>(
    (props, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);

      // 简历领域无受控/非受控切换（板块顺序等全走 ctx.state），extendContext 直接透传 base。
      const extendContext = useCallback((base: any): any => base, []);

      const runtime = usePluginRuntime<ResumeCoreProps<T>, T>({
        plugins,
        props,
        data: props.data,
        containerRef,
        extendContext,
        enableDebug,
      });

      const runtimeContext = runtime.context as ResumePluginContext<T>;

      // P1-1：版本恢复事件 `resume:data-replace` → 内部数据覆盖。
      // 宿主未接 Versioning 的 onRestore 时，恢复也能真正改变简历内容；
      // 宿主回写 props.data 后，下面的 effect 会撤销覆盖，回到受控数据。
      const [restoredData, setRestoredData] = useState<T | null>(null);
      useEffect(
        () =>
          runtime.bus.on("resume:data-replace", (payload: unknown) => {
            const next =
              payload && typeof payload === "object" && "data" in (payload as object)
                ? (payload as { data?: T }).data
                : (payload as T | undefined);
            setRestoredData(next ?? null);
          }),
        [runtime.bus]
      );
      const rawDataRef = useRef(runtime.context.data);
      useEffect(() => {
        if (rawDataRef.current !== runtime.context.data) {
          rawDataRef.current = runtime.context.data;
          setRestoredData(null);
        }
      }, [runtime.context.data]);

      const effectiveData = (restoredData ?? props.data) as T | undefined;

      // transformData 接线：按内核排序（依赖拓扑 + priority 降序）执行。
      // 依赖含 runtime.state：MultiLang / AiPolish / ContactDesensitize / PrivacyMask / AtsScore
      // 均为「状态驱动」型转换，用户切换开关（setState）须触发管道重跑，否则掩码/翻译/润色不生效。
      const transformedData = useMemo(
        () =>
          effectiveData === undefined
            ? undefined
            : runtime.transformData(effectiveData),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [effectiveData, runtime.transformData, runtime.state]
      );

      const domainContext = useMemo<ResumePluginContext<T>>(
        () => ({ ...runtimeContext, data: transformedData as T }),
        [runtimeContext, transformedData]
      );

      const execute = useCallback(
        (hookName: string, ...args: unknown[]) =>
          runtime.execute(hookName as any, ...args),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      const transformedProps = runtime.transformProps(props) as ResumeCoreProps<T>;

      // onMount：挂载后触发钩子链（内核不自动跑 onMount）。
      // 插件集合变化时 usePluginRuntime 会 clear + 重注册（清理旧副作用），
      // 此时必须重跑 onMount，否则 PrintOptimize 等注入的 <style> 清理后不会装回。
      useEffect(() => {
        void execute("onMount");
      }, [execute, runtime.orderedPlugins]);

      // onUnmount 由内核在卸载的 useLayoutEffect 内统一执行

      // onPropsChange：对关心的 props 做浅比较，忽略 children / ref 容器等每次新建字段，
      // 避免 React 每次渲染新建 props 对象导致钩子被高频调用。
      const prevPropsRef = useRef<ResumeCoreProps<T> | null>(null);
      useEffect(() => {
        const prev = prevPropsRef.current;
        prevPropsRef.current = props;
        if (!prev || resumePropsEqual(prev, props)) return;
        void execute("onPropsChange", prev, props);
      }, [props, execute]);

      const enhancedProps: ResumeCoreProps<T> = {
        ...transformedProps,
        containerRefExternal: containerRef,
        debug: transformedProps.debug ?? enableDebug,
        onMount: () => {
          transformedProps.onMount?.();
        },
        onUnmount: () => {
          transformedProps.onUnmount?.();
        },
        // 内核三槽兜底层：before-header → children → overlay → after-header。
        // 注意：footer 槽由 ResumeCore 经 ResumeSlotProvider 自行渲染（useResumeSlot），
        // 这里若再走 composeSlots 的 renderFooter 会重复渲染（ATS/版本/投递角标出现两份）。
        // 故只保留 ResumeCore 不处理的 header / overlay 两类。
        children: (
          <PluginErrorBoundary>
            {renderPluginSlot(runtime.orderedPlugins, domainContext, { hook: "renderHeader", position: "before" })}
            {transformedProps.children}
            {renderPluginSlot(runtime.orderedPlugins, domainContext, { hook: "renderOverlay" })}
            {renderPluginSlot(runtime.orderedPlugins, domainContext, { hook: "renderHeader", position: "after" })}
          </PluginErrorBoundary>
        ),
      };

      return (
        <ResumeSlotProvider
          orderedPlugins={runtime.orderedPlugins as unknown as ResumePlugin<any>[]}
          context={domainContext}
        >
          <WrappedComponent
            ref={ref as React.Ref<ResumeCoreRef>}
            {...enhancedProps}
          />
        </ResumeSlotProvider>
      );
    }
  );

  WithPluginsComponent.displayName = "WithPlugins(ResumeCore)";
  return WithPluginsComponent;
}

export type { WithPluginsConfig } from "vane-plugin-core";
