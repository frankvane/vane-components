import type { PluginDoc } from "vane-plugin-core";
import type {
  ModalSheetPluginContext,
  ModalSheetPluginCreator,
} from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface HeaderPluginConfig {
  /** 标题文本；为空则只渲染关闭按钮 */
  title?: string;
  /** 是否显示关闭按钮（默认 true） */
  closable?: boolean;
}

/**
 * 标题栏：标题 + 关闭按钮，整行兼拖拽面。
 * priority 30（renderHeader 槽）。
 */
export const createHeaderPlugin: ModalSheetPluginCreator<HeaderPluginConfig> = (
  config = {}
) => {
  const { title = "", closable = true } = config;

  return {
    name: "header",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 30,
    hooks: {
      renderHeader: (ctx: ModalSheetPluginContext) => {
        if (!title && !closable) return null;
        const drag = ctx.getDragProps();
        return (
          <div
            {...drag}
            data-vane-ms-header=""
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 16px 8px",
              flexShrink: 0,
              background: "var(--vane-modal-sheet-bg, #ffffff)",
              color: "var(--vane-modal-sheet-ink, #1f2329)",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 16,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </div>
            {closable ? (
              <button
                type="button"
                aria-label="关闭"
                onClick={() => ctx.close()}
                style={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  borderRadius: 8,
                  background: "#f1f3f5",
                  color: "var(--vane-modal-sheet-ink, #1f2329)",
                  fontSize: 16,
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            ) : null}
          </div>
        );
      },
    },
  };
};

createHeaderPlugin.meta = doc as PluginDoc;
