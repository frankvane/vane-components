import React from "react";
import type {
  CommentData,
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import { ShareButton } from "./ShareButton";
import doc from "./doc.json";

/**
 * SharePlugin - 分享：每条评论操作行渲染分享按钮，复制锚点链接。
 *
 * 泛型默认值收敛为 CommentData（真实领域数据类型）；自定义 data 形态的调用方请显式写泛型参数。
 */
export function createSharePlugin<T = CommentData>(): CommentPlugin<T> {
  return {
    name: "SharePlugin",
    version: "0.1.0",
    description: "分享：每条评论操作行渲染分享按钮，复制本条评论锚点链接到剪贴板。",
    priority: 23,
    enabled: true,
    hooks: {
      renderCommentActions: (
        context: CommentPluginContext<T>,
        comment: Comment
      ) => <ShareButton comment={comment} />,
    },
  };
}

export { doc };
