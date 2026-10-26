import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type ReducedMotionConfig = {
  /** 当用户偏好减少动画时，是否禁用 transform 定位 */
  disableTransform?: boolean;
  /** 当用户偏好减少动画时，是否移除项过渡效果 */
  removeTransitions?: boolean;
};

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * ReducedMotionPlugin - 尊重系统的减少动画偏好
 *
 * 两条「为什么」值得记下来：
 *
 * 1. **只改 `itemStyle` 不够**：TransitionPlugin 这类插件会在 `onItemMount` / `onLayout`
 *    里直接写元素的 `style.transition`，内联样式晚于 `itemStyle` 生效。`onLayoutComplete`
 *    在全部 `onLayout` 之后执行，必须在这里再清一次才真的「没有过渡」。
 *
 * 2. **偏好要能运行时切换**：以前在工厂创建时把 `mq.matches` 求值存成常量，用户中途改
 *    系统设置必须刷新页面。现在监听 `change`，并且自己维护一份已挂载元素表 ——
 *    偏好变了并不会触发布局，插件没有别的入口能遍历到那些元素。
 *
 * 定位方式（`useTransform`）是 props 层的，运行时切换要等下一次重渲染才生效；
 * 过渡效果则是即时生效的。
 */
export function createReducedMotionPlugin<T = any>(
  config: ReducedMotionConfig = {}
): WaterfallPlugin<T> {
  const mq =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(QUERY)
      : null;

  let prefersReduce = mq?.matches ?? false;
  const disableTransform = config.disableTransform ?? true;
  const removeTransitions = config.removeTransitions ?? true;

  /** 已挂载的元素：系统偏好变化时没有布局发生，只能靠自己记着它们 */
  const mounted = new Map<number, HTMLElement>();
  /**
   * 被我们压过时长的元素 → 它原本的 `transition-duration`。
   *
   * 为什么要记原值：Chrome 会把 `transition: transform 240ms ease` 拆成
   * `transition-property/timing-function/delay/duration` 四条长属性存在 style 上，
   * 只 `removeProperty("transition-duration")` 会留下 `transform, opacity` 的其余部分，
   * 时长变回默认 0s —— 看着像「恢复失败」。
   */
  const savedDuration = new Map<HTMLElement, string>();

  /**
   * 只压 `transition-duration`，不写 `transition: none`。
   *
   * 写简写会把 TransitionPlugin 的 `transform 240ms ease, opacity 240ms ease` 整条覆盖掉，
   * 等偏好撤销时就无从还原（删掉简写等于没有过渡）。压时长只覆盖「时长」这一项，
   * 撤销时把原值写回去即可。
   */
  const syncOne = (el: HTMLElement | null | undefined) => {
    if (!el || !removeTransitions) return;
    if (prefersReduce) {
      const current = el.style.transitionDuration;
      // 记「被压之前」的那个值：可能是空（没有过渡），也可能是 240ms
      if (current && current !== "0s") savedDuration.set(el, current);
      else if (!savedDuration.has(el)) savedDuration.set(el, current);
      el.style.setProperty("transition-duration", "0s");
    } else {
      const prev = savedDuration.get(el);
      if (prev === undefined) return;
      if (prev) el.style.setProperty("transition-duration", prev);
      else el.style.removeProperty("transition-duration");
      savedDuration.delete(el);
    }
  };
  const syncAll = () => mounted.forEach((el) => syncOne(el));

  const onChange = (event: MediaQueryListEvent) => {
    if (event.matches === prefersReduce) return;
    prefersReduce = event.matches;
    syncAll();
  };
  mq?.addEventListener?.("change", onChange);

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
          // 同样只压时长：写 transition:none 会在偏好撤销后把别人的过渡一起弄丢
          next.itemStyle = { ...(props.itemStyle ?? {}), transitionDuration: "0s" };
        }
        return next;
      },
      onItemMount: (_context, index, element) => {
        mounted.set(index, element);
        syncOne(element);
      },
      onItemUnmount: (_context, index) => {
        mounted.delete(index);
      },
      onLayoutComplete: (context) => {
        // 在全部 onLayout 之后执行：把 TransitionPlugin 刚写上的内联过渡再清一次
        context.itemRefs.forEach((el, index) => {
          if (el) mounted.set(index, el);
          syncOne(el);
        });
      },
      onUnmount: () => {
        mq?.removeEventListener?.("change", onChange);
        mounted.clear();
        savedDuration.clear();
      },
    },
  };
}
