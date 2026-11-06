import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
  FollowState,
} from "../../components/ProfilePlugin/plugins/types";
import { FollowButton } from "./internal";
import type { FollowResult } from "./internal";

/** onFollow 的返回值：Promise 落地即视为成功；返回 { error } 或 reject 视为失败 */
export type { FollowResult } from "./internal";

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

/**
 * FollowEcho - 关注回显：关注 / 已关注 / 互相关注三态按钮。
 *
 * 走领域槽 `renderFollowArea`（由 ProfileCore 的 `vp-follow-area` 消费）。
 * 受控于 props.followState：点击切换仅作乐观 UI，真相由消费方回写 props；
 * 回调失败必须回滚并提示，避免 UI 停在「已关注」而服务端其实没成功。
 * `onPropsChange` 在关系变为 mutual 时触发 onMutual 回调。
 */
// 泛型默认值 unknown：T 仅出现在入参位（逆变安全），不写 T 的调用方不受影响。
export function createFollowEchoPlugin<T = unknown>(
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
