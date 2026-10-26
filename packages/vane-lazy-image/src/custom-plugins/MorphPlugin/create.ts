import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

export interface MorphConfig {
  /** 形变类型 */
  type?:
    | "circle-to-square"
    | "square-to-circle"
    | "rounded-corners"
    | "scale-morph"
    | "rotate-morph"
    | "skew-morph"
    | "elastic"
    | "liquid"
    | "custom";
  /** 持续时间（毫秒） */
  duration?: number;
  /** 延迟（毫秒） */
  delay?: number;
  /** 缓动函数 */
  easing?: string;
  /** 悬停触发（鼠标进入时播放一次） */
  triggerOnHover?: boolean;
  /** 持续动画（infinite alternate） */
  continuous?: boolean;
  /** rounded-corners 起始圆角 */
  fromBorderRadius?: string;
  /** rounded-corners 结束圆角 */
  toBorderRadius?: string;
  /** scale-morph 起始缩放 */
  fromScale?: number;
  /** scale-morph 结束缩放 */
  toScale?: number;
  /** rotate-morph 起始角度 */
  fromRotate?: number;
  /** rotate-morph 结束角度 */
  toRotate?: number;
  /** skew-morph 起始/结束倾斜 */
  fromSkew?: number;
  /** skew-morph 起始/结束倾斜 */
  toSkew?: number;
  /** 自定义 keyframes：from / to 片段 */
  customTransform?: { from: string; to: string };
}

const KEYFRAMES: Record<string, (c: MorphConfig) => string> = {
  "circle-to-square": () =>
    `@keyframes morph-circle-to-square { from { border-radius: 50%; transform: scale(0.9); } to { border-radius: 0%; transform: scale(1); } }`,
  "square-to-circle": () =>
    `@keyframes morph-square-to-circle { from { border-radius: 0%; transform: scale(1); } to { border-radius: 50%; transform: scale(0.9); } }`,
  "rounded-corners": (c) =>
    `@keyframes morph-rounded-corners { from { border-radius: ${c.fromBorderRadius ?? "50%"}; } to { border-radius: ${c.toBorderRadius ?? "0%"}; } }`,
  "scale-morph": (c) =>
    `@keyframes morph-scale { from { transform: scale(${c.fromScale ?? 1}); } to { transform: scale(${c.toScale ?? 1}); } }`,
  "rotate-morph": (c) =>
    `@keyframes morph-rotate { from { transform: rotate(${c.fromRotate ?? 0}deg); } to { transform: rotate(${c.toRotate ?? 0}deg); } }`,
  "skew-morph": (c) =>
    `@keyframes morph-skew { from { transform: skewX(${c.fromSkew ?? 0}deg) skewY(${c.fromSkew ?? 0}deg); } to { transform: skewX(${c.toSkew ?? 0}deg) skewY(${c.toSkew ?? 0}deg); } }`,
  elastic: () =>
    `@keyframes morph-elastic { 0% { transform: scale(0.8); } 30% { transform: scale(1.1); } 50% { transform: scale(0.95); } 70% { transform: scale(1.02); } 100% { transform: scale(1); } }`,
  liquid: () =>
    `@keyframes morph-liquid { 0% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: rotate(0deg); } 25% { border-radius: 58% 42% 75% 25% / 76% 46% 54% 24%; } 50% { border-radius: 50% 50% 33% 67% / 55% 27% 73% 45%; transform: rotate(180deg); } 75% { border-radius: 33% 67% 58% 42% / 63% 68% 32% 37%; } 100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: rotate(360deg); } }`,
  custom: (c) =>
    c.customTransform
      ? `@keyframes morph-custom { from { ${c.customTransform.from} } to { ${c.customTransform.to} } }`
      : "",
};

const NAME: Record<string, string> = {
  "circle-to-square": "morph-circle-to-square",
  "square-to-circle": "morph-square-to-circle",
  "rounded-corners": "morph-rounded-corners",
  "scale-morph": "morph-scale",
  "rotate-morph": "morph-rotate",
  "skew-morph": "morph-skew",
  elastic: "morph-elastic",
  liquid: "morph-liquid",
  custom: "morph-custom",
};

function injectStyle(id: string, css: string) {
  if (typeof document === "undefined" || !css) return;
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

/**
 * MorphPlugin — 形变过渡效果（纯 CSS transforms）。
 * 加载成功时给 <img> 施加一段形变动画；支持 hover 触发与持续动画。
 */
export function createMorphPlugin(config: MorphConfig = {}): LazyImagePlugin {
  const {
    type = "elastic",
    duration = 800,
    delay = 0,
    easing = "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    triggerOnHover = false,
    continuous = false,
  } = config;

  const kf = (KEYFRAMES[type] ?? KEYFRAMES.elastic)(config);
  injectStyle(`morph-plugin-${type}`, kf);

  const animName = NAME[type] ?? "morph-elastic";

  return {
    name: "morph",
    version: "1.0.0",
    config,
    hooks: {
      onLoadSuccess: (context: LazyImageContext) => {
        const img = context.imageRef?.current;
        if (!img) return;
        if (continuous) {
          img.style.animation = `${animName} ${duration}ms ${easing} ${delay}ms infinite alternate`;
          return;
        }
        if (triggerOnHover) {
          const play = () => {
            img.style.animation = `${animName} ${duration}ms ${easing} ${delay}ms both`;
          };
          const reset = () => {
            img.style.animation = "";
          };
          img.addEventListener("mouseenter", play);
          img.addEventListener("mouseleave", reset);
          return;
        }
        // fill-mode 为 both：动画结束后保持末帧形态。此前在 animationend 里把
        // style.animation 清空，会让形变结果当场回弹（等于白播一次），故不再清理。
        img.style.animation = `${animName} ${duration}ms ${easing} ${delay}ms both`;
      },
    },
  };
}
