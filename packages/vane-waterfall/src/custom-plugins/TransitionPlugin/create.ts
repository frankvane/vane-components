import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type TransitionConfig = {
  /** 过渡时长（ms） */
  duration?: number;
  /** 过渡缓动 */
  easing?: string;
};

/**
 * TransitionPlugin - 布局变化过渡
 * - 为项元素应用 transform/opacity 的过渡，提升布局更新的视觉平滑度
 */
export function createTransitionPlugin<T = any>(
  config: TransitionConfig = {}
): WaterfallPlugin<T> {
  const duration = config.duration ?? 300;
  const easing = config.easing ?? "ease";

  return {
    name: "TransitionPlugin",
    priority: 65,
    enabled: true,
    hooks: {
      onItemMount: (context, _index, element) => {
        element.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
      },
      onLayout: (context) => {
        // 为现有项补充过渡样式
        context.itemRefs.forEach((el) => {
          if (el) {
            el.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
          }
        });
      },
    },
  };
}
