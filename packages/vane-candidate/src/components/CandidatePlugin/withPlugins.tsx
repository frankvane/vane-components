/**
 * withCandidatePlugins - HOC 组合器（接 vane-plugin-core）。
 *
 * 领域适配：
 *  1. 内部数据态：监听 bus 事件 `candidate:update` / `candidate:move`，对内部候选人
 *     列表做不可变更新并广播 `candidate:change`；宿主回写 props.data 后受控同步。
 *     插件经 ctx.updateCandidate / ctx.moveCandidate（extendContext 注入）改数据，
 *     自身无需感知数据源。
 *  2. Core 回调 → 钩子链：onMount / onPropsChange（onUnmount 由内核统一执行）；
 *  3. 渲染插槽：领域槽（toolbar / footer / per-card / 内容覆盖）走 CandidateSlotProvider；
 *     内核 renderOverlay 兜底层包 PluginErrorBoundary 后透传 children。
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
import type { WithPluginsConfig, PluginContext, PluginHooks } from "vane-plugin-core";
import type {
  Candidate,
  CandidateCoreProps,
  CandidateCoreRef,
  CandidatePlugin,
  CandidatePluginContext,
  StageConfig,
} from "./plugins/types";
import { DEFAULT_STAGES } from "./plugins/types";
import { applyCandidatePatch, moveStage, withHistory } from "./domain";
import { CandidateSlotProvider } from "./plugins/slots";

/** onPropsChange 浅比较时忽略的字段：children / ref 容器每次渲染都可能新建 */
const IGNORED_PROP_KEYS = new Set(["children", "containerRefExternal"]);

