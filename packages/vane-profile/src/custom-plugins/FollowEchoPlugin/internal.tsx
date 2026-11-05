import React, { useState } from "react";
import type { FollowState } from "../../components/ProfilePlugin/plugins/types";

/** onFollow 的返回值：Promise 落地即视为成功；返回 { error } 或 reject 视为失败 */
export type FollowResult = void | { error?: string } | undefined;

const DEFAULT_ERROR = "操作失败，请重试";

/**
 * FollowButton - 受控三态按钮（内部有乐观 UI 态 + pending + 失败回滚）。
 *
 * 用 key={state} 让父重渲染（props.followState 变化）时以新初值重挂载，
 * 避免 stale 状态；点击在 none ⇄ following 间切换（mutual 视为「已关注」，
 * 再点即取消关注 → none）。
 *
 * 乐观更新必须可回滚：onFollow 返回的 Promise 失败（reject 或 `{ error }`）时，
 * 内部态退回点击前值，并渲染可见错误提示；pending 期间按钮禁用，重复点击被忽略。
 */
export function FollowButton({
  initial,
  labels,
  size,
  onToggle,
}: {
  initial: FollowState;
  labels: Record<FollowState, React.ReactNode>;
  size: "sm" | "md";
  onToggle: (next: FollowState) => Promise<FollowResult> | FollowResult;
}) {
  const [state, setState] = useState<FollowState>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const following = state !== "none";
  const padding = size === "sm" ? "4px 12px" : "8px 20px";
  const fontSize = size === "sm" ? 12 : 14;

  const handle = async () => {
    if (pending) return;
    const prev = state;
    const next: FollowState = state === "none" ? "following" : "none";
    setError(null);
    setState(next);
    setPending(true);
    try {
      const result = await onToggle(next);
      if (result && typeof result === "object" && result.error) {
        throw new Error(result.error);
      }
    } catch (err) {
      setState(prev);
      setError(err instanceof Error && err.message ? err.message : DEFAULT_ERROR);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        aria-busy={pending}
        style={{
          padding,
          fontSize,
          borderRadius: 999,
          border: following ? "1px solid #ddd" : "none",
          background: following ? "#fff" : "#1a5fd0",
          color: following ? "#555" : "#fff",
          cursor: pending ? "progress" : "pointer",
          opacity: pending ? 0.7 : 1,
        }}
      >
        {labels[state]}
      </button>
      {error && (
        <span
          className="vp-follow-error"
          role="alert"
          style={{ fontSize: 12, color: "#c62828", lineHeight: 1.4 }}
        >
          {error}
        </span>
      )}
    </>
  );
}
