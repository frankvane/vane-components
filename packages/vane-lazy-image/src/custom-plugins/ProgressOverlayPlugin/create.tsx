import type { LazyImagePlugin } from "../../components/LazyLoadImagePlugin/plugins/types";

import { ProgressOverlayView } from "./internal";

export interface ProgressOverlayConfig {
  showWhen?: "always" | "loading";
  height?: number; // 进度条高度
  color?: string; // 进度条颜色
  background?: string; // 背景遮罩色
  showPercentText?: boolean; // 是否显示百分比文本
}

export function createProgressOverlayPlugin(
  config: ProgressOverlayConfig = {}
): LazyImagePlugin {
  return {
    name: "progress-overlay",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: ({ bus, imageState }) => {
        return (
          <ProgressOverlayView
            bus={bus}
            loading={imageState.isLoading}
            showWhen={config.showWhen}
            height={config.height}
            color={config.color}
            background={config.background}
            showPercentText={config.showPercentText ?? true}
          />
        );
      },
      onProgress: () => {
        // 已由视图订阅总线进度，这里无需额外处理
      },
    },
  };
}
