import React from "react";
import type {
  CommentData,
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import { FavoriteButton } from "./FavoriteButton";
import doc from "./doc.json";

/**
 * FavoritePlugin - 收藏：每条评论操作行渲染收藏按钮，切换回调 onFavorite。
 *
 * 泛型默认值收敛为 CommentData（真实领域数据类型）；自定义 data 形态的调用方请显式写泛型参数。
 */
export function createFavoritePlugin<T = CommentData>(): CommentPlugin<T> {
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
