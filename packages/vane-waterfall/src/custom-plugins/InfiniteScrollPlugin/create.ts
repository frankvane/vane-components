import type {
  WaterfallCoreProps,
} from "../../components/WaterfallPlugin/WaterfallCore";
import type {
  WaterfallPlugin,
  WaterfallPluginContext,
} from "../../components/WaterfallPlugin/plugins/types";

export type InfiniteScrollConfig = {
  /** 距底部多少像素开始预加载，默认 300（≈ 半屏，滚到底时数据已就位） */
  threshold?: number;
  /** 加载回调；不给则读 `props.onLoadMore` */
  onLoadMore?: () => Promise<void> | void;
};

/**
 * InfiniteScrollPlugin - 滚动到距底阈值内触发加载更多。
 *
 * 与旧版的三处差别：
 *  1. 触发条件由 Core 的 `reachBottomOffset` 控制（旧版写死 100px，插件配 300 也不会提前触发）；
 *  2. 自带并发锁：上一次 onLoadMore 没 resolve 前不会重复触发（旧版每次滚动事件都会调）；
 *  3. `context.hasMore === false` 时直接停（配合页面 setState({ hasMore: false })）。
 */
// T 默认 any：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createInfiniteScrollPlugin<T = any>(
  config: InfiniteScrollConfig = {}
): WaterfallPlugin<T> {
  const threshold = Math.max(1, config.threshold ?? 300);
  /**
   * 并发锁按**实例**隔离。
   *
   * 旧实现是工厂闭包里的一个 `let loading`：同一个插件对象被两个瀑布流复用
   * （或同一页面开了两个无限列表）时，A 在加载会把 B 也锁住（P2-2）。
   * key 用容器元素（天然一实例一个），容器还没挂时退回该实例独有的 bus。
   */
  const loadingByInstance = new WeakMap<object, boolean>();
  const instanceKey = (context: WaterfallPluginContext<T>): object =>
    (context.containerRef?.current as unknown as object) ?? (context.bus as unknown as object);

  return {
    name: "InfiniteScrollPlugin",
    priority: 35,
    enabled: true,
    hooks: {
      transformProps: (props: WaterfallCoreProps<T>) => ({
        ...props,
        reachBottomOffset: threshold,
      }),

      onReachBottom: async (context: WaterfallPluginContext<T>, distance: number) => {
        const key = instanceKey(context);
        if (loadingByInstance.get(key)) return;
        if (context.hasMore === false) return;
        if (distance > threshold) return;

        const onLoadMore = config.onLoadMore ?? context.props.onLoadMore;
        if (typeof onLoadMore !== "function") return;

        loadingByInstance.set(key, true);
        try {
          await Promise.resolve(onLoadMore());
        } finally {
          loadingByInstance.delete(key);
        }
      },

      onUnmount: (context) => {
        loadingByInstance.delete(instanceKey(context));
      },
    },
  };
}
