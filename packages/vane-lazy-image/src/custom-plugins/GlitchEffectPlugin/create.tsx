import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

import { GlitchOverlay } from "./internal";

export interface GlitchEffectConfig {
  /** 故障风格 */
  style?: "rgb-split" | "scan-lines" | "digital" | "glitch-mix" | "intense";
  /** 是否持续动画 */
  continuous?: boolean;
  /** 一次性触发时长（毫秒，非持续模式） */
  duration?: number;
  /** 效果强度 0~1 */
  intensity?: number;
  /** 是否悬停触发 */
  triggerOnHover?: boolean;
  /** RGB 分离距离（px） */
  rgbOffset?: number;
  /** 扫描线数量 */
  scanLineCount?: number;
  /** 扫描线是否动画 */
  animateScanLines?: boolean;
}

/**
 * GlitchEffectPlugin — 赛博朋克故障艺术效果（纯 CSS，无依赖）。
 */
export function createGlitchEffectPlugin(
  config: GlitchEffectConfig = {}
): LazyImagePlugin {
  return {
    name: "glitch-effect",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => (
        <GlitchOverlay config={config} context={context} />
      ),
    },
  };
}
