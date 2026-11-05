/**
 * 活动领域槽上下文 Provider（自 slots.tsx 拆出，仅导出该组件）
 *
 * ActivitySlotProvider 把当前实例的 orderedPlugins 与领域上下文下发给 ActivityCore
 * 与插件组件（它们通过 useActivitySlot / useActivityContext 读取）。
 */

import React, { useMemo } from "react";
import type { Plugin } from "vane-plugin-core";
import { SlotContext } from "./slots";
import type { SlotContextValue } from "./slots";
import type {
  ActivityCoreProps,
  ActivityData,
  ActivityPlugin,
  ActivityPluginContext,
} from "./types";

/**
 * 由 withPlugins 包在 WrappedComponent 外层，下发 orderedPlugins 与领域上下文。
 */
export function ActivitySlotProvider<T = ActivityData>({
  orderedPlugins,
  context,
  children,
}: {
  orderedPlugins: Plugin<ActivityCoreProps<T>, T>[];
  context: ActivityPluginContext<T>;
  children: React.ReactNode;
}) {
  const value = useMemo<SlotContextValue>(
    () => ({
      // 泛型插件集合在槽位层统一按默认领域数据渲染；渲染只读 hooks + 排序字段。
      orderedPlugins: orderedPlugins as unknown as ActivityPlugin<ActivityData>[],
      context: context as unknown as ActivityPluginContext<ActivityData>,
    }),
    [orderedPlugins, context]
  );
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}
