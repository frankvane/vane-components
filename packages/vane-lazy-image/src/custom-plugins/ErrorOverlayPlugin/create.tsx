import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import { ErrorOverlayView } from "./internal";

export interface ErrorOverlayConfig {
  message?: string | ((context: LazyImageContext) => string);
  background?: string;
  color?: string;
  zIndex?: number;
  showRetry?: boolean;
  retryText?: string;
  // 是否在回退图片加载成功后仍显示错误覆盖层
  persistAfterFallback?: boolean;
}

export function createErrorOverlayPlugin(config: ErrorOverlayConfig = {}): LazyImagePlugin {
  return {
    name: "error-overlay",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context) => <ErrorOverlayView context={context} cfg={config} />,
    },
  };
}
