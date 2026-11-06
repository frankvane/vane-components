import React from "react";
import type {
  CommentData,
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import { ReactionBar } from "./ReactionBar";
import doc from "./doc.json";

export interface ReactionPluginConfig {
  /** 可选表情集合，默认 ["👍","❤️","😂","🎉"] */
  emojis?: string[];
}

const DEFAULT_EMOJIS = ["👍", "❤️", "😂", "🎉"];

/**
 * ReactionPlugin - 多表情反应：每条评论操作行渲染快速表情反应条，带计数。
 *
 * 泛型默认值收敛为 CommentData（真实领域数据类型）；自定义 data 形态的调用方请显式写泛型参数。
 */
export function createReactionPlugin<T = CommentData>(
  config: ReactionPluginConfig = {}
): CommentPlugin<T> {
  const emojis = config.emojis ?? DEFAULT_EMOJIS;
  return {
    name: "ReactionPlugin",
    version: "0.1.0",
    description:
      "多表情反应：每条评论操作行渲染表情反应条（👍❤️😂🎉），点击累加计数，回调 onReact(id, emoji)。",
    priority: 25,
    enabled: true,
    hooks: {
      renderCommentActions: (
        context: CommentPluginContext<T>,
        comment: Comment
      ) => (
        <ReactionBar
          comment={comment}
          emojis={emojis}
          onReact={context.props.onReact as (id: string, emoji: string) => void}
        />
      ),
    },
  };
}

export { doc };
