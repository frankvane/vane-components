import type {
  WaterfallPlugin,
  WaterfallPluginContext,
} from "../../components/WaterfallPlugin/plugins/types";

export type GroupingConfig<T = any> = {
  /** 分组函数，返回组键（默认取 item.category） */
  groupBy?: (item: T, index: number) => string | number;
  /** 是否显示分组统计角标（默认 false） */
  showOverlay?: boolean;
};

const KEY = "GROUPS";

/**
 * GroupingPlugin - 按字段把项分组，结果写进 `sharedData.get("GROUPS")`。
 *
 * 旧版只在 `onPropsChange` 里算，而挂载时不会触发 props 变化 → **首屏永远拿不到分组**，
 * 吸顶条只能显示写死的标题。这里改成挂载即算，并在 items 变化与布局完成时重算，
 * 同时把结果 emit 出去（`grouping:change`），页面不用轮询 sharedData。
 */
export function createGroupingPlugin<T = any>(
  config: GroupingConfig<T> = {}
): WaterfallPlugin<T> {
  const groupBy =
    config.groupBy ?? ((item: any) => item?.category ?? "default");
  const showOverlay = config.showOverlay ?? false;

  const compute = (context: WaterfallPluginContext<T>) => {
    const groups = new Map<string | number, number[]>();
    (context.props.items ?? []).forEach((item, index) => {
      const key = groupBy(item as T, index);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(index);
    });
    context.sharedData.set(KEY, groups);
    if (groups.size > 0) context.bus.emit("grouping:change", { groups });
    return groups;
  };

  return {
    name: "GroupingPlugin",
    enabled: true,
    hooks: {
      onMount: (context) => {
        compute(context);
      },
      onLayoutComplete: (context) => {
        compute(context);
      },
      onPropsChange: (context) => {
        compute(context);
      },
      renderOverlay: (context) => {
        if (!showOverlay) return null;
        const groups: Map<string | number, number[]> =
          context.sharedData.get(KEY) ?? new Map();
        if (groups.size === 0) return null;
        const entries = Array.from(groups.entries()).slice(0, 3);
        return (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 99,
              background: "#111827",
              color: "#fff",
              padding: "10px 12px",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.15)",
              minWidth: 150,
              fontSize: 12,
              pointerEvents: "none",
            }}
          >
            <div style={{ opacity: 0.85, marginBottom: 6 }}>分组：{groups.size} 组</div>
            {entries.map(([key, list]) => (
              <div key={String(key)}>
                {String(key)} · {list.length} 项
              </div>
            ))}
          </div>
        );
      },
    },
  };
}
