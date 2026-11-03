/**
 * withPlugins - HOC 组合器（接 vane-plugin-core）
 *
 * 领域适配（对齐 vane-comment 的 withPlugins 约定）：
 *  1. 领域上下文扩展：在内核 context 基础上附加活动专属派生字段
 *     （tasks / rewards 含状态 / progress / claimedIds / claim）。
 *  2. 数据流水线：原始 data → transformData（如有）→ 透传；
 *     派生计算在 extendContext 统一完成，让插件读到一致的活动状态。
 *  3. Core 回调 → 钩子链：onMount / onUnmount（onUnmount 由内核统一执行）。
 *  4. 渲染插槽：renderHeader / renderProgress / renderTasks / renderRewards /
 *     renderRules / renderFooter 由 ActivityCore 经 useActivitySlot 消费，复用内核
 *     排序 + priority + 错误边界。
 *  5. 内核三槽的外部化依赖策略：vane-plugin-core 已声明为 peer，构建期外部化，不进 dist。
 *
 * priority 同向：内核「越大越先执行」，渲染插槽内「越大越靠后」，不做反转。
 */

import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import { usePluginRuntime } from "vane-plugin-core";
import type { WithPluginsConfig } from "vane-plugin-core";
import type {
  ActivityCoreProps,
  ActivityCoreRef,
  ActivityPlugin,
  ActivityPluginContext,
  ActivityData,
} from "./plugins/types";
import { ActivitySlotProvider } from "./plugins/slots";
import { computeProgress, deriveRewards } from "./domain";
import { resolveExclusivePlugins } from "./exclusive";

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

/**
 * 数据边界归一化：接口/低代码平台下发的 data 可能缺失或类型不对，
 * 统一把动态数组字段收敛为空数组，避免核心与插件在渲染期抛 TypeError。
 */
function normalizeActivityData(
  data: ActivityData | undefined
): ActivityData | undefined {
  if (!data || typeof data !== "object") return data;
  return {
    ...data,
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    rewards: Array.isArray(data.rewards) ? data.rewards : [],
    rules:
      Array.isArray(data.rules) || typeof data.rules === "string" ? data.rules : [],
  };
}

