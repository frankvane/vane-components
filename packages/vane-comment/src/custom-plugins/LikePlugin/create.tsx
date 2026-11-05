import React from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import { LikeButton } from "./LikeButton";
import doc from "./doc.json";

export interface LikePluginConfig {
  /** 是否展示点赞数，默认 true */
  showCount?: boolean;
}

/**
 * LikePlugin - 点赞：渲染于每条评论的 `renderCommentActions` 槽。
 * 读取 comment.liked / likeCount，点击回调 context.props.onLike（乐观更新由 consumer 完成）。
 *
 * 泛型默认值保留 any：跨包契约位（第三方可传自定义 data 形态，收紧会让既有调用方 tsc 失败）。
 */
export function createLikePlugin<T = any>(
  config: LikePluginConfig = {}
): CommentPlugin<T> {
  return {
    name: "LikePlugin",
    version: "0.1.0",
    description: "点赞：每条评论的操作行渲染点赞按钮与计数，点击回调 onLike。",
    priority: 40,
    enabled: true,
    hooks: {
      renderCommentActions: (
        context: CommentPluginContext<T>,
        comment: Comment
      ) => (
        <LikeButton
          comment={comment}
          showCount={config.showCount}
          onLike={context.props.onLike as (id: string, next: boolean) => void}
        />
      ),
    },
  };
}

export { doc };
