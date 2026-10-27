import type { CardPlugin, CardPluginContext } from "../../plugins";

export const createAnimationPlugin = (): CardPlugin => ({
  name: "AnimationPlugin",
  version: "1.0.0",
  description: "卡片进入动画（淡入+上移）",
  priority: 1,
  hooks: {
    onMount: (context: CardPluginContext) => {
      const container = context.getContainer();
      if (!container) return;
      container.style.opacity = "0";
      container.style.transform = "translateY(20px)";
      setTimeout(() => {
        container.style.transition = "all 0.5s ease";
        container.style.opacity = "1";
        container.style.transform = "translateY(0)";
      }, 100);
    },
  },
});
