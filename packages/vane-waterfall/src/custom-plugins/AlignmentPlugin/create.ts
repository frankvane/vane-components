import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type AlignmentMode = "shortest" | "balanced" | "sequential";

export type AlignmentConfig = {
  /** 列分配策略 */
  mode: AlignmentMode;
};

/**
 * AlignmentPlugin - 控制瀑布流列分配策略
 * 通过设置 props.alignmentMode 来影响核心布局算法的列选择逻辑
 */
// T 默认 unknown：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createAlignmentPlugin<T = unknown>(config: AlignmentConfig): WaterfallPlugin<T> {
  return {
    name: "AlignmentPlugin",
    priority: 60,
    enabled: true,
    hooks: {
      transformProps: (props) => {
        return { ...props, alignmentMode: config.mode };
      },
      onResize: (context) => {
        context.relayout?.();
      },
    },
  };
}
