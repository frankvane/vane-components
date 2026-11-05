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
// T 默认 any：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createPaginationPlugin<T = any>(config: PaginationConfig = {}): WaterfallPlugin<T> {
  return {
    name: "PaginationPlugin",
    priority: 10,
    enabled: true,
    hooks: {
      transformProps: (props) => {
        // 统一采用 1 基页码：展示页码从 1 开始。
        // 非法输入（NaN / 小数 / 负数）先归一，否则 slice 会得到出人意料的结果
        const rawIndex = Number(props.pageIndex ?? 1);
        const pageIndex1: number = Math.max(
          1,
          Math.floor(Number.isFinite(rawIndex) ? rawIndex : 1)
        );
        const rawSize = Number(props.pageSize ?? config.pageSize ?? 20);
        const pageSize: number = Math.max(1, Math.floor(Number.isFinite(rawSize) ? rawSize : 20));
        const items: T[] = Array.isArray(props.items) ? props.items : [];
        // 页码越界（搜索后数据变少、深链带了合法范围外的页码）时钳到最后一页。
        // 旧实现直接 slice 出空数组，界面静默变成空列表，没有任何提示（P2-3）
        const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
        const currentPage = Math.min(pageIndex1, pageCount);
        if (pageIndex1 > pageCount) {
          console.warn(
            `[vane-waterfall] PaginationPlugin：pageIndex=${pageIndex1} 超出总页数 ${pageCount}，已钳制到第 ${currentPage} 页`
          );
        }
        const start = (currentPage - 1) * pageSize;
        const sliced = items.slice(start, start + pageSize);
        return { ...props, items: sliced };
      },
      onPropsChange: (context, prevProps, nextProps) => {
        // 仅在页码变化时触发“滚动到顶部”逻辑
        const prevIndex = Math.max(1, Number(prevProps.pageIndex ?? 1));
        const nextIndex = Math.max(1, Number(nextProps.pageIndex ?? 1));
        const enabledFromProps = typeof nextProps.scrollToTopOnPageChange === "boolean"
          ? nextProps.scrollToTopOnPageChange
          : undefined;
        const shouldScroll = (enabledFromProps ?? Boolean(config.scrollToTop)) && prevIndex !== nextIndex;
        if (shouldScroll) {
          const behavior: "auto" | "smooth" = nextProps.scrollToTopBehavior ?? config.scrollBehavior ?? "auto";
          context.scrollToTop?.({ behavior });
        }
      },
    },
  };
}
