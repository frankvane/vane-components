import React from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
} from "../../components/CommentPlugin/plugins/types";
import doc from "./doc.json";

/**
 * LoginPromptPlugin - 未登录引导：底部渲染登录引导条，回调 onLogin。
 */
export function createLoginPromptPlugin<T = any>(): CommentPlugin<T> {
  return {
    name: "LoginPromptPlugin",
    version: "0.1.0",
    description:
      "未登录引导：底部渲染「登录后参与评论」引导条，回调 onLogin；可与 RichComposerPlugin 同槽共存。",
    priority: 33,
    enabled: true,
    hooks: {
      renderFooter: (context: CommentPluginContext<T>) => (
        <div
          data-testid="comment-login-prompt"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 0",
            fontSize: 13,
          }}
        >
          <span>登录后参与评论，发表你的看法</span>
          <button
            type="button"
            onClick={() =>
              (context.props.onLogin as (() => void) | undefined)?.()
            }
            style={{
              border: "1px solid rgba(29,161,242,0.5)",
              borderRadius: 999,
              padding: "4px 14px",
              background: "transparent",
              color: "#1565c0",
              cursor: "pointer",
            }}
          >
            登录
          </button>
        </div>
      ),
    },
  };
}

export { doc };
