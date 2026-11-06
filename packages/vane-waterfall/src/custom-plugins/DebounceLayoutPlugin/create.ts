import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type DebounceConfig = {
  /** 布局防抖延迟（ms） */
  delay: number;
};

/**
 * DebounceLayoutPlugin - 调整核心布局的防抖延迟
 */
// T 默认 unknown：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createDebounceLayoutPlugin<T = unknown>(config: DebounceConfig): WaterfallPlugin<T> {
  return {
    name: "DebounceLayoutPlugin",
    priority: 75,
    enabled: true,
    hooks: {
      transformProps: (props) => {
        return { ...props, debounceDelay: config.delay };
      },
    },
  };
}
