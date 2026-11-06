import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

/** T 默认 unknown：与 plugins/types.ts 的泛型默认值说明同源（配置类型常被简写引用） */
export type ScrollAnchorConfig<T = unknown> = {
  /** 通过此函数提取锚点 id（默认使用 item.id） */
  getAnchorId?: (item: T, index: number) => string | number | undefined;
};

/**
 * ScrollAnchorPlugin - 滚动锚点（实验版）
 * - 渲染一个简单的锚点跳转控件
 * - 支持通过 bus 事件 anchor:scrollToId 跳转
 */
// T 默认 unknown：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createScrollAnchorPlugin<T = unknown>(config: ScrollAnchorConfig<T> = {}): WaterfallPlugin<T> {
  const getAnchorId: (item: T, index: number) => string | number | undefined =
    config.getAnchorId ||
    ((item) => (item as unknown as { id?: string | number } | null | undefined)?.id);
  let unsubscribe: (() => void) | undefined;
  return {
    name: "ScrollAnchorPlugin",
    enabled: true,
    hooks: {
      onMount: (context) => {
        unsubscribe = context.bus?.on("anchor:scrollToId", (payload: { id: string | number }) => {
          const items = context.props?.items || [];
          const targetIndex = items.findIndex((it, idx) => getAnchorId(it, idx) === payload.id);
          if (targetIndex >= 0) {
            context.scrollToItem?.(targetIndex, { behavior: "smooth", block: "start" });
          }
        });
      },
      onUnmount: () => unsubscribe?.(),
    },
  };
}
