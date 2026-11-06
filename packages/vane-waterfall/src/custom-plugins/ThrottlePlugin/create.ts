import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type ThrottleConfig = {
  /** 滚动节流（ms） */
  scroll: number;
  /** 尺寸变化防抖（ms），用于容器 Resize 相关 */
  resize?: number;
};

/**
 * ThrottlePlugin - 通过 transformProps 调整核心的滚动节流与尺寸变化防抖
 */
// T 默认 unknown：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createThrottlePlugin<T = unknown>(config: ThrottleConfig): WaterfallPlugin<T> {
  return {
    name: "ThrottlePlugin",
    priority: 80,
    enabled: true,
    hooks: {
      transformProps: (props) => {
        return {
          ...props,
          throttleDelay: config.scroll,
          debounceDelay: config.resize ?? props.debounceDelay,
        };
      },
    },
  };
}
