import type React from "react";
import { useState } from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
  FollowState,
} from "../../components/ProfilePlugin/plugins/types";
import doc from "./doc.json";

/** onFollow 的返回值：Promise 落地即视为成功；返回 { error } 或 reject 视为失败 */
export type FollowResult = void | { error?: string } | undefined;

export interface FollowEchoConfig {
  /** 强制关注态，覆盖 context.followState */
  state?: FollowState;
  /** 三态文案覆盖 */
  labels?: Partial<Record<FollowState, React.ReactNode>>;
  /** 尺寸，默认 md */
  size?: "sm" | "md";
  /**
   * 点击切换后的回调（返回切换后的态）。
   * 支持返回 Promise：pending 期间按钮禁用（防重复请求），reject / `{ error }` 时
   * 内部态回滚到点击前的值，并在按钮旁显示错误文案。
   */
  onFollow?: (next: FollowState) => Promise<FollowResult> | FollowResult;
  /** props.followState 由非 mutual 变为 mutual 时的回调 */
  onMutual?: (next: FollowState) => void;
}

const DEFAULT_LABELS: Record<FollowState, React.ReactNode> = {
  none: "关注",
  following: "已关注",
  mutual: "互相关注",
};

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
function FollowButton({
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

/**
 * FollowEcho - 关注回显：关注 / 已关注 / 互相关注三态按钮。
 *
 * 走领域槽 `renderFollowArea`（由 ProfileCore 的 `vp-follow-area` 消费）。
 * 受控于 props.followState：点击切换仅作乐观 UI，真相由消费方回写 props；
 * 回调失败必须回滚并提示，避免 UI 停在「已关注」而服务端其实没成功。
 * `onPropsChange` 在关系变为 mutual 时触发 onMutual 回调。
 */
export function createFollowEchoPlugin<T = any>(
  config: FollowEchoConfig = {}
): ProfilePlugin<T> {
  const { labels, size = "md", onFollow, onMutual } = config;
  const resolved = { ...DEFAULT_LABELS, ...(labels ?? {}) };
  return {
    name: "FollowEcho",
    version: "0.1.0",
    description:
      "关注回显：关注 / 已关注 / 互相关注三态按钮，受控于 props.followState。",
    priority: 10,
    enabled: true,
    hooks: {
      renderFollowArea: (context: ProfilePluginContext<T>) => {
        const state: FollowState = config.state ?? context.followState;
        return (
          <FollowButton
            key={state}
            initial={state}
            labels={resolved}
            size={size}
            onToggle={(next) => onFollow?.(next)}
          />
        );
      },
      onPropsChange: (_context, prev, next) => {
        const prevState = (prev as { followState?: FollowState })?.followState;
        const nextState = (next as { followState?: FollowState })?.followState;
        if (prevState !== "mutual" && nextState === "mutual") {
          onMutual?.(nextState);
        }
      },
    },
  };
}
