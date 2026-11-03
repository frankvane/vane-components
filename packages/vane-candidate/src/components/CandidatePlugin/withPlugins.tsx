/**
 * withCandidatePlugins - HOC 组合器（接 vane-plugin-core）。
 *
 * 领域适配：
 *  1. 内部数据态：监听 bus 事件 `candidate:update` / `candidate:batch-update` /
 *     `candidate:move` / `candidate:batch-move`，对内部候选人列表做不可变更新并
 *     广播 `candidate:change`；宿主回写 props.data 后受控同步。
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
import { applyCandidatePatch, moveStage, patchMeaningful, withHistory } from "./domain";
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

      // ---- 内部数据态：bus 数据事件 → 内部列表 + candidate:change
      // dataRef 镜像当前内部数据：bus 处理器在事件回调里计算 next（副作用全部
      // 位于 setState updater 之外，避免 StrictMode 双调用 / 并发渲染下重复广播）。
      const [internalData, setInternalData] = useState<T[] | undefined>(props.data);
      const dataRef = useRef<T[]>(props.data ?? []);

      // 落态 + 广播的唯一出口（变更确实发生时才调用）
      const commitDataRef = useRef<(next: T[]) => void>(() => {});
      commitDataRef.current = (next: T[]) => {
        dataRef.current = next;
        setInternalData(next);
        runtime.bus.emit("candidate:change", { data: next });
        props.onDataChange?.(next);
      };

      // 领域上下文扩展：插件经这些方法改数据（走 bus，稳定引用）
      const extendContext = useCallback(
        (base: PluginContext<CandidateCoreProps<T>, T[]>): CandidatePluginContext<T> => {
          const stages =
            (base.props?.stages as StageConfig[] | undefined) ??
            (DEFAULT_STAGES as StageConfig[]);
          return {
            ...base,
            updateCandidate: (id: string, patch: Partial<Candidate>) => {
              base.bus.emit("candidate:update", { id, patch });
            },
            updateCandidates: (
              updates: Array<{ id: string; patch: Partial<Candidate> }>
            ) => {
              base.bus.emit("candidate:batch-update", { updates });
            },
            moveCandidate: (id: string, delta: number) => {
              base.bus.emit("candidate:move", { id, delta, stages });
            },
            moveCandidateTo: (id: string, targetStage: string) => {
              base.bus.emit("candidate:move", { id, targetStage, stages });
            },
            moveCandidatesTo: (ids: string[], targetStage: string) => {
              base.bus.emit("candidate:batch-move", { ids, targetStage, stages });
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

      // 宿主受控回写：props.data 变化 → 同步内部态与 dataRef。
      // 注意：data 一旦受控就不回落为非受控（undefined 只表示「本次未传」）。
      useEffect(() => {
        if (props.data !== undefined) {
          dataRef.current = props.data;
          setInternalData(props.data);
        }
      }, [props.data]);

      useEffect(
        () =>
          runtime.bus.on("candidate:update", (payload: unknown) => {
            const { id, patch } = (payload ?? {}) as {
              id?: string;
              patch?: Partial<T>;
            };
            if (!id || !patch || !patchMeaningful(patch as Partial<Candidate>)) return;
            const base = dataRef.current;
            // id 不存在 / 无有效变更时不落态、不广播（避免多余的 onDataChange）
            if (!base.some((c) => c.id === id)) return;
            const next = applyCandidatePatch(base, id, patch as Partial<Candidate>);
            commitDataRef.current(next as T[]);
          }),
        // bus 每实例仅创建一次，订阅一次即可；deps 保留 bus 以防未来内核改动
        [runtime.bus]
      );

      useEffect(
        () =>
          runtime.bus.on("candidate:batch-update", (payload: unknown) => {
            const { updates } = (payload ?? {}) as {
              updates?: Array<{ id?: string; patch?: Partial<T> }>;
            };
            if (!Array.isArray(updates) || updates.length === 0) return;
            let next = dataRef.current;
            let changed = false;
            for (const { id, patch } of updates) {
              if (!id || !patch || !patchMeaningful(patch as Partial<Candidate>)) continue;
              if (!next.some((c) => c.id === id)) continue;
              next = applyCandidatePatch(next, id, patch as Partial<Candidate>) as T[];
              changed = true;
            }
            // 单次聚合落态 + 单次广播（避免逐条 emit 的持久化风暴）
            if (changed) commitDataRef.current(next as T[]);
          }),
        [runtime.bus]
      );

      useEffect(
        () =>
          runtime.bus.on("candidate:move", (payload: unknown) => {
            const { id, delta, targetStage, stages } = (payload ?? {}) as {
              id?: string;
              delta?: number;
              targetStage?: string;
              stages?: StageConfig[];
            };
            if (!id) return;
            const stageList = stages ?? (DEFAULT_STAGES as StageConfig[]);
            const base = dataRef.current;
            const target = base.find((c) => c.id === id);
            if (!target) return;
            let nextStage: string;
            if (targetStage !== undefined) {
              // 目标阶段直给：调用方与执行侧不再各自换算 delta，杜绝阶段表错位
              if (!stageList.some((s) => s.key === targetStage)) return;
              nextStage = targetStage;
            } else {
              if (!delta) return;
              nextStage = moveStage(stageList, target.stage, delta);
            }
            if (nextStage === target.stage) return;
            const next = applyCandidatePatch(
              base,
              id,
              withHistory({ ...target, stage: nextStage }, "阶段流转", nextStage) as T
            );
            commitDataRef.current(next as T[]);
          }),
        [runtime.bus]
      );

      useEffect(
        () =>
          runtime.bus.on("candidate:batch-move", (payload: unknown) => {
            const { ids, targetStage, stages } = (payload ?? {}) as {
              ids?: string[];
              targetStage?: string;
              stages?: StageConfig[];
            };
            if (!Array.isArray(ids) || ids.length === 0 || !targetStage) return;
            const stageList = stages ?? (DEFAULT_STAGES as StageConfig[]);
            if (!stageList.some((s) => s.key === targetStage)) return;
            let next = dataRef.current;
            let changed = false;
            for (const id of ids) {
              const target = next.find((c) => c.id === id);
              if (!target || target.stage === targetStage) continue;
              next = applyCandidatePatch(
                next,
                id,
                withHistory({ ...target, stage: targetStage }, "阶段流转", targetStage) as T
              ) as T[];
              changed = true;
            }
            if (changed) commitDataRef.current(next as T[]);
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
        () => ({
          ...runtimeContext,
          data: transformedData as T[],
          // 全量内部数据（管道前）：人才库 / 判重 / 标签收集等需要原始数据的场景用
          rawData: internalData as T[] | undefined,
        }),
        [runtimeContext, transformedData, internalData]
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
