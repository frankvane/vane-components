import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type FilterConfig<T = any> = {
  /** 初始筛选函数，可被 props.filterFn 覆盖 */
  predicate?: (item: T, index: number) => boolean;
  /** 条件变化后自动滚动到顶部 */
  scrollToTop?: boolean;
  /** 滚动行为（auto/smooth），仅在启用 scrollToTop 时生效 */
  scrollBehavior?: "auto" | "smooth";
};

/**
 * FilterPlugin - 基于筛选函数过滤 items
 * 优先使用 props.filterFn，其次使用创建插件时传入的 predicate
 */
export function createFilterPlugin<T = any>(config: FilterConfig<T> = {}): WaterfallPlugin<T> {
  return {
    name: "FilterPlugin",
    priority: 40,
    enabled: true,
    hooks: {
      transformProps: (props: any) => {
        const items: T[] = Array.isArray(props.items) ? props.items : [];
        const fn: ((item: T, index: number) => boolean) | undefined = props.filterFn || config.predicate;
        if (typeof fn !== "function") return props;
        const filtered = items.filter((it: T, idx: number) => {
          try {
            return !!fn(it, idx);
          } catch {
            return true;
          }
        });
        return { ...props, items: filtered } as any;
      },
      onPropsChange: (context, prevProps: any, nextProps: any) => {
        const prevFn = prevProps?.filterFn;
        const nextFn = nextProps?.filterFn;
        const enabledFromProps = typeof nextProps?.scrollToTopOnFilterChange === "boolean"
          ? nextProps.scrollToTopOnFilterChange
          : undefined;
        const shouldScroll = (enabledFromProps ?? Boolean(config.scrollToTop)) && prevFn !== nextFn;
        if (shouldScroll) {
          const behavior: "auto" | "smooth" = (nextProps?.scrollToTopBehavior as any) ?? config.scrollBehavior ?? "auto";
          context.scrollToTop?.({ behavior });
        }
      },
    },
  };
}
