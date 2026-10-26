import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

export interface RevealAnimationConfig {
  /** 动画类型 */
  animation?:
    | "fade"
    | "fade-up"
    | "fade-down"
    | "fade-left"
    | "fade-right"
    | "zoom-in"
    | "zoom-out"
    | "rotate-in"
    | "flip-x"
    | "flip-y"
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "bounce"
    | "elastic"
    | "custom";
  /** 持续时间（毫秒） */
  duration?: number;
  /** 延迟（毫秒） */
  delay?: number;
  /** 缓动函数 */
  easing?: string;
  /** 自定义动画名（animation === "custom" 时生效） */
  customAnimation?: string;
  /** 自定义 keyframes 文本（animation === "custom" 时生效） */
  customKeyframes?: string;
  /** 动画填充模式 */
  fillMode?: "none" | "forwards" | "backwards" | "both";
  /** 是否禁用 */
  disabled?: boolean;
}

const KEYFRAMES: Record<string, string> = {
  fade: `@keyframes reveal-fade { from { opacity: 0; } to { opacity: 1; } }`,
  "fade-up": `@keyframes reveal-fade-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }`,
  "fade-down": `@keyframes reveal-fade-down { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }`,
  "fade-left": `@keyframes reveal-fade-left { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }`,
  "fade-right": `@keyframes reveal-fade-right { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }`,
  "zoom-in": `@keyframes reveal-zoom-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }`,
  "zoom-out": `@keyframes reveal-zoom-out { from { opacity: 0; transform: scale(1.2); } to { opacity: 1; transform: scale(1); } }`,
  "rotate-in": `@keyframes reveal-rotate-in { from { opacity: 0; transform: rotate(-180deg) scale(0.5); } to { opacity: 1; transform: rotate(0deg) scale(1); } }`,
  "flip-x": `@keyframes reveal-flip-x { from { opacity: 0; transform: perspective(400px) rotateX(-90deg); } to { opacity: 1; transform: perspective(400px) rotateX(0deg); } }`,
  "flip-y": `@keyframes reveal-flip-y { from { opacity: 0; transform: perspective(400px) rotateY(-90deg); } to { opacity: 1; transform: perspective(400px) rotateY(0deg); } }`,
  "slide-up": `@keyframes reveal-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`,
  "slide-down": `@keyframes reveal-slide-down { from { transform: translateY(-100%); } to { transform: translateY(0); } }`,
  "slide-left": `@keyframes reveal-slide-left { from { transform: translateX(100%); } to { transform: translateX(0); } }`,
  "slide-right": `@keyframes reveal-slide-right { from { transform: translateX(-100%); } to { transform: translateX(0); } }`,
  bounce: `@keyframes reveal-bounce { from { opacity: 0; transform: scale(0.3) translateY(-50px); } 50% { opacity: 1; transform: scale(1.05) translateY(0); } 70% { transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`,
  elastic: `@keyframes reveal-elastic { from { opacity: 0; transform: scale(0); } 50% { opacity: 1; transform: scale(1.2); } 75% { transform: scale(0.9); } 90% { transform: scale(1.05); } to { opacity: 1; transform: scale(1); } }`,
};

function injectStyle(id: string, css: string) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

/**
 * RevealAnimationPlugin — 图片揭示动画（纯 CSS，无依赖）。
 * 在加载成功时给 <img> 施加一段进场动画；支持 16 种预设 + 自定义。
 */
export function createRevealAnimationPlugin(
  config: RevealAnimationConfig = {}
): LazyImagePlugin {
  const {
    animation = "fade-up",
    duration = 600,
    delay = 0,
    easing = "ease-out",
    customAnimation,
    customKeyframes,
    fillMode = "both",
    disabled = false,
  } = config;

  if (animation !== "custom") {
    injectStyle(`reveal-animation-${animation}`, KEYFRAMES[animation] ?? "");
  } else if (customKeyframes && customAnimation) {
    injectStyle(
      `reveal-animation-custom-${customAnimation}`,
      customKeyframes
    );
  }

  return {
    name: "reveal-animation",
    version: "1.0.0",
    config,
    hooks: {
      onLoadSuccess: (context: LazyImageContext) => {
        if (disabled) return;
        const img = context.imageRef?.current;
        if (!img) return;
        const animName =
          animation === "custom"
            ? customAnimation || "none"
            : `reveal-${animation}`;
        img.style.animation = `${animName} ${duration}ms ${easing} ${delay}ms ${fillMode}`;
        if (fillMode === "none" || fillMode === "backwards") {
          const cleanup = () => {
            img.style.animation = "";
            img.removeEventListener("animationend", cleanup);
          };
          img.addEventListener("animationend", cleanup);
        }
      },
    },
  };
}
