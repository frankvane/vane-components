import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

import { AnimatedCursorOverlay } from "./internal";

export interface AnimatedCursorConfig {
  /** 光标样式 */
  style?:
    | "zoom-in"
    | "zoom-out"
    | "pointer"
    | "crosshair"
    | "move"
    | "grab"
    | "custom-dot"
    | "custom-ring"
    | "custom-plus"
    | "none";
  /** 是否启用跟随光标 */
  enableFollower?: boolean;
  /** 跟随光标颜色 */
  followerColor?: string;
  /** 跟随光标大小（px） */
  followerSize?: number;
  /** 跟随延迟系数（0~1，越大越跟手） */
  followerDelay?: number;
  /** 悬停时跟随光标缩放 */
  scaleOnHover?: boolean;
  /** 悬停缩放比例 */
  hoverScale?: number;
  /** 自定义光标图标 URL */
  customIcon?: string;
  /** 光标附带文字 */
  cursorText?: string;
  /** 点击时产生涟漪 */
  showRipple?: boolean;
}

/**
 * AnimatedCursorPlugin — 自定义光标与跟随动画（纯 CSS + JS，无依赖）。
 */
export function createAnimatedCursorPlugin(
  config: AnimatedCursorConfig = {}
): LazyImagePlugin {
  return {
    name: "animated-cursor",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => (
        <AnimatedCursorOverlay config={config} context={context} />
      ),
    },
  };
}
