import type {
  WaterfallPlugin,
  WaterfallPluginContext,
} from "../../components/WaterfallPlugin/plugins/types";

export type A11yConfig = {
  /** 为容器设置 ARIA role（默认 list） */
  containerRole?: string;
  /** 为项设置 ARIA role（默认 listitem） */
  itemRole?: string;
  /** 是否给项添加 tabindex 便于键盘焦点（默认 true） */
  enableTabIndex?: boolean;
  /** 容器 aria-label（默认 "Waterfall list"） */
  containerLabel?: string;
};

/**
 * A11yPlugin - 可访问性增强：容器 / 项的 ARIA 语义 + 键盘聚焦。
 *
 * 与旧版的两处差别：
 *  1. 容器属性改在 `onMount` / `onLayoutComplete` 里写。旧版写在 `renderOverlay`
 *     里——那是渲染期副作用，React 并发渲染下可能被丢弃或执行多次；
 *  2. `renderItemWrapper` 的签名统一成 `(context, node, index)`。旧版写的是
 *     `(context, content, index)`，而 DragReorder 写的是 `(context, index, item, children)`，
 *     同一个钩子两套参数顺序，靠"谁先装"决定传入什么，属于隐蔽的错位 bug。
 */
export function createA11yPlugin<T = any>(config: A11yConfig = {}): WaterfallPlugin<T> {
  const containerRole = config.containerRole ?? "list";
  const itemRole = config.itemRole ?? "listitem";
  const enableTabIndex = config.enableTabIndex ?? true;
  const containerLabel = config.containerLabel ?? "Waterfall list";

  const decorateContainer = (context: WaterfallPluginContext<T>) => {
    const container = context.containerRef.current;
    if (!container) return;
    container.setAttribute("role", containerRole);
    container.setAttribute("aria-label", containerLabel);
    container.setAttribute("aria-busy", context.isLayouting ? "true" : "false");
  };

  return {
    name: "A11yPlugin",
    enabled: true,
    hooks: {
      onMount: (context) => {
        decorateContainer(context);
      },
      onLayoutComplete: (context) => {
        decorateContainer(context);
      },
      renderItemWrapper: (context, node, index) => (
        <div
          role={itemRole}
          aria-posinset={index + 1}
          aria-setsize={context.itemCount}
          tabIndex={enableTabIndex ? 0 : undefined}
          style={{ outline: "none" }}
        >
          {node}
        </div>
      ),
    },
  };
}
