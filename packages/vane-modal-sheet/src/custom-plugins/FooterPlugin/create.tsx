import type { PluginDoc } from "vane-plugin-core";
import type { ModalSheetPluginCreator } from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface FooterPluginConfig {
  /** 主按钮文案；传函数时每次渲染求值，用于随页面状态变化的动态文案 */
  primaryText: string | (() => string);
  /** 主按钮点击 */
  onPrimary?: () => void;
  /** 次按钮文案（不传则不渲染） */
  secondaryText?: string;
  /** 次按钮点击 */
  onSecondary?: () => void;
  /** 主按钮加载态（拖拽锁定建议同时开启） */
  primaryLoading?: boolean;
}

/**
 * 吸底操作区：主/次按钮（44px 触达高度）。
 * priority 40（renderFooter 槽）。
 */
export const createFooterPlugin: ModalSheetPluginCreator<FooterPluginConfig> = (
  config = {} as FooterPluginConfig
) => {
  const {
    primaryText,
    onPrimary,
    secondaryText,
    onSecondary,
    primaryLoading = false,
  } = config;

  return {
    name: "footer",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 40,
    hooks: {
      renderFooter: () => (
        <div
          data-vane-ms-footer=""
          style={{
            display: "flex",
            gap: 12,
            padding:
              "12px 16px calc(12px + env(safe-area-inset-bottom, 0px))",
            borderTop: "1px solid #e5e7eb",
            flexShrink: 0,
            background: "var(--vane-modal-sheet-bg, #ffffff)",
          }}
        >
          {secondaryText !== undefined ? (
            <button
              type="button"
              onClick={onSecondary}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                border: "1px solid #d0d4d9",
                background: "#f1f3f5",
                color: "#1f2329",
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              {secondaryText}
            </button>
          ) : null}
          <button
            type="button"
            disabled={primaryLoading}
            onClick={onPrimary}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 10,
              border: "none",
              background: "var(--vane-modal-sheet-primary, #1f2329)",
              color: "#ffffff",
              fontSize: 15,
              cursor: primaryLoading ? "default" : "pointer",
              opacity: primaryLoading ? 1 : undefined,
            }}
          >
            {primaryLoading
              ? "处理中…"
              : typeof primaryText === "function"
                ? primaryText()
                : primaryText}
          </button>
        </div>
      ),
    },
  };
};

createFooterPlugin.meta = doc as PluginDoc;
