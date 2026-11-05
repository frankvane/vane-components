import React from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import { ShareButton } from "./ShareButton";
import doc from "./doc.json";

/**
 * SharePlugin - 分享：每条评论操作行渲染分享按钮，复制锚点链接。
 *
 * 泛型默认值保留 any：跨包契约位（第三方可传自定义 data 形态，收紧会让既有调用方 tsc 失败）。
 */
export function createSharePlugin<T = any>(): CommentPlugin<T> {
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
