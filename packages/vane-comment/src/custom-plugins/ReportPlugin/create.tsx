import React, { useState } from "react";
import type {
  CommentPlugin,
  CommentPluginContext,
  Comment,
} from "../../components/CommentPlugin/plugins/types";
import doc from "./doc.json";

export interface ReportPluginConfig {
  /** 举报理由选项，默认 ["垃圾广告","辱骂攻击","色情低俗","诈骗","其他"] */
  reasons?: string[];
}

const DEFAULT_REASONS = ["垃圾广告", "辱骂攻击", "色情低俗", "诈骗", "其他"];

const actionBtn: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  fontSize: 13,
  padding: 0,
  flexShrink: 0,
};

/** 举报按钮：点击弹出理由浮层，提交回调 onReport(id, reason) */
function ReportButton({
  comment,
  onReport,
  reasons,
}: {
  comment: Comment;
  onReport?: (id: string, reason: string) => void;
  reasons: string[];
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const submit = () => {
    onReport?.(comment.id, picked ?? "其他");
    setOpen(false);
    setPicked(null);
  };

  return (
    <span style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>
      <button
        type="button"
        data-testid="comment-report"
        onClick={() => setOpen((o) => !o)}
        style={actionBtn}
      >
        🚩举报
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 20,
            marginTop: 4,
            background: "#fff",
            color: "#222",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 8,
            padding: 8,
            minWidth: 150,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          {reasons.map((r) => (
            <label
              key={r}
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                padding: "4px 0",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                checked={picked === r}
                onChange={() => setPicked(r)}
              />
              {r}
            </label>
          ))}
          <button
            type="button"
            onClick={submit}
            style={{
              marginTop: 6,
              width: "100%",
              border: "none",
              borderRadius: 6,
              padding: "6px 0",
              background: "#c62828",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            提交举报
          </button>
        </div>
      )}
    </span>
  );
}

/**
 * ReportPlugin - 举报：每条评论操作行渲染举报按钮，弹出理由浮层，提交回调 onReport。
 */
export function createReportPlugin<T = any>(
  config: ReportPluginConfig = {}
): CommentPlugin<T> {
  const reasons = config.reasons ?? DEFAULT_REASONS;
  return {
    name: "ReportPlugin",
    version: "0.1.0",
    description:
      "举报：每条评论操作行渲染举报按钮，弹出理由选择浮层，提交回调 onReport(id, reason)。",
    priority: 22,
    enabled: true,
    hooks: {
      renderCommentActions: (
        context: CommentPluginContext<T>,
        comment: Comment
      ) => (
        <ReportButton
          comment={comment}
          reasons={reasons}
          onReport={
            context.props.onReport as (id: string, reason: string) => void
          }
        />
      ),
    },
  };
}

export { doc };
