import type { CardPlugin, PluginCreator } from "../../plugins/types";

export interface ResponsivePluginConfig {
  breakpoints?: { mobile: number; tablet: number; desktop: number };
  layouts?: { mobile?: "vertical" | "horizontal"; tablet?: "vertical" | "horizontal"; desktop?: "vertical" | "horizontal" };
  containerStyles?: { mobile?: React.CSSProperties; tablet?: React.CSSProperties; desktop?: React.CSSProperties };
}

export const createResponsivePlugin: PluginCreator<any, ResponsivePluginConfig> = (
  config = {}
) => {
  const {
    breakpoints = { mobile: 600, tablet: 900, desktop: 1200 },
    layouts = { mobile: "vertical", tablet: "vertical", desktop: "horizontal" },
    containerStyles = {},
  } = config;

  const applyLayout = (container: HTMLDivElement | null, width: number) => {
    if (!container) return;

    const isMobile = width <= breakpoints.mobile;
    const isTablet = width > breakpoints.mobile && width <= breakpoints.tablet;
    const layout = isMobile ? layouts.mobile : isTablet ? layouts.tablet : layouts.desktop;

    // 基础样式：平滑过渡
    container.style.transition = container.style.transition || "all 0.2s ease";

    // 布局方向标记（供外层样式选择器使用）
    container.setAttribute("data-layout", layout || "vertical");

    // 注入常用容器样式（可选）
    const styleByBp = isMobile
      ? containerStyles.mobile
      : isTablet
      ? containerStyles.tablet
      : containerStyles.desktop;
    if (styleByBp) {
      Object.assign(container.style, styleByBp);
    }
  };

  const plugin: CardPlugin = {
    name: "ResponsivePlugin",
    version: "1.0.0",
    description: "根据卡片尺寸切换布局与样式",
    priority: 80,
    hooks: {
      onMount: (context) => {
        const size = context.getSize();
        applyLayout(context.getContainer(), size.width);
      },
      onResize: (context, width) => {
        applyLayout(context.getContainer(), width);
      },
      transformProps: (props) => {
        // 在 props 层加入响应式基础样式，避免闪烁
        return {
          ...props,
          containerStyle: {
            boxSizing: "border-box",
            width: "100%",
            ...props.containerStyle,
          },
        };
      },
    },
    config,
  };

  return plugin;
};