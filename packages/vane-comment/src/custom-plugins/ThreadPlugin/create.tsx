import React, { createContext, useContext, useState } from "react";
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

/**
 * 楼中楼层级上下文。
 *
 * `level`：当前评论自身的层级（顶层评论为 0），子回复为 level + 1。
 * `path`：当前评论的祖先 id 集合，用于环检测（自引用 / A→B→A 这类循环 replies）。
 *
 * 为什么用 React context 而不是把 depth 塞进插槽 payload：
 * `renderNested` 的 payload 是 `Comment`（公开契约，第三方插件也按此实现），
 * 改 payload 形状会破坏兼容；层级只是「当前渲染位置」的信息，放上下文里最自然。
 */
interface NestInfo {
  level: number;
  path: ReadonlySet<string>;
}

const EMPTY_PATH: ReadonlySet<string> = new Set();
const NestContext = createContext<NestInfo>({ level: 0, path: EMPTY_PATH });

/**
 * 楼中楼入口（由 `renderNested` 槽渲染）。
 * 读环境层级 → 环检测（祖先里已出现过同一 id 就停止递归）→ 限深（level >= maxDepth 不再展开）
 * → 用 level + 1 渲染子级 ThreadView。
 */
function NestedSection({
  comment,
  maxDepth,
  defaultExpanded,
  showReply,
}: {
  comment: Comment;
  maxDepth: number;
  defaultExpanded: boolean;
  showReply: boolean;
}) {
  const nest = useContext(NestContext);
  // 环检测：循环 replies 不再递归（否则会一路渲染到 RangeError 栈溢出）
  if (nest.path.has(comment.id)) return null;
  // 限深：当前评论已到 maxDepth，不再展开它自己的回复
  if (nest.level >= maxDepth) return null;
  const path = new Set(nest.path);
  path.add(comment.id);
  return (
    <ThreadView
      comment={comment}
      depth={nest.level + 1}
      ancestors={path}
      maxDepth={maxDepth}
      defaultExpanded={defaultExpanded}
      showReply={showReply}
    />
  );
}

/** 单条回复（复用同一 renderCommentActions / renderNested 槽 → 嵌套回复也能点赞/继续回复） */
function ReplyNode({
  reply,
  maxDepth,
  showReply,
}: {
  reply: Comment;
  maxDepth: number;
  showReply: boolean;
}) {
  const nest = useContext(NestContext);
  const actions = useCommentSlot("renderCommentActions", reply);
  const nestedSlot = useCommentSlot("renderNested", reply);
  // 与 NestedSection 的双保险：到限深或命中环时连子回复槽都不展开
  const deeper =
    nest.level < maxDepth && !nest.path.has(reply.id) ? nestedSlot : [];
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
          <span style={{ color: "#6b6b6b", marginLeft: 6, fontSize: 12 }}>
            {formatRelativeTime(reply.createdAt)}
          </span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 1 }}>
          {deleted ? (
            <span style={{ color: "#6b6b6b", fontStyle: "italic" }}>该评论已删除</span>
          ) : reply.content?.length ? (
            renderCommentContent(reply.content)
          ) : (
            reply.text
          )}
        </div>
        {actions.length > 0 && showReply && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              columnGap: 14,
              rowGap: 4,
              marginTop: 4,
            }}
          >
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
  ancestors,
  maxDepth,
  defaultExpanded,
  showReply,
}: {
  comment: Comment;
  /** 本次渲染的 replies 所在层级（顶层评论的回复为 1） */
  depth: number;
  /** 当前评论的祖先 id 集合（含自身 id），供下一层环检测 */
  ancestors: ReadonlySet<string>;
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
            color: "#1565c0",
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
            // 子回复的层级信息：level = depth，path = 祖先集合（含本评论 id）
            <NestContext.Provider
              key={reply.id}
              value={{ level: depth, path: ancestors }}
            >
              <ReplyNode reply={reply} maxDepth={maxDepth} showReply={showReply} />
            </NestContext.Provider>
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
    background: primary ? "#1565c0" : "rgba(128,128,128,0.18)",
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
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        flexShrink: 0,
        ...(open ? { flexBasis: "100%", maxWidth: "100%" } : {}),
      }}
    >
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
          flexShrink: 0,
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
          // 深度由 NestContext 沿层级递增（顶层 0 → 子级 1 → 孙级 2 …），不再写死 1
          <NestedSection
            comment={comment}
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
