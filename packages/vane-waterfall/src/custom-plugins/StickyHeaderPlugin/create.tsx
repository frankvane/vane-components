import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export type StickyHeaderConfig = {
  /** 标题文案（默认 "分组标题"） */
  title?: string;
  /** 是否显示「向下滚动观察」提示（默认 false） */
  showHint?: boolean;
};

/**
 * StickyHeaderPlugin - 吸顶标题（实验版）
 * - 简化实现：始终显示一个吸顶条，可与 GroupingPlugin 联动
 */
// T 默认 unknown：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createStickyHeaderPlugin<T = unknown>(config: StickyHeaderConfig = {}): WaterfallPlugin<T> {
  const title = config.title || "分组标题";
  const showHint = config.showHint ?? false;
  return {
    name: "StickyHeaderPlugin",
    enabled: true,
    hooks: {
      renderOverlay: (context) => {
        // value 形状由 GroupingPlugin 的 key 约定决定（GROUPS / GROUP_INDEX），读取处断言
        const groups: Map<string | number, number[]> =
          (context.sharedData?.get("GROUPS") as Map<string | number, number[]> | undefined) ||
          new Map();
        const indexMap: Map<number, string | number> | undefined =
          context.sharedData?.get("GROUP_INDEX") as Map<number, string | number> | undefined;
        // 吸顶条跟着「当前可见的第一个项」所属分组走；旧实现恒取第一个组，
        // 滚到后面的分组时标题一直不变（P2-7）
        const start = context.visibleRange?.start ?? 0;
        const activeKey = indexMap?.get(start);
        const firstKey =
          activeKey ??
          (groups.size > 0 ? Array.from(groups.keys())[0] : undefined);
        return (
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 20,
              background: "#111827",
              color: "#fff",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              padding: "10px 14px",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {title} {firstKey !== undefined ? `：${String(firstKey)}` : ""}
            {showHint ? (
              <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}>
                向下滚动观察吸顶
              </span>
            ) : null}
          </div>
        );
      },
    },
  };
}
