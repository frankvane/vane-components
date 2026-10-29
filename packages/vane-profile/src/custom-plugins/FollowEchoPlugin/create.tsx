import type React from "react";
import { useState } from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
  FollowState,
} from "../../components/ProfilePlugin/plugins/types";
import doc from "./doc.json";

export interface FollowEchoConfig {
  /** 强制关注态，覆盖 context.followState */
  state?: FollowState;
  /** 三态文案覆盖 */
  labels?: Partial<Record<FollowState, React.ReactNode>>;
  /** 尺寸，默认 md */
  size?: "sm" | "md";
  /** 点击切换后的回调（返回切换后的态） */
  onFollow?: (next: FollowState) => void;
  /** props.followState 由非 mutual 变为 mutual 时的回调 */
  onMutual?: (next: FollowState) => void;
}

const DEFAULT_LABELS: Record<FollowState, React.ReactNode> = {
  none: "关注",
  following: "已关注",
  mutual: "互相关注",
};

/**
 * FollowButton - 受控三态按钮（内部有瞬时 UI 态，受 props 重置）。
 *
 * 用 key={state} 让父重渲染（props.followState 变化）时以新初值重挂载，
 * 避免 stale 状态；点击切换 none⇄following（mutual 视为只读，由对方决定）。
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
  onToggle: (next: FollowState) => void;
}) {
  const [state, setState] = useState<FollowState>(initial);
  const handle = () => {
    const next: FollowState =
      state === "none" || state === "mutual" ? "following" : "none";
    setState(next);
    onToggle(next);
  };
  const following = state !== "none";
  const padding = size === "sm" ? "4px 12px" : "8px 20px";
  const fontSize = size === "sm" ? 12 : 14;
  return (
    <button
      type="button"
      onClick={handle}
      style={{
        padding,
        fontSize,
        borderRadius: 999,
        border: following ? "1px solid #ddd" : "none",
        background: following ? "#fff" : "#2575fc",
        color: following ? "#555" : "#fff",
        cursor: "pointer",
      }}
    >
      {labels[state]}
    </button>
  );
}

/**
 * FollowEcho - 关注回显：关注 / 已关注 / 互相关注三态按钮。
 *
 * 走领域槽 `renderFollowArea`（由 ProfileCore 的 `vp-follow-area` 消费）。
 * 受控于 props.followState：点击切换仅作乐观 UI，真相由消费方回写 props。
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
            onToggle={(next) => {
              onFollow?.(next);
            }}
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

