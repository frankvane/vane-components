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
export function createAlignmentPlugin<T = any>(config: AlignmentConfig): WaterfallPlugin<T> {
  return {
    name: "AlignmentPlugin",
    priority: 60,
    enabled: true,
    hooks: {
      transformProps: (props) => {
        return { ...props, alignmentMode: config.mode } as any;
      },
      onResize: (context) => {
        context.relayout?.();
      },
    },
  };
}
