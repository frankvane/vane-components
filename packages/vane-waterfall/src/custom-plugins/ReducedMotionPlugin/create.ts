import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type ReducedMotionConfig = {
  /** 当用户偏好减少动画时，是否禁用 transform 定位 */
  disableTransform?: boolean;
  /** 当用户偏好减少动画时，是否移除项过渡效果 */
  removeTransitions?: boolean;
};

/**
 * ReducedMotionPlugin - 尊重系统的减少动画偏好
 * - 通过 transformProps 调整核心配置与项样式
 */
export function createReducedMotionPlugin<T = any>(
  config: ReducedMotionConfig = {}
): WaterfallPlugin<T> {
  const mq = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  const prefersReduce = mq?.matches ?? false;
  const disableTransform = config.disableTransform ?? true;
  const removeTransitions = config.removeTransitions ?? true;
  const shouldStrip = prefersReduce && removeTransitions;

  return {
    name: "ReducedMotionPlugin",
    priority: 70,
    enabled: true,
    hooks: {
      transformProps: (props) => {
        if (!prefersReduce) return props as any;

        const next: any = { ...props };
        if (disableTransform) {
          next.useTransform = false;
        }
        if (removeTransitions) {
          next.itemStyle = { ...(props.itemStyle ?? {}), transition: "none" };
        }
        return next;
      },
      /**
       * 只改 itemStyle 不够：TransitionPlugin 之类会直接在元素上写 `style.transition`
       * （onItemMount / onLayout 里），内联样式比 itemStyle 更晚生效，覆盖回来就白改了。
       * onLayoutComplete 在全部 onLayout 之后执行，在这里再清一次才真的「没有过渡」。
       */
      onItemMount: (_context, _index, element) => {
        if (shouldStrip) element.style.transition = "none";
      },
      onLayoutComplete: (context) => {
        if (!shouldStrip) return;
        context.itemRefs.forEach((el) => {
          if (el) el.style.transition = "none";
        });
      },
    },
  };
}
