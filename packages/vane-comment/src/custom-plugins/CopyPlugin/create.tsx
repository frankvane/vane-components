import React from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import { CopyButton } from "./CopyButton";
import doc from "./doc.json";

/**
 * CopyPlugin - 复制：每条评论操作行渲染复制按钮，复制评论纯文本。
 *
 * 泛型默认值保留 any：跨包契约位（第三方可传自定义 data 形态，收紧会让既有调用方 tsc 失败）。
 */
export function createCopyPlugin<T = any>(): CommentPlugin<T> {
  return {
    name: "CopyPlugin",
    version: "0.1.0",
    description: "复制：每条评论操作行渲染复制按钮，复制评论纯文本到剪贴板。",
    priority: 24,
    enabled: true,
    hooks: {
      renderCommentActions: (
        context: CommentPluginContext<T>,
        comment: Comment
      ) => <CopyButton comment={comment} />,
    },
  };
}

export { doc };
