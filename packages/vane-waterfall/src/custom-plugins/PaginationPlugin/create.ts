import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type PaginationConfig = {
  /** 每页数量 */
  pageSize?: number;
  /** 翻页后自动滚动到顶部 */
  scrollToTop?: boolean;
  /** 滚动行为（auto/smooth），仅在启用 scrollToTop 时生效 */
  scrollBehavior?: "auto" | "smooth";
};

/**
 * PaginationPlugin - 基于 props 中的 pageIndex/pageSize 对 items 进行分页切片
 * 支持通过 config.pageSize 设定默认每页数量
 */
export function createPaginationPlugin<T = any>(config: PaginationConfig = {}): WaterfallPlugin<T> {
  return {
    name: "PaginationPlugin",
    priority: 10,
    enabled: true,
    hooks: {
      transformProps: (props: any) => {
        // 统一采用 1 基页码：展示页码从 1 开始
        const pageIndex1: number = Math.max(1, Number(props.pageIndex ?? 1));
        const pageSize: number = Math.max(1, Number(props.pageSize ?? config.pageSize ?? 20));
        const items: T[] = Array.isArray(props.items) ? props.items : [];
        const start = (pageIndex1 - 1) * pageSize;
        const end = start + pageSize;
        const sliced = items.slice(start, end);
        return { ...props, items: sliced } as any;
      },
      onPropsChange: (context, prevProps: any, nextProps: any) => {
        // 仅在页码变化时触发“滚动到顶部”逻辑
        const prevIndex = Math.max(1, Number(prevProps?.pageIndex ?? 1));
        const nextIndex = Math.max(1, Number(nextProps?.pageIndex ?? 1));
        const enabledFromProps = typeof nextProps?.scrollToTopOnPageChange === "boolean"
          ? nextProps.scrollToTopOnPageChange
          : undefined;
        const shouldScroll = (enabledFromProps ?? Boolean(config.scrollToTop)) && prevIndex !== nextIndex;
        if (shouldScroll) {
          const behavior: "auto" | "smooth" = (nextProps?.scrollToTopBehavior as any) ?? config.scrollBehavior ?? "auto";
          context.scrollToTop?.({ behavior });
        }
      },
    },
  };
}
