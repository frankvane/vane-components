import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

import { DepthMapOverlay } from "./internal";

export interface DepthMapConfig {
  /** 深度效果样式 */
  style?: "tilt" | "parallax" | "float" | "rotate-3d";
  /** 效果强度 0~1 */
  intensity?: number;
  /** 最大倾斜角度 */
  maxTilt?: number;
  /** 启用透视 */
  enablePerspective?: boolean;
  /** 透视距离（px） */
  perspective?: number;
  /** 启用光泽 */
  enableGlare?: boolean;
  /** 光泽颜色 */
  glareColor?: string;
  /** 光泽不透明度 0~1 */
  glareOpacity?: number;
  /** 启用阴影 */
  enableShadow?: boolean;
  /** 过渡时长（毫秒） */
  transitionDuration?: number;
  /** 离开时重置 */
  resetOnLeave?: boolean;
}

/**
 * DepthMapPlugin — 鼠标跟随的 3D 视差深度效果（纯 CSS transforms，无依赖）。
 */
export function createDepthMapPlugin(
  config: DepthMapConfig = {}
): LazyImagePlugin {
  return {
    name: "depth-map",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => (
        <DepthMapOverlay config={config} context={context} />
      ),
    },
  };
}
