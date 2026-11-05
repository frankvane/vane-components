import type {
  WaterfallPlugin,
  WaterfallPluginContext,
} from "../../components/WaterfallPlugin/plugins/types";

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

/**
 * 按**容器宽度**选响应式档位。
 *
 * 旧实现读 `window.innerWidth`：容器比窗口窄时（侧栏、双栏、抽屉里）选错档 ——
 * 窗口 1400 但容器只有 700，仍然套 xl 的间距（P2-5）。
 */
function pickResponsive(
  config: GapConfig,
  width: number
): { columnGap?: number; rowGap?: number } {
  const r = config.responsive || {};
  if (width >= 1200 && r.xl) return r.xl;
  if (width >= 992 && r.lg) return r.lg;
  if (width >= 768 && r.md) return r.md;
  // sm 是「小屏档」，不是「兜底档」：早先这里无条件返回 sm，导致只配了 sm 时
  // 桌面端也被窄屏间距覆盖 —— 显式传进来的 columnGap / rowGap 永远不生效，
  // 调参时看着像插件没接上。
  if (width < 768 && r.sm) return r.sm;
  return {};
}

/**
 * GapPlugin - 控制瀑布流的列间距和行间距，支持响应式
 */
// T 默认 any：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createGapPlugin<T = any>(config: GapConfig): WaterfallPlugin<T> {
  // transformProps 拿不到 context，容器宽度只能由钩子写进来
  let containerWidth = 0;
  let tierSignature = "";

  const syncWidth = (context: WaterfallPluginContext<T>) => {
    const width = context.containerRef?.current?.clientWidth ?? 0;
    if (width <= 0) return;
    const previousWidth = containerWidth;
    containerWidth = width;
    const signature = JSON.stringify(pickResponsive(config, width));
    if (previousWidth > 0 && signature !== tierSignature) {
      // props 没变但档位换了：请 HOC 重算 transformProps，
      // 否则间距会一直停在旧档（render 时 props 引用不变 → transformProps 缓存命中）
      context.bus?.emit("props:invalidate");
    }
    tierSignature = signature;
  };

  return {
    name: "GapPlugin",
    priority: 50,
    enabled: true,
    hooks: {
      transformProps: (props) => {
        const width =
          containerWidth > 0
            ? containerWidth
            : typeof window !== "undefined"
              ? window.innerWidth
              : 1024;
        const base = { columnGap: config.columnGap, rowGap: config.rowGap };
        const override = pickResponsive(config, width);
        const next = {
          columnGap: override.columnGap ?? base.columnGap ?? props.columnGap,
          rowGap: override.rowGap ?? base.rowGap ?? props.rowGap,
        };
        return { ...props, ...next };
      },
      onMount: (context) => {
        syncWidth(context);
      },
      onResize: (context) => {
        // 档位变化由 syncWidth 通过 props:invalidate 触发重排；
        // 档位没变时 Core 自己的 ResizeObserver 已经会重排，这里不再叠加一次
        syncWidth(context);
      },
    },
  };
}
