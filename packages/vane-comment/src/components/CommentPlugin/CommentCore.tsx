import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useCommentSlot } from "./plugins/slots";
import type { Comment, CommentCoreProps, CommentCoreRef } from "./plugins/types";
import { formatRelativeTime, renderCommentContent } from "./content";

/**
 * CommentCore - 通用评论区核心组件（数据驱动列表壳）。
 *
 * 铁律：核心只做「列表布局 + 生命周期转发 + 逐条渲染」，所有可变能力交给插件。
 *  顶栏（renderToolbar） → 评论列表（逐条：头像/昵称/时间/富内容/操作行/楼中楼）
 *  → 加载更多 → 底部（renderFooter：评论框）。
 *
 * 领域槽由 Core 经 useCommentSlot 直接消费；插件通过 useCommentContext 拿到
 * comments / sortMode 等。
 */
const CommentCore = forwardRef<CommentCoreRef, CommentCoreProps>(
  function CommentCore(props, ref) {
    const {
      comments: commentsProp,
      data,
      containerClassName,
      containerStyle,
      containerRefExternal,
      emptyText = "还没有评论，快来抢沙发~",
      loading,
      onLoadMore,
    } = props;

    const internalRef = useRef<HTMLDivElement>(null);
    const containerRef = containerRefExternal || internalRef;
    const [, forceTick] = useState(0);
    const forceUpdate = useCallback(() => forceTick((t) => t + 1), []);

    const toolbar = useCommentSlot("renderToolbar");
    const footer = useCommentSlot("renderFooter");

    const list: Comment[] =
      commentsProp ?? (data as unknown as Comment[] | undefined) ?? [];

    useImperativeHandle(
      ref,
      () => ({
        getContainer: () => containerRef.current,
        forceUpdate,
        getSize: () => {
          const el = containerRef.current;
          return el
            ? { width: el.offsetWidth, height: el.offsetHeight }
            : { width: 0, height: 0 };
        },
      }),
      [forceUpdate]
    );

    const showLoadMore = typeof onLoadMore === "function" && !loading;

    return (
      <div
        ref={containerRef}
        className={`vc-comment ${containerClassName || ""}`}
        style={{
          position: "relative",
          boxSizing: "border-box",
          color: "inherit",
          fontFamily: "inherit",
          ...containerStyle,
        }}
      >
        {toolbar.length > 0 && (
          <div className="vc-toolbar" style={{ marginBottom: 8 }}>
            {toolbar}
          </div>
        )}

        {list.length === 0 && !loading ? (
          <div
            className="vc-empty"
            style={{ padding: "24px 0", textAlign: "center", opacity: 0.55 }}
          >
            {emptyText}
          </div>
        ) : (
          <div className="vc-list" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {list.map((c) => (
              <CommentItem key={c.id} comment={c} depth={0} />
            ))}
          </div>
        )}

        {loading && (
          <div
            className="vc-loading"
            style={{ padding: "12px 0", textAlign: "center", opacity: 0.55 }}
          >
            加载中…
          </div>
        )}

        {showLoadMore && (
          <div style={{ padding: "12px 0", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => onLoadMore?.()}
              style={{
                border: "1px solid rgba(128,128,128,0.25)",
                borderRadius: 999,
                padding: "6px 18px",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              加载更多
            </button>
          </div>
        )}

        {footer.length > 0 && (
          <div className="vc-footer" style={{ marginTop: 12 }}>
            {footer}
          </div>
        )}
      </div>
    );
  }
);

CommentCore.displayName = "CommentCore";

/** 单条评论（含操作行 + 楼中楼嵌套槽）；depth 控制缩进与限深视觉 */
function CommentItem({ comment, depth }: { comment: Comment; depth: number }) {
  const actions = useCommentSlot("renderCommentActions", comment);
  const nested = useCommentSlot("renderNested", comment);
  const status = comment.status ?? "normal";

  const deleted = status === "deleted";
  const pending = status === "pending";

  return (
    <div
      className="vc-item"
      style={{
        display: "flex",
        gap: 10,
        paddingLeft: depth > 0 ? 12 : 0,
        borderLeft: depth > 0 ? "2px solid rgba(128,128,128,0.15)" : undefined,
      }}
    >
      <Avatar author={comment.author} />
      <div className="vc-item-body" style={{ flex: 1, minWidth: 0 }}>
        <div className="vc-meta" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>{comment.author.name}</span>
          {comment.author.verified && (
            <span
              title="认证用户"
              style={{ color: "#1da1f2", fontSize: 12 }}
            >
              ✓
            </span>
          )}
          {comment.author.badge && (
            <span
              style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 4,
                background: "rgba(128,128,128,0.18)",
                opacity: 0.85,
              }}
            >
              {comment.author.badge}
            </span>
          )}
          {comment.pinned && (
            <span
              style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 4,
                color: "#ff8f00",
                border: "1px solid rgba(255,143,0,0.4)",
              }}
            >
              置顶
            </span>
          )}
          <span style={{ opacity: 0.5, marginLeft: "auto", fontSize: 12 }}>
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>

        {deleted ? (
          <div style={{ opacity: 0.45, fontSize: 13, fontStyle: "italic", marginTop: 2 }}>
            该评论已删除
          </div>
        ) : pending ? (
          <div style={{ opacity: 0.45, fontSize: 13, fontStyle: "italic", marginTop: 2 }}>
            评论审核中
          </div>
        ) : (
          <>
            <div className="vc-content" style={{ fontSize: 14, marginTop: 2, lineHeight: 1.5 }}>
              {comment.content?.length
                ? renderCommentContent(comment.content)
                : comment.text}
            </div>

            {comment.images && comment.images.length > 0 && (
              <div className="vc-images" style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {comment.images.map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt={img.alt ?? ""}
                    style={{
                      width: 88,
                      height: 88,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                ))}
              </div>
            )}

            {actions.length > 0 && (
              <div className="vc-actions" style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
                {actions}
              </div>
            )}

            {nested.length > 0 && (
              <div className="vc-nested" style={{ marginTop: 10 }}>
                {nested}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Avatar({ author }: { author: Comment["author"] }) {
  if (author.avatar) {
    return (
      <img
        src={author.avatar}
        alt={author.name}
        style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(128,128,128,0.22)",
        fontWeight: 600,
      }}
    >
      {author.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default CommentCore;
