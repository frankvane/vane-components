import React, { useState } from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  Comment,
  CommentNode,
} from "../../components/CommentPlugin/plugins/types";
import {
  formatRelativeTime,
  renderCommentContent,
} from "../../components/CommentPlugin/content";
import { useCommentSlot } from "../../components/CommentPlugin/plugins/slots";
import doc from "./doc.json";

export interface ThreadPluginConfig {
  /** 最大嵌套深度（超过则不再渲染更深的楼中楼），默认 3 */
  maxDepth?: number;
  /** 默认是否展开楼中楼，默认 true */
  defaultExpanded?: boolean;
  /** 是否渲染内联回复框，默认 true */
  showReply?: boolean;
}

/** 紧凑头像（嵌套用） */
function MiniAvatar({ author }: { author: Comment["author"] }) {
  if (author.avatar) {
    return (
      <img
        src={author.avatar}
        alt={author.name}
        style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(128,128,128,0.22)",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {author.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

/** 单条回复（复用同一 renderCommentActions / renderNested 槽 → 嵌套回复也能点赞/继续回复） */
function ReplyNode({
  reply,
  depth,
  maxDepth,
  showReply,
}: {
  reply: Comment;
  depth: number;
  maxDepth: number;
  showReply: boolean;
}) {
  const actions = useCommentSlot("renderCommentActions", reply);
  const nestedSlot = useCommentSlot("renderNested", reply);
  const deeper = depth < maxDepth ? nestedSlot : [];
  const deleted = (reply.status ?? "normal") === "deleted";

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10 }} data-testid="comment-item">
      <MiniAvatar author={reply.author} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>{reply.author.name}</span>
          {reply.author.badge && (
            <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>
              {reply.author.badge}
            </span>
          )}
          <span style={{ opacity: 0.45, marginLeft: 6, fontSize: 12 }}>
            {formatRelativeTime(reply.createdAt)}
          </span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 1 }}>
          {deleted ? (
            <span style={{ opacity: 0.45, fontStyle: "italic" }}>该评论已删除</span>
          ) : reply.content?.length ? (
            renderCommentContent(reply.content)
          ) : (
            reply.text
          )}
        </div>
        {actions.length > 0 && showReply && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
            {actions}
          </div>
        )}
        {deeper.length > 0 && (
          <div style={{ borderLeft: "2px solid rgba(128,128,128,0.15)", paddingLeft: 10 }}>
            {deeper}
          </div>
        )}
      </div>
    </div>
  );
}

/** 楼中楼容器：展开/收起 + 递归渲染 replies */
function ThreadView({
  comment,
  depth,
  maxDepth,
  defaultExpanded,
  showReply,
}: {
  comment: Comment;
  depth: number;
  maxDepth: number;
  defaultExpanded: boolean;
  showReply: boolean;
}) {
  const replies = comment.replies ?? [];
  const replyCount = comment.replyCount ?? replies.length;
  const [expanded, setExpanded] = useState(defaultExpanded && replies.length > 0);

  if (replies.length === 0 && replyCount === 0) return null;

  return (
    <div style={{ marginTop: 8 }}>
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            border: "none",
            background: "transparent",
            color: "#1da1f2",
            cursor: "pointer",
            fontSize: 13,
            padding: 0,
          }}
        >
          {replyCount > replies.length
            ? `展开 ${replyCount} 条回复`
            : `展开 ${replies.length} 条回复`}
        </button>
      ) : (
        <div>
          {replies.map((reply) => (
            <ReplyNode
              key={reply.id}
              reply={reply}
              depth={depth}
              maxDepth={maxDepth}
              showReply={showReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 内联回复框（点"回复"触发） */
function ReplyBox({
  parentId,
  onSubmit,
  onCancel,
}: {
  parentId: string;
  onSubmit: (parentId: string, content: CommentNode[]) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const disabled = text.trim().length === 0;
  return (
    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="回复点什么…"
        rows={2}
        style={{
          width: "100%",
          resize: "vertical",
          borderRadius: 6,
          border: "1px solid rgba(128,128,128,0.25)",
          padding: 6,
          fontSize: 13,
          fontFamily: "inherit",
          background: "transparent",
          color: "inherit",
          boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onCancel}
          style={btnStyle(false)}
        >
          取消
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onSubmit(parentId, [{ type: "text", value: text.trim() }]);
            setText("");
          }}
          style={btnStyle(true)}
        >
          回复
        </button>
      </div>
    </div>
  );
}

function btnStyle(primary: boolean): React.CSSProperties {
  return {
    border: "none",
    borderRadius: 6,
    padding: "4px 14px",
    fontSize: 13,
    cursor: "pointer",
    background: primary ? "#1da1f2" : "rgba(128,128,128,0.18)",
    color: primary ? "#fff" : "inherit",
  };
}

/** "回复"触发器：切换内联回复框 */
function ReplyTrigger({
  comment,
  context,
  showReply,
}: {
  comment: Comment;
  context: CommentPluginContext<any>;
  showReply: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!showReply) return null;
  return (
    <span style={{ display: "inline-flex", flexDirection: "column" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          border: "none",
          background: "transparent",
          color: "inherit",
          opacity: 0.7,
          cursor: "pointer",
          fontSize: 13,
          padding: 0,
        }}
      >
        回复
      </button>
      {open && (
        <ReplyBox
          parentId={comment.id}
          onCancel={() => setOpen(false)}
          onSubmit={(parentId, content) =>
            (
              context.props.onReply as
                | ((id: string, c: CommentNode[]) => void)
                | undefined
            )?.(parentId, content)
          }
        />
      )}
    </span>
  );
}

/**
 * ThreadPlugin - 楼中楼：顶评论的 `renderNested` 槽递归渲染 replies；
 * 操作行的"回复"经 `renderCommentActions` 唤起内联回复框。
 * 嵌套回复同样走同一组槽 → 子回复也能点赞 / 继续回复。
 */
export function createThreadPlugin<T = any>(
  config: ThreadPluginConfig = {}
): CommentPlugin<T> {
  const maxDepth = config.maxDepth ?? 3;
  const defaultExpanded = config.defaultExpanded ?? true;
  const showReply = config.showReply ?? true;
  return {
    name: "ThreadPlugin",
    version: "0.1.0",
    description: "楼中楼：递归渲染嵌套回复（限深折叠 + 展开），操作行内联回复。",
    priority: 30,
    enabled: true,
    hooks: {
      renderNested: (context: CommentPluginContext<T>, comment: Comment) =>
        comment.replies && comment.replies.length > 0 ? (
          <ThreadView
            comment={comment}
            depth={1}
            maxDepth={maxDepth}
            defaultExpanded={defaultExpanded}
            showReply={showReply}
          />
        ) : null,
      renderCommentActions: (
        context: CommentPluginContext<T>,
        comment: Comment
      ) => (
        <ReplyTrigger
          comment={comment}
          context={context}
          showReply={showReply}
        />
      ),
    },
  };
}

export { doc };
