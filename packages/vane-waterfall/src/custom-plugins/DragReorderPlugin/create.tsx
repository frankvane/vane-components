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
  /**
   * 触屏长按多久进入拖拽（ms，默认 180）。
   *
   * 触摸设备上 `draggable` 不生效，必须走 pointer 事件；但 pointer 一动就是滚动，
   * 所以用「长按」区分「想滚」和「想拖」。设 0 则不需要长按。
   */
  touchHoldMs?: number;
};

/** 拖动中的目标项高亮用的属性名（CSS 侧 `[data-drag-over]`） */
const OVER_ATTR = "data-drag-over";

/** 从坐标反查落在哪个 item 上（核心容器的项带 data-index） */
function indexAtPoint(x: number, y: number): number | null {
  if (typeof document === "undefined") return null;
  const hit = document.elementFromPoint(x, y) as HTMLElement | null;
  const host = hit?.closest?.("[data-index]") as HTMLElement | null;
  if (!host) return null;
  const index = Number(host.getAttribute("data-index"));
  return Number.isFinite(index) ? index : null;
}

/**
 * DragReorderPlugin - 拖拽重排。
 *
 * 两条输入路径，各管一半设备：
 *  - **鼠标**：原生 HTML5 `dragstart/dragover/drop`。别改它，改成 pointer 反而会
 *    和 Core 的滚动、文本选择打架；
 *  - **触屏 / 触控笔**：`pointerdown` + 长按（默认 180ms）进入拖拽，移动时用
 *    `elementFromPoint` 找落点。触摸设备上 `draggable` 根本不触发，旧版因此在手机上完全失效。
 *
 * 旧版还有个大坑：只把 from/to 写进 sharedData 就结束了，`onReorder` 不存在，
 * 页面拿不到任何回调（注释里写着"占位：仅记录"）。这里补上真回调。
 */
export function createDragReorderPlugin<T = any>(
  config: DragReorderConfig<T> = {}
): WaterfallPlugin<T> {
  const enabled = config.enabled ?? true;
  const showHandle = config.showHandle ?? false;
  const touchHoldMs = config.touchHoldMs ?? 180;

  const handleDrop = (context: WaterfallPluginContext<T>, to: number, raw: string) => {
    const from = Number(raw);
    if (!Number.isFinite(from) || from === to) return;
    context.sharedData.set("drag-from", from);
    context.sharedData.set("drag-to", to);
    context.bus.emit("drag:reorder", { from, to });
    const items = context.props.items as T[] | undefined;
    config.onReorder?.(from, to, items?.[from]);
  };

  /** 清掉拖拽高亮 */
  const clearOver = () => {
    document.querySelectorAll(`[${OVER_ATTR}]`).forEach((el) => el.removeAttribute(OVER_ATTR));
  };

  /** 清掉高亮与拖拽期间的样式副作用 */
  const clearVisual = () => {
    if (typeof document === "undefined") return;
    clearOver();
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  const beginPointerDrag = (
    event: React.PointerEvent,
    index: number,
    context: WaterfallPluginContext<T>
  ) => {
    // 鼠标交给上面的 HTML5 路径：两条都开会在拖拽开始时互相打断
    if (event.pointerType === "mouse") return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startedAt = Date.now();
    let active = false;
    let lastOver: number | null = null;

    const onMove = (e: PointerEvent) => {
      if (!active) {
        // 触摸必须先满足「长按」：否则一滑就变成拖拽，页面滚不动
        const held = Date.now() - startedAt >= touchHoldMs;
        const moved = Math.hypot(e.clientX - startX, e.clientY - startY) >= 6;
        if (!held || !moved) return;
        active = true;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";
      }
      e.preventDefault();
      const over = indexAtPoint(e.clientX, e.clientY);
      if (over === lastOver) return;
      clearOver();
      lastOver = over;
      if (over != null) {
        const host = document.querySelector(`[data-index="${over}"]`);
        host?.setAttribute(OVER_ATTR, "");
      }
    };

    const onUp = (e: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      clearVisual();
      if (!active) return;
      const over = indexAtPoint(e.clientX, e.clientY);
      if (over != null) handleDrop(context, over, String(index));
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
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
            onDragEnter={() => {
              const host = document.querySelector(`[data-index="${index}"]`);
              host?.setAttribute(OVER_ATTR, "");
            }}
            onDragLeave={() => {
              const host = document.querySelector(`[data-index="${index}"]`);
              host?.removeAttribute(OVER_ATTR);
            }}
            onDrop={(event: React.DragEvent) => {
              event.preventDefault();
              clearVisual();
              handleDrop(context, index, event.dataTransfer?.getData("text/plain") ?? "");
            }}
            onDragEnd={clearVisual}
            // 触屏路径：移动端 HTML5 拖拽不触发，只能自己实现
            onPointerDown={(event: React.PointerEvent) => beginPointerDrag(event, index, context)}
            style={{
              cursor: "grab",
              ...(showHandle ? { border: "1px dashed #bdbdbd", borderRadius: 6 } : null),
            }}
          >
            {node}
          </div>
        );
      },
    },
  };
}
