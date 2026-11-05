import type React from "react";

import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

import { ColorSwatchOverlay } from "./internal";

export interface ColorSwatchPluginConfig {
  maxColors?: number;
  showPalette?: boolean;
  position?: "bottom" | "overlay" | "bottom-center";
  onColorSelect?: (color: string) => void;
  swatchSize?: number;
  interactive?: boolean;
  style?: React.CSSProperties;
  showColorCode?: boolean;
  gap?: number;
}

export function createColorSwatchPlugin(
  config: ColorSwatchPluginConfig = {}
): LazyImagePlugin {
  return {
    name: "color-swatch",
    version: "1.0.0",
    config,
    hooks: {
      // 取色要读 canvas 像素：必须在图片加载前设置 crossOrigin，
      // 否则跨域图会被标记为 tainted，getImageData 直接抛 SecurityError。
      transformProps: (props) =>
        ({ ...props, crossOrigin: props.crossOrigin ?? "anonymous" }),
      onMount: (context: LazyImageContext) => {
        try {
          context.imageRef?.current?.setAttribute("crossOrigin", "anonymous");
        } catch {
          /* 同域图无需处理 */
        }
      },
      renderOverlay: (context: LazyImageContext) => {
        if (!context.imageState.isLoaded || !context.imageRef?.current)
          return null;
        return <ColorSwatchOverlay config={config} context={context} />;
      },
    },
  };
}
