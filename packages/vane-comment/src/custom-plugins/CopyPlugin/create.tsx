import React from "react";
import type {
  CommentData,
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import { CopyButton } from "./CopyButton";
import doc from "./doc.json";

/**
 * CopyPlugin - 复制：每条评论操作行渲染复制按钮，复制评论纯文本。
 *
 * 泛型默认值收敛为 CommentData（真实领域数据类型）；自定义 data 形态的调用方请显式写泛型参数。
 */
export function createCopyPlugin<T = CommentData>(): CommentPlugin<T> {
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