function candidatePropsEqual<T extends Candidate>(
  a: CandidateCoreProps<T>,
  b: CandidateCoreProps<T>
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

export function withCandidatePlugins<T extends Candidate = Candidate>(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<CandidateCoreProps<T>> & React.RefAttributes<CandidateCoreRef>
  >,
  config: WithPluginsConfig<CandidateCoreProps<T>> | CandidatePlugin<T>[]
) {
  const normalized: WithPluginsConfig<CandidateCoreProps<T>> = Array.isArray(config)
    ? { plugins: config }
    : config;
  const { plugins, enableDebug = false } = normalized;

  const WithPluginsComponent = forwardRef<CandidateCoreRef, CandidateCoreProps<T>>(
    (props, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);

      // ---- 内部数据态：candidate:update / candidate:move → 内部列表 + candidate:change
      const [internalData, setInternalData] = useState<T[] | undefined>(props.data);
      const hostControlledRef = useRef(false);

      // 领域上下文扩展：插件用 updateCandidate / moveCandidate 改数据（走 bus，稳定引用）
      const extendContext = useCallback(
        (base: PluginContext<CandidateCoreProps<T>, T[]>): CandidatePluginContext<T> => {
          return {
            ...base,
            updateCandidate: (id: string, patch: Partial<Candidate>) => {
              base.bus.emit("candidate:update", { id, patch });
            },
            moveCandidate: (id: string, delta: number) => {
              const stages =
                (base.props?.stages as StageConfig[] | undefined) ??
                (DEFAULT_STAGES as StageConfig[]);
              base.bus.emit("candidate:move", { id, delta, stages });
            },
          };
        },
        []
      );

      const runtime = usePluginRuntime<CandidateCoreProps<T>, T[]>({
        plugins,
        props,
        data: internalData,
        containerRef,
        extendContext,
        enableDebug,
      });

      useEffect(() => {
        if (props.data !== undefined) {
          hostControlledRef.current = true;
          setInternalData(props.data);
        }
      }, [props.data]);

      const emitChangeRef = useRef<(list: T[]) => void>(() => {});
      emitChangeRef.current = (list: T[]) => {
        runtime.bus.emit("candidate:change", { data: list });
        props.onDataChange?.(list);
      };

      useEffect(
        () =>
          runtime.bus.on("candidate:update", (payload: unknown) => {
            const { id, patch } = (payload ?? {}) as {
              id?: string;
              patch?: Partial<T>;
            };
            if (!id || !patch) return;
            setInternalData((prev) => {
              const base = prev ?? [];
              const next = applyCandidatePatch(base, id, patch as Partial<Candidate>);
              emitChangeRef.current(next as T[]);
              return next as T[];
            });
          }),
        // runtime.bus 在插件集合变化时重建，需重新订阅
        [runtime.bus]
      );

      useEffect(
        () =>
          runtime.bus.on("candidate:move", (payload: unknown) => {
            const { id, delta, stages } = (payload ?? {}) as {
              id?: string;
              delta?: number;
              stages?: StageConfig[];
            };
            if (!id || !delta) return;
            setInternalData((prev) => {
              const base = prev ?? [];
              const target = base.find((c) => c.id === id);
              if (!target) return base as T[];
              const nextStage = moveStage(
                stages ?? (DEFAULT_STAGES as StageConfig[]),
                target.stage,
                delta
              );
              if (nextStage === target.stage) return base as T[];
              const next = applyCandidatePatch(
                base,
                id,
                withHistory({ ...target, stage: nextStage }, "阶段流转", nextStage) as T
              );
              emitChangeRef.current(next as T[]);
              return next as T[];
            });
          }),
        [runtime.bus]
      );

      const runtimeContext = runtime.context as CandidatePluginContext<T>;

      // transformData 接线：按内核排序（依赖拓扑 + priority 降序）执行。
      // 依赖含 runtime.state：Filter / Search / ContactMask 均为「状态驱动」型转换，
      // 用户切换开关（setState）须触发管道重跑。
      const transformedData = useMemo(
        () =>
          internalData === undefined
            ? undefined
            : runtime.transformData(internalData),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [internalData, runtime.transformData, runtime.state]
      );

      const domainContext = useMemo<CandidatePluginContext<T>>(
        () => ({ ...runtimeContext, data: transformedData as T[] }),
        [runtimeContext, transformedData]
      );

      const execute = useCallback(
        (hookName: string, ...args: unknown[]) =>
          runtime.execute(
            hookName as keyof PluginHooks<CandidateCoreProps<T>, T[]>,
            ...args
          ),
        // 只依赖 manager；runtime 对象每渲染新建，不能进依赖（否则 onMount 反复执行）
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      const transformedProps = runtime.transformProps(props) as CandidateCoreProps<T>;

      // onMount：挂载后触发钩子链（内核不自动跑 onMount）。
      useEffect(() => {
        void execute("onMount");
      }, [execute, runtime.orderedPlugins]);

      // onUnmount 由内核在卸载的 useLayoutEffect 内统一执行

      // onPropsChange：对关心的 props 做浅比较，忽略 children / ref 容器等每次新建字段
      const prevPropsRef = useRef<CandidateCoreProps<T> | null>(null);
      useEffect(() => {
        const prev = prevPropsRef.current;
        prevPropsRef.current = props;
        if (!prev || candidatePropsEqual(prev, props)) return;
        void execute("onPropsChange", prev, props);
      }, [props, execute]);

      const enhancedProps: CandidateCoreProps<T> = {
        ...transformedProps,
        containerRefExternal: containerRef,
        debug: transformedProps.debug ?? enableDebug,
        onMount: () => {
          transformedProps.onMount?.();
        },
        onUnmount: () => {
          transformedProps.onUnmount?.();
        },
        // 内核 renderOverlay 兜底层：Notes 面板 / 面试安排 / 婉拒模板 / 人才库等浮层。
        // 注意：toolbar / footer / per-card 槽由 CandidateCore 经 CandidateSlotProvider
        // 自行渲染，这里不重复 compose renderFooter。
        children: (
          <PluginErrorBoundary>
            {renderPluginSlot(runtime.orderedPlugins, domainContext, { hook: "renderOverlay" })}
            {transformedProps.children}
          </PluginErrorBoundary>
        ),
      };

      return (
        <CandidateSlotProvider
          orderedPlugins={runtime.orderedPlugins as unknown as CandidatePlugin<Candidate>[]}
          // T extends Candidate 的型变差异只在 onDataChange 回调上，运行时对象同一份
          context={domainContext as unknown as CandidatePluginContext<Candidate>}
        >
          <WrappedComponent
            ref={ref as React.Ref<CandidateCoreRef>}
            {...enhancedProps}
          />
        </CandidateSlotProvider>
      );
    }
  );

  WithPluginsComponent.displayName = "WithPlugins(CandidateCore)";
  return WithPluginsComponent;
}

export type { WithPluginsConfig } from "vane-plugin-core";
