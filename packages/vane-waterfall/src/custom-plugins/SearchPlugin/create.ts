import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type SearchConfig<T = any> = {
  /** 要搜索的字段名列表（仅用于对象项） */
  fields?: (keyof T)[];
  /** 条件变化后自动滚动到顶部 */
  scrollToTop?: boolean;
  /** 滚动行为（auto/smooth），仅在启用 scrollToTop 时生效 */
  scrollBehavior?: "auto" | "smooth";
};

/**
 * SearchPlugin - 基于 props.searchQuery 对 items 执行包含匹配过滤
 * 仅在对象项中按指定字段进行大小写不敏感的包含匹配
 */
export function createSearchPlugin<T = any>(config: SearchConfig<T> = {}): WaterfallPlugin<T> {
  const fields = config.fields ?? [];
  return {
    name: "SearchPlugin",
    priority: 20,
    enabled: true,
    hooks: {
      transformProps: (props: any) => {
        const query: string = String(props.searchQuery ?? "").trim();
        const items: T[] = Array.isArray(props.items) ? props.items : [];
        if (!query) return props;
        const q = query.toLowerCase();
        const filtered = items.filter((item) => {
          if (typeof item !== "object" || item === null) return false;
          const keys = fields.length > 0 ? fields : (Object.keys(item) as (keyof T)[]);
          for (const k of keys) {
            const v = (item as any)[k];
            if (v != null && String(v).toLowerCase().includes(q)) return true;
          }
          return false;
        });
        return { ...props, items: filtered } as any;
      },
      onPropsChange: (context, prevProps: any, nextProps: any) => {
        const prevQuery = String(prevProps?.searchQuery ?? "");
        const nextQuery = String(nextProps?.searchQuery ?? "");
        const enabledFromProps = typeof nextProps?.scrollToTopOnSearchChange === "boolean"
          ? nextProps.scrollToTopOnSearchChange
          : undefined;
        const shouldScroll = (enabledFromProps ?? Boolean(config.scrollToTop)) && prevQuery !== nextQuery;
        if (shouldScroll) {
          const behavior: "auto" | "smooth" = (nextProps?.scrollToTopBehavior as any) ?? config.scrollBehavior ?? "auto";
          context.scrollToTop?.({ behavior });
        }
      },
    },
  };
}
