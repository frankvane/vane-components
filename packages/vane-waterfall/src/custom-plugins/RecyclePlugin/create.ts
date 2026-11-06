import type {
  WaterfallPlugin,
  WaterfallPluginContext,
} from "../../components/WaterfallPlugin/plugins/types";

export type RecycleConfig = {
  /** 视口外隐藏项以降低渲染压力（最大可见项数，近似控制） */
  poolSize: number;
};

/**
 * RecyclePlugin - 简化版 DOM 回收：
 * - 当项离开视口时，设置其元素为 `visibility:hidden`，减少绘制压力
 * - 当项进入视口时，恢复为 `visibility:visible`
 */
// T 默认 unknown：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createRecyclePlugin<T = unknown>(config: RecycleConfig): WaterfallPlugin<T> {
  const visibleSet = new Set<number>();

  const ensurePoolLimit = (context: WaterfallPluginContext<T>) => {
    if (visibleSet.size <= config.poolSize) return;
    // 朴素策略：移除最早加入的项
    const first = visibleSet.values().next().value as number | undefined;
    if (typeof first === "number") {
      visibleSet.delete(first);
      // 被挤出池子的项必须一起隐藏：旧实现只删集合、元素仍是 visible，
      // 池子上限等于没生效（P2-4）
      const el = context.getItemRef(first);
      if (el) el.style.visibility = "hidden";
    }
  };

  return {
    name: "RecyclePlugin",
    enabled: true,
    hooks: {
      onItemEnterViewport: (context, index) => {
        const el = context.getItemRef(index);
        if (el) el.style.visibility = "visible";
        visibleSet.add(index);
        ensurePoolLimit(context);
      },
      onItemLeaveViewport: (context, index) => {
        const el = context.getItemRef(index);
        if (el) el.style.visibility = "hidden";
        visibleSet.delete(index);
      },
      onItemUnmount: (_ctx, index) => {
        visibleSet.delete(index);
      },
      onUnmount: () => {
        visibleSet.clear();
      },
    },
  };
}
