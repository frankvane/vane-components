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
// T 默认 any：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createA11yPlugin<T = any>(config: A11yConfig = {}): WaterfallPlugin<T> {
  const containerRole = config.containerRole ?? "list";
  const itemRole = config.itemRole ?? "listitem";
  const enableTabIndex = config.enableTabIndex ?? true;
  const containerLabel = config.containerLabel ?? "Waterfall list";

  /**
   * roving tabindex：只有「当前项」是 tab 停靠点（0），其余为 -1。
   *
   * 旧实现给每一项都挂 `tabIndex=0`，一个列表按 Tab 要穿行几十次才能走到后面的控件；
   * 同时又写了 `outline:none`，键盘用户完全看不见焦点（P2-9）。
   */
  const rovingByInstance = new WeakMap<object, number>();
  const instanceKey = (context: WaterfallPluginContext<T>): object =>
    (context.containerRef?.current as unknown as object) ?? (context.bus as unknown as object);
  const getRovingIndex = (context: WaterfallPluginContext<T>): number =>
    rovingByInstance.get(instanceKey(context)) ?? 0;

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
      onItemClick: (context, index) => {
        // 点击后把 tab 停靠点挪过去（键盘用户随后按 Tab 从这一项继续）
        if (getRovingIndex(context) !== index) {
          rovingByInstance.set(instanceKey(context), index);
          context.forceUpdate?.();
        }
      },
      renderItemWrapper: (context, node, index) => (
        <div
          role={itemRole}
          aria-posinset={index + 1}
          // 渲染集合的项数（虚拟化下是当前挂载集合），与 aria-posinset 出自同一集合
          aria-setsize={context.itemCount}
          tabIndex={enableTabIndex ? (index === getRovingIndex(context) ? 0 : -1) : undefined}
        >
          {node}
        </div>
      ),
    },
  };
}
