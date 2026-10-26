import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type GapConfig = {
  /** 列间距（像素） */
  columnGap?: number;
  /** 行间距（像素） */
  rowGap?: number;
  /** 响应式：根据窗口宽度覆盖间距 */
  responsive?: {
    sm?: { columnGap?: number; rowGap?: number };
    md?: { columnGap?: number; rowGap?: number };
    lg?: { columnGap?: number; rowGap?: number };
    xl?: { columnGap?: number; rowGap?: number };
  };
};

function pickResponsive(config: GapConfig): { columnGap?: number; rowGap?: number } {
  const w = typeof window !== "undefined" ? window.innerWidth : 1024;
  const r = config.responsive || {};
  if (w >= 1200 && r.xl) return r.xl;
  if (w >= 992 && r.lg) return r.lg;
  if (w >= 768 && r.md) return r.md;
  if (r.sm) return r.sm;
  return {};
}

/**
 * GapPlugin - 控制瀑布流的列间距和行间距，支持响应式
 */
export function createGapPlugin<T = any>(config: GapConfig): WaterfallPlugin<T> {
  return {
    name: "GapPlugin",
    priority: 50,
    enabled: true,
    hooks: {
      transformProps: (props) => {
        const base = { columnGap: config.columnGap, rowGap: config.rowGap };
        const override = pickResponsive(config);
        const next = {
          columnGap: override.columnGap ?? base.columnGap ?? props.columnGap,
          rowGap: override.rowGap ?? base.rowGap ?? props.rowGap,
        };
        return { ...props, ...next };
      },
      onResize: (context) => {
        context.relayout?.();
      },
    },
  };
}
