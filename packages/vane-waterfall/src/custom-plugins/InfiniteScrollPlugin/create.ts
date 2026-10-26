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
export function createInfiniteScrollPlugin<T = any>(
  config: InfiniteScrollConfig = {}
): WaterfallPlugin<T> {
  const threshold = Math.max(1, config.threshold ?? 300);
  let loading = false;

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
        if (loading) return;
        if (context.hasMore === false) return;
        if (distance > threshold) return;

        const onLoadMore = config.onLoadMore ?? context.props.onLoadMore;
        if (typeof onLoadMore !== "function") return;

        loading = true;
        try {
          await Promise.resolve(onLoadMore());
        } finally {
          loading = false;
        }
      },

      onUnmount: () => {
        loading = false;
      },
    },
  };
}
