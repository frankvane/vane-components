import type {
  WaterfallPlugin,
  WaterfallPluginContext,
} from "../../components/WaterfallPlugin/plugins/types";

export type DragReorderConfig<T = any> = {
  /** 是否启用（默认 true） */
  enabled?: boolean;
  /**
   * 松手时的重排回调。插件只负责"拖"与"从哪到哪"，
   * 数组怎么改由调用方决定（就地 splice / 走接口 / 写回 store）。
   */
  onReorder?: (from: number, to: number, item: T | undefined) => void;
  /** 是否显示虚线边框提示可拖（默认 false，接入真实版式时基本都要关） */
  showHandle?: boolean;
};

/**
 * DragReorderPlugin - 原生 HTML5 拖拽重排。
 *
 * 旧版只把 from/to 写进 sharedData 就结束了，`onReorder` 根本不存在，
 * 页面拿不到任何回调（"占位：仅记录"写在注释里）。这里补上真回调，
 * 并顺手统一了 `renderItemWrapper` 的参数顺序（旧版与 A11yPlugin 相反）。
 */
export function createDragReorderPlugin<T = any>(
  config: DragReorderConfig<T> = {}
): WaterfallPlugin<T> {
  const enabled = config.enabled ?? true;
  const showHandle = config.showHandle ?? false;

  const handleDrop = (context: WaterfallPluginContext<T>, to: number, raw: string) => {
    const from = Number(raw);
    if (!Number.isFinite(from) || from === to) return;
    context.sharedData.set("drag-from", from);
    context.sharedData.set("drag-to", to);
    context.bus.emit("drag:reorder", { from, to });
    const items = context.props.items as T[] | undefined;
    config.onReorder?.(from, to, items?.[from]);
  };

  return {
    name: "DragReorderPlugin",
    enabled,
    hooks: {
      renderItemWrapper: (context, node, index) => {
        if (!enabled) return node;
        return (
          <div
            draggable
            onDragStart={(event: React.DragEvent) => {
              event.dataTransfer?.setData("text/plain", String(index));
              context.sharedData.set("drag-from", index);
            }}
            onDragOver={(event: React.DragEvent) => {
              // 不 preventDefault 就不会触发 drop
              event.preventDefault();
            }}
            onDrop={(event: React.DragEvent) => {
              event.preventDefault();
              handleDrop(context, index, event.dataTransfer?.getData("text/plain") ?? "");
            }}
            style={{
              cursor: "grab",
              ...(showHandle
                ? { border: "1px dashed #bdbdbd", borderRadius: 6 }
                : null),
            }}
          >
            {node}
          </div>
        );
      },
    },
  };
}