export function withPlugins<T = any>(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<ActivityCoreProps<T>> & React.RefAttributes<ActivityCoreRef>
  >,
  config: WithPluginsConfig<ActivityCoreProps<T>> | ActivityPlugin<T>[]
) {
  const normalized: WithPluginsConfig<ActivityCoreProps<T>> = Array.isArray(config)
    ? { plugins: config }
    : config;
  const { plugins: rawPlugins, enableDebug = false } = normalized;

  // 装配期独占槽位去重（组件外，每次 withPlugins 只算一次）：
  // 同槽位上声明 exclusiveSlots 的插件只保留 priority 最高者，避免双渲染重影。
  const { kept: plugins, dropped } = resolveExclusivePlugins(rawPlugins);
  if (dropped.length > 0) {
    const detail = dropped
      .map((d) => `${d.name}(被 ${d.winner} 挤出 ${d.slot})`)
      .join("、");
    console.warn(
      `[vane-activity] 独占槽位去重，以下插件未参与装配：${detail}`
    );
  }

  const WithPluginsComponent = forwardRef<ActivityCoreRef, ActivityCoreProps<T>>(
    (props, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);

      // 内核要求稳定引用，否则每次渲染都会重建 context。
      const extendContext = useCallback((base: any): any => base, []);

      const runtime = usePluginRuntime<ActivityCoreProps<T>, T>({
        plugins,
        props,
        data: (props.data as T | undefined),
        containerRef: containerRef as React.RefObject<HTMLElement | null>,
        // 领域派生依赖 transformData 的结果，这里只做内核层透传；
        // 派生字段统一在下面拿到 transformedData 后计算。
        extendContext,
        enableDebug,
      });

      // P1-1：接线 transformData 链（内核按依赖拓扑 + priority 执行）。
      // 依赖 runtime.context.data（内核已做浅比较稳定引用）而非 props.data，
      // 避免父组件每次渲染新建同内容对象时重复跑整条转换链。
      // 依赖 runtime.state：状态驱动的转换（如按开关裁剪任务）需随 state 重跑。
      const transformedData = useMemo(
        () =>
          runtime.context.data === undefined
            ? undefined
            : (runtime.transformData(
                runtime.context.data as unknown as T
              ) as ActivityData | undefined),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.context.data, runtime.transformData, runtime.state]
      );

      // P1-5：数据边界归一化，核心与插件都只看到安全数组。
      const normalizedData = useMemo(
        () => normalizeActivityData(transformedData),
        [transformedData]
      );

      // 受控 / 非受控：claimedRewardIds 传入即为受控（consumer 持有真值 + onClaim 回写）；
      // 否则内核用内部 state 持有 claimedIds。
      const controlled = props.claimedRewardIds !== undefined;
      const claimedIds = useMemo(() => {
        const list = controlled
          ? props.claimedRewardIds
          : (runtime.state.claimedIds as string[] | undefined);
        return Array.isArray(list) ? list : [];
      }, [controlled, props.claimedRewardIds, runtime.state.claimedIds]);

      const tasks = useMemo(() => normalizedData?.tasks ?? [], [normalizedData]);
      const progress = useMemo(() => computeProgress(tasks), [tasks]);
      const rewards = useMemo(
        () =>
          deriveRewards(normalizedData?.rewards ?? [], progress, claimedIds),
        [normalizedData, progress, claimedIds]
      );
      const rewardMap = useMemo(
        () => new Map(rewards.map((reward) => [reward.id, reward])),
        [rewards]
      );

      // 同 tick 连续领取时不能基于渲染快照覆盖，用 ref 串行累积；
      // inFlight 防止同一 id 在宿主回写前被重复点击。
      const claimedIdsRef = useRef<string[]>(claimedIds);
      claimedIdsRef.current = claimedIds;
      const inFlightRef = useRef<Set<string>>(new Set());

      const claim = useCallback(
        (rewardId: string) => {
          const reward = rewardMap.get(rewardId);
          if (!reward) {
            console.warn(`[vane-activity] 未知奖励 id：${rewardId}`);
            return;
          }
          if (reward.status !== "claimable") {
            console.warn(
              `[vane-activity] 奖励 ${rewardId} 当前状态为 ${reward.status}，不能领取`
            );
            return;
          }
          if (inFlightRef.current.has(rewardId)) return;
          inFlightRef.current.add(rewardId);

          const next = uniqueIds([...claimedIdsRef.current, rewardId]);
          claimedIdsRef.current = next;
          if (!controlled) {
            runtime.setState({ claimedIds: next });
          }
          props.onClaim?.(rewardId);
        },
        [controlled, props.onClaim, rewardMap, runtime]
      );

      // 宿主回写（或非受控 setState）后解除 in-flight；受控但未回写时保持锁定，
      // 避免重复触发 onClaim。
      useEffect(() => {
        for (const id of claimedIds) inFlightRef.current.delete(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [claimedIds.join("|")]);

      const execute = useCallback(
        (hookName: string, ...args: unknown[]) =>
          runtime.execute(hookName as any, ...args),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [runtime.manager]
      );

      const transformedProps = runtime.transformProps(props) as ActivityCoreProps<T>;

      // onMount：挂载后触发钩子链（内核不自动跑 onMount）
      useEffect(() => {
        void execute("onMount");
      }, [execute]);

      // onUnmount 由内核在卸载的 useLayoutEffect 内统一执行

      const domainContext = useMemo<ActivityPluginContext<T>>(
        () => ({
          ...(runtime.context as unknown as ActivityPluginContext<T>),
          data: normalizedData as unknown as T,
          tasks,
          progress,
          rewards,
          claimedIds,
          claim,
        }),
        [runtime.context, normalizedData, tasks, progress, rewards, claimedIds, claim]
      );

      const enhancedProps: ActivityCoreProps<T> = {
        ...transformedProps,
        containerRefExternal: containerRef as React.RefObject<HTMLDivElement>,
        debug: transformedProps.debug ?? enableDebug,
        data: domainContext.data,
        onMount: () => {
          transformedProps.onMount?.();
        },
        onUnmount: () => {
          transformedProps.onUnmount?.();
        },
      };

      return (
        <ActivitySlotProvider
          orderedPlugins={runtime.orderedPlugins as unknown as ActivityPlugin<any>[]}
          context={domainContext}
        >
          <WrappedComponent
            ref={ref as React.Ref<ActivityCoreRef>}
            {...enhancedProps}
          />
        </ActivitySlotProvider>
      );
    }
  );

  WithPluginsComponent.displayName = "WithPlugins(ActivityCore)";
  return WithPluginsComponent;
}

export type { WithPluginsConfig } from "vane-plugin-core";
