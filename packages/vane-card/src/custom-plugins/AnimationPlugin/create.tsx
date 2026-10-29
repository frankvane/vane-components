/**
 * AnimationPlugin - 入场动画（淡入 + 上移）
 *
 * 迁移要点（C3.3）：
 *  - setTimeout 以前没有清理：100ms 内卸载会在已脱离文档的元素上继续跑，
 *    而且会把 opacity:0 留在原地（容器被复用时表现为「卡片不见了」）。
 *  - 尊重 prefers-reduced-motion: reduce —— 用户在系统里关掉动效时直接不上动画。
 */

import type { CardPlugin, CardPluginContext } from "../../components/CardPlugin/plugins";

const DURATION_MS = 500;
const DELAY_MS = 100;
const OFFSET_PX = 20;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export const createAnimationPlugin = (): CardPlugin => ({
  name: "AnimationPlugin",
  version: "1.1.0",
  description: "卡片进入动画（淡入+上移；respects prefers-reduced-motion）",
  priority: 1,
  hooks: {
    onMount: (context: CardPluginContext) => {
      const container = context.getContainer();
      if (!container) return;

      // 用户偏好减弱动效：直接跳过，不写任何内联样式
      if (prefersReducedMotion()) return;

      container.style.opacity = "0";
      container.style.transform = `translateY(${OFFSET_PX}px)`;

      const timer = setTimeout(() => {
        container.style.transition = `opacity ${DURATION_MS}ms ease, transform ${DURATION_MS}ms ease`;
        container.style.opacity = "1";
        container.style.transform = "translateY(0)";
      }, DELAY_MS);

      return () => {
        clearTimeout(timer);
        // 卸载时把动画中途的内联样式复原，避免容器被复用后不可见
        container.style.opacity = "";
        container.style.transform = "";
      };
    },
  },
});
