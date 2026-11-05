import React from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import { FavoriteButton } from "./FavoriteButton";
import doc from "./doc.json";

/**
 * FavoritePlugin - 收藏：每条评论操作行渲染收藏按钮，切换回调 onFavorite。
 *
 * 泛型默认值保留 any：跨包契约位（第三方可传自定义 data 形态，收紧会让既有调用方 tsc 失败）。
 */
export function createFavoritePlugin<T = any>(): CommentPlugin<T> {
  return {
    name: "FavoritePlugin",
    version: "0.1.0",
    description: "收藏：每条评论操作行渲染收藏按钮，切换回调 onFavorite(id, nextFavorited)。",
    priority: 26,
    enabled: true,
    hooks: {
      renderCommentActions: (
        context: CommentPluginContext<T>,
        comment: Comment
      ) => (
        <FavoriteButton
          comment={comment}
          onFavorite={
            context.props.onFavorite as (id: string, next: boolean) => void
          }
        />
      ),
    },
  };
}

export { doc };
