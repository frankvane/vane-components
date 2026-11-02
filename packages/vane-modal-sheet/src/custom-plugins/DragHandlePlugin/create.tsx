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
        return (
          <div
            {...drag}
            data-vane-ms-handle=""
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "10px 0 4px",
              flexShrink: 0,
              cursor: "grab",
              background: "var(--vane-modal-sheet-bg, #ffffff)",
              color: "var(--vane-modal-sheet-ink, #1f2329)",
            }}
          >
            <div
              style={{
                width,
                height: 4,
                borderRadius: 999,
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
