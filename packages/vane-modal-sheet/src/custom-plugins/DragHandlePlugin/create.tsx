import type { CSSProperties } from "react";
import type { PluginDoc } from "vane-plugin-core";
import type { ModalSheetPluginCreator } from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface DragHandlePluginConfig {
  /** 指示条颜色 */
  color?: string;
  /** 指示条宽度 px（默认 36） */
  width?: number;
}

/**
 * 拖拽指示条：视觉提示 + 默认拖拽面（getDragProps 注册给内核）。
 * priority 20（renderHandle 槽）。
 */
export const createDragHandlePlugin: ModalSheetPluginCreator<DragHandlePluginConfig> = (
  config = {}
) => {
  const { color, width = 36 } = config;

  return {
    name: "drag-handle",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 20,
    hooks: {
      renderHandle: (ctx) => {
        const drag = ctx.getDragProps();
        const placement = ctx.props.placement ?? "bottom";
        const horizontal = placement === "left" || placement === "right";
        // 把手永远在「朝内容一侧」的内边缘：
        // bottom → 面板顶部横条；top → 面板底部横条（flex order 排到末尾）；
        // left → 面板右边缘竖条；right → 面板左边缘竖条。
        const wrapStyle: CSSProperties = horizontal
          ? {
              position: "absolute",
              top: 0,
              bottom: 0,
              ...(placement === "left" ? { right: 0 } : { left: 0 }),
              width: 22,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "grab",
            }
          : {
              display: "flex",
              justifyContent: "center",
              flexShrink: 0,
              cursor: "grab",
              // 顶部方位：把手排到 flex 末尾（footer 之后），贴住面板下边缘
              order: placement === "top" ? 99 : 0,
              padding: placement === "top" ? "4px 0 10px" : "10px 0 4px",
              background: "var(--vane-modal-sheet-bg, #ffffff)",
              color: "var(--vane-modal-sheet-ink, #1f2329)",
            };
        return (
          <div
            {...drag}
            data-vane-ms-handle=""
            style={{ ...drag.style, ...wrapStyle }}
          >
            <div
              style={{
                width: horizontal ? 4 : width,
                height: horizontal ? width : 4,
                borderRadius: 999,
                pointerEvents: "none",
                background:
                  color ?? "var(--vane-modal-sheet-handle, #6b7280)",
              }}
            />
          </div>
        );
      },
    },
  };
};

createDragHandlePlugin.meta = doc as PluginDoc;
