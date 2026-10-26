import React from "react";
import type { LazyImagePlugin } from "../../components/LazyLoadImagePlugin/plugins/types";

/**
 * CustomEffectsPlugin — 自定义效果「逃逸舱」。
 *
 * 旧版 demo 的 CustomEffectsDemo 是把多个视觉插件（Caption / Filter / HoverZoom /
 * BorderGlow / Gallery / Skeleton / BlurUp …）组合展示的 showcase 页；在 v2 插件化
 * 架构里，更通用的做法是一个「任意 CSS 效果」插件：把内置插件没覆盖的视觉诉求，直接以
 * imageStyle / containerStyle / className / hoverImageStyle 的形式注入。
 *
 * 这正是「所有能力收敛到 LazyLoadImageCore + 插件钩子」哲学的最佳示范：内置效果不够时，
 * 不必再写一个 <XxxImage> 组件，几行钩子即可扩展。
 *
 * ⚠️ 悬停实现说明（曾踩坑）：早期版本在 onLoadSuccess 里用
 * `img.style.cssText = 基线` 的方式还原悬停，但 onLoadSuccess 在 onLoad 事件里同步执行，
 * 此刻 React 尚未提交 LOAD_SUCCESS 重渲染，抓到的 baseline 含 opacity:0；移出时还原成
 * opacity:0 导致图片「凭空消失」。改版后用纯 CSS `:hover` 规则（注入 <style>），浏览器
 * 原生处理进入/离开，完全不触碰 React 受控的内联样式，彻底规避该问题。
 */
export type CustomEffectsConfig = {
  /** 应用到 <img> 的任意内联样式（filter / transform / transition 等） */
  imageStyle?: React.CSSProperties;
  /** 附加到 <img> 的 className */
  imageClassName?: string;
  /** 应用到容器（卡片）的任意内联样式 */
  containerStyle?: React.CSSProperties;
  /** 附加到容器的 className */
  containerClassName?: string;
  /** 悬停时叠加到 <img> 的样式，由 CSS :hover 原生还原，如 { transform: "scale(1.08)" } */
  hoverImageStyle?: React.CSSProperties;
};

let STYLE_SEQ = 0;

/** React.CSSProperties -> CSS 声明串（camelCase 转 kebab-case） */
function cssText(style: React.CSSProperties): string {
  return Object.entries(style)
    .map(([k, v]) => {
      if (v == null) return "";
      const cssKey = k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      return `${cssKey}: ${v};`;
    })
    .filter(Boolean)
    .join(" ");
}

export const createCustomEffectsPlugin = (
  config?: CustomEffectsConfig
): LazyImagePlugin => {
  const imageStyle = config?.imageStyle ?? {};
  const containerStyle = config?.containerStyle ?? {};
  const hoverImageStyle = config?.hoverImageStyle ?? {};
  const hasHover = Object.keys(hoverImageStyle).length > 0;

  // 每个插件实例生成唯一 class + 对应 <style> 元素（避免直改 DOM 与 React 受控样式冲突）
  const cls = `lli-custom-${++STYLE_SEQ}`;
  let styleEl: HTMLStyleElement | null = null;

  // 保留核心自带的 opacity 渐显：插件的 transition 只“追加”而非覆盖它
  const transition = [imageStyle.transition, "opacity 180ms ease"]
    .filter(Boolean)
    .join(", ");

  return {
    name: "custom-effects",
    priority: 50, // 早于多数视觉插件执行，便于叠加在它们之上
    hooks: {
      transformProps(props) {
        const img: React.CSSProperties = {
          ...(props.imageStyle || {}),
          ...imageStyle,
          transition,
        };
        const ctn: React.CSSProperties = {
          ...(props.containerStyle || {}),
          ...containerStyle,
        };
        const imageClassName = [
          props.imageClassName,
          config?.imageClassName,
          hasHover ? cls : null,
        ]
          .filter(Boolean)
          .join(" ");
        const containerClassName = [
          props.containerClassName,
          config?.containerClassName,
        ]
          .filter(Boolean)
          .join(" ");
        return {
          ...props,
          imageStyle: img,
          imageClassName,
          containerStyle: ctn,
          containerClassName,
        };
      },
      onLoadSuccess() {
        if (!hasHover || typeof document === "undefined" || styleEl) return;
        // 注入 :hover 规则，浏览器原生处理进入/离开，不触碰 React 受控内联样式
        styleEl = document.createElement("style");
        styleEl.setAttribute("data-lli-custom", cls);
        styleEl.textContent = `.${cls}:hover { ${cssText(hoverImageStyle)} }`;
        document.head.appendChild(styleEl);
      },
      onUnmount() {
        if (styleEl && styleEl.parentNode) {
          styleEl.parentNode.removeChild(styleEl);
          styleEl = null;
        }
      },
    },
  };
};

export default createCustomEffectsPlugin;
