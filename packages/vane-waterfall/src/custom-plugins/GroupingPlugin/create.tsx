import type {
  WaterfallPlugin,
  WaterfallPluginContext,
} from "../../components/WaterfallPlugin/plugins/types";

/** T 默认 unknown：与 plugins/types.ts 的泛型默认值说明同源（配置类型常被简写引用） */
export type GroupingConfig<T = unknown> = {
  /** 分组函数，返回组键（默认取 item.category） */
  groupBy?: (item: T, index: number) => string | number;
  /** 是否显示分组统计角标（默认 false） */
  showOverlay?: boolean;
};

const KEY = "GROUPS";
/** index → 组键：吸顶条据此显示「当前可见项」所属的分组（见 StickyHeaderPlugin） */
const INDEX_KEY = "GROUP_INDEX";

/**
 * GroupingPlugin - 按字段把项分组，结果写进 `sharedData.get("GROUPS")`。
 *
 * 旧版只在 `onPropsChange` 里算，而挂载时不会触发 props 变化 → **首屏永远拿不到分组**，
 * 吸顶条只能显示写死的标题。这里改成挂载即算，并在 items 变化与布局完成时重算，
 * 同时把结果 emit 出去（`grouping:change`），页面不用轮询 sharedData。
 */
// T 默认 unknown：见 components/WaterfallPlugin/plugins/types.ts 的「泛型默认值说明」
export function createGroupingPlugin<T = unknown>(
  config: GroupingConfig<T> = {}
): WaterfallPlugin<T> {
  const groupBy: (item: T, index: number) => string | number =
    config.groupBy ??
    ((item) =>
      (item as unknown as { category?: string | number } | null | undefined)?.category ??
      "default");
  const showOverlay = config.showOverlay ?? false;

  /** 上一次的输入集合：items 引用不变就不重算（onLayoutComplete 每次布局都会调到这里，P2-7） */
  let cachedItems: unknown[] | null = null;
  let cachedGroups: Map<string | number, number[]> | null = null;

  const sameGroups = (a: Map<string | number, number[]>, b: Map<string | number, number[]>) => {
    if (a.size !== b.size) return false;
    for (const [key, list] of a) {
      const other = b.get(key);
      if (!other || other.length !== list.length) return false;
    }
    return true;
  };

  const compute = (context: WaterfallPluginContext<T>) => {
    // 用「渲染集合」而不是原始 props：分页 / 筛选 / 排序之后，分组必须跟着渲染结果走
    const items = context.items ?? [];
    if (cachedGroups && cachedItems === items) return cachedGroups;

    const groups = new Map<string | number, number[]>();
    const indexMap = new Map<number, string | number>();
    items.forEach((item, index) => {
      const key = groupBy(item as T, index);
      indexMap.set(index, key);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(index);
    });

    const changed = cachedGroups ? !sameGroups(groups, cachedGroups) : true;
    cachedItems = items;
    cachedGroups = groups;
    context.sharedData.set(KEY, groups);
    context.sharedData.set(INDEX_KEY, indexMap);
    // 结果没变就不 emit：旧实现每次布局都广播一次，订阅方跟着做无意义的重渲染（P2-7）
    if (changed && groups.size > 0) context.bus.emit("grouping:change", { groups });
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
        // value 形状由本插件的 key 约定决定（compute 写入），读取处断言
        const groups: Map<string | number, number[]> =
          (context.sharedData.get(KEY) as Map<string | number, number[]> | undefined) ??
          new Map();
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
