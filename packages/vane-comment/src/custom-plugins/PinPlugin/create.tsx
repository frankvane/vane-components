import React from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import { PinButton } from "./PinButton";
import doc from "./doc.json";

/**
 * PinPlugin - 置顶：每条评论操作行渲染置顶按钮，切换回调 onPin；Core 读取 comment.pinned 渲染置顶标。
 *
 * 泛型默认值保留 any：跨包契约位（第三方可传自定义 data 形态，收紧会让既有调用方 tsc 失败）。
 */
export function createPinPlugin<T = any>(): CommentPlugin<T> {
  return {
    name: "PinPlugin",
    version: "0.1.0",
    description:
      "置顶：每条评论操作行渲染置顶按钮，切换回调 onPin(id, nextPinned)；Core 读取 comment.pinned 渲染置顶标。",
    priority: 27,
    enabled: true,
    hooks: {
      renderCommentActions: (
        context: CommentPluginContext<T>,
        comment: Comment
      ) => (
        <PinButton
          comment={comment}
          onPin={context.props.onPin as (id: string, next: boolean) => void}
        />
      ),
    },
  };
}

export { doc };
