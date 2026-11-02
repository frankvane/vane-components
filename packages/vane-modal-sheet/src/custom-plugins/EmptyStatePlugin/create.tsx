import React from "react";
import type {
  ModalSheetPluginContext,
  ModalSheetPluginCreator,
} from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface EmptyStatePluginConfig {
  /** 内容是否为空（业务侧受控传入） */
  empty?: boolean;
  /** 占位文案（默认「暂无内容」） */
  text?: string;
  /** 引导按钮文案（不传则不渲染） */
  actionText?: string;
  /** 引导按钮点击 */
  onAction?: () => void;
}

/**
 * 空态占位：empty 时内容区覆盖占位提示与引导动作。
 * priority 88（反馈带）。
 */
export const createEmptyStatePlugin: ModalSheetPluginCreator<EmptyStatePluginConfig> = (
  config = {}
) => {
  const { empty = false, text = "暂无内容", actionText, onAction } = config;

  return {
    name: "empty-state",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 88,
    hooks: {
      onPropsChange: (ctx: ModalSheetPluginContext) => {
        ctx.forceUpdate();
      },
      renderOverlay: () => {
        if (!empty) return null;
        return (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--vane-modal-sheet-bg, #ffffff)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              zIndex: 4,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#f1f3f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                color: "#7c8288",
              }}
            >
              ⌀
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "#5d636a" }}>{text}</p>
            {actionText ? (
              <button
                type="button"
                onClick={onAction}
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: "var(--vane-modal-sheet-primary, #1f2329)",
                  color: "#ffffff",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {actionText}
              </button>
            ) : null}
          </div>
        );
      },
    },
  };
};

createEmptyStatePlugin.meta = doc as import("vane-plugin-core").PluginDoc;
