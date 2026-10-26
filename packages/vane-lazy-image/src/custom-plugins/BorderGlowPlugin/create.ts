import type { LazyImagePlugin } from "../../components/LazyLoadImagePlugin/plugins/types";

export type BorderGlowPluginConfig = {
  color?: string; // default rgba(0, 153, 255, 0.6)
  blurPx?: number; // default 12
  spreadPx?: number; // default 2
  hoverMultiplier?: number; // default 1.4
};

export const createBorderGlowPlugin = (
  config?: BorderGlowPluginConfig
): LazyImagePlugin => {
  const color = config?.color ?? "rgba(0, 153, 255, 0.6)";
  const blur = Math.max(0, config?.blurPx ?? 12);
  const spread = Math.max(0, config?.spreadPx ?? 2);
  const hoverMul = Math.max(1, config?.hoverMultiplier ?? 1.4);

  const baseShadow = `0 0 ${blur}px ${spread}px ${color}`;
  const hoverShadow = `0 0 ${Math.round(blur * hoverMul)}px ${Math.round(spread * hoverMul)}px ${color}`;

  return {
    name: "border-glow",
    hooks: {
      onLoadSuccess(context) {
        const container = context.containerRef?.current as any;
        const parent = (container?.parentElement ?? null) as any;
        const grand = (parent?.parentElement ?? null) as any;
        const img = context.imageRef?.current as any;
        // 优先对外层卡片（再外一层）应用阴影，避免被父容器的 overflow: hidden 裁剪
        const target = grand || parent || container || img;
        if (!target) return;
        // 卸载时 refs 已被 React 置空，这里把目标节点记在 context 上，
        // 否则 onUnmount 拿不到 target 会直接 return，阴影会残留在外层节点上（实测会漏到下一个页面）
        (context as any).__lliGlowTarget = target;
        // 记录原始阴影，便于还原
        target.__lliPrevShadow = target.style.boxShadow || "";
        target.__lliPrevTransition = target.style.transition || "";
        target.style.boxShadow = target.__lliPrevShadow
          ? `${target.__lliPrevShadow}, ${baseShadow}`
          : baseShadow;
        target.style.transition = target.style.transition
          ? `${target.style.transition}, box-shadow 160ms ease`
          : "box-shadow 160ms ease";

        if (img) {
          img.style.borderRadius = img.style.borderRadius || "6px";
        }

        const onEnter = () => {
          target.style.boxShadow = target.__lliPrevShadow
            ? `${target.__lliPrevShadow}, ${hoverShadow}`
            : hoverShadow;
        };
        const onLeave = () => {
          target.style.boxShadow = target.__lliPrevShadow
            ? `${target.__lliPrevShadow}, ${baseShadow}`
            : baseShadow;
        };
        target.__lliGlowEnter = onEnter;
        target.__lliGlowLeave = onLeave;
        target.addEventListener("mouseenter", onEnter);
        target.addEventListener("mouseleave", onLeave);
      },
      onUnmount(context) {
        const target = (context as any).__lliGlowTarget as any;
        if (!target) return;
        const onEnter = target.__lliGlowEnter;
        const onLeave = target.__lliGlowLeave;
        if (onEnter) target.removeEventListener("mouseenter", onEnter);
        if (onLeave) target.removeEventListener("mouseleave", onLeave);
        // 还原原始阴影与过渡
        target.style.boxShadow = target.__lliPrevShadow || "";
        target.style.transition = target.__lliPrevTransition || "";
        delete target.__lliPrevShadow;
        delete target.__lliPrevTransition;
        delete target.__lliGlowEnter;
        delete target.__lliGlowLeave;
        delete (context as any).__lliGlowTarget;
      },
    },
  };
};

export default createBorderGlowPlugin;