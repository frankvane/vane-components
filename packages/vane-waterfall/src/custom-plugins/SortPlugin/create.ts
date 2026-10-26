import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type SortConfig<T = any> = {
  /** 初始比较函数，可被 props.sortComparator 覆盖 */
  comparator?: (a: T, b: T) => number;
  /** 条件变化后自动滚动到顶部 */
  scrollToTop?: boolean;
  /** 滚动行为（auto/smooth），仅在启用 scrollToTop 时生效 */
  scrollBehavior?: "auto" | "smooth";
};

/**
 * SortPlugin - 基于比较函数对 items 排序
 * 优先使用 props.sortComparator，其次使用创建插件时传入的 comparator
 */
export function createSortPlugin<T = any>(config: SortConfig<T> = {}): WaterfallPlugin<T> {
  return {
    name: "SortPlugin",
    priority: 30,
    enabled: true,
    hooks: {
      transformProps: (props: any) => {
        const items: T[] = Array.isArray(props.items) ? props.items : [];
        const cmp: ((a: T, b: T) => number) | undefined = props.sortComparator || config.comparator;
        if (typeof cmp !== "function") return props;
        const sorted = [...items].sort((a, b) => {
          try {
            return cmp(a, b);
          } catch {
            return 0;
          }
        });
        return { ...props, items: sorted } as any;
      },
      onPropsChange: (context, prevProps: any, nextProps: any) => {
        const prevCmp = prevProps?.sortComparator;
        const nextCmp = nextProps?.sortComparator;
        const enabledFromProps = typeof nextProps?.scrollToTopOnSortChange === "boolean"
          ? nextProps.scrollToTopOnSortChange
          : undefined;
        const shouldScroll = (enabledFromProps ?? Boolean(config.scrollToTop)) && prevCmp !== nextCmp;
        if (shouldScroll) {
          const behavior: "auto" | "smooth" = (nextProps?.scrollToTopBehavior as any) ?? config.scrollBehavior ?? "auto";
          context.scrollToTop?.({ behavior });
        }
      },
    },
  };
}
