import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import doc from "./doc.json";

export interface MessageButtonConfig {
  /** 按钮尺寸，默认 md */
  size?: "sm" | "md";
  /** 按钮文案，默认「私信」 */
  label?: React.ReactNode;
  /** 点击回调（不传则仅乐观高亮） */
  onMessage?: (ctx: ProfilePluginContext) => void;
}

/**
 * MessageButton - 私信按钮，与关注回显（FollowEcho）同区并排。
 *
 * 走领域槽 `renderFollowArea`。点击触发 onMessage（消费方在此拉起会话）。
 */
export function createMessageButtonPlugin<T = any>(
  config: MessageButtonConfig = {}
): ProfilePlugin<T> {
  const { size = "md", label = "私信", onMessage } = config;
  const pad = size === "sm" ? "3px 12px" : "6px 18px";
  const fs = size === "sm" ? 12 : 14;
  return {
    name: "MessageButton",
    version: "0.1.0",
    description: "私信按钮：与关注回显同区并排，点击拉起会话。",
    priority: 10,
    enabled: true,
    hooks: {
      renderFollowArea: (context: ProfilePluginContext<T>) => (
        <button
          type="button"
          onClick={() => onMessage?.(context)}
          style={{
            padding: pad,
            fontSize: fs,
            borderRadius: 999,
            border: "1px solid rgba(125,130,140,0.45)",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            lineHeight: 1.4,
          }}
        >
          {label}
        </button>
      ),
    },
  };
}
