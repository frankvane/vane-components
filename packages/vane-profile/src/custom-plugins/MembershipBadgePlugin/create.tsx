import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import doc from "./doc.json";

export interface MembershipBadgeConfig {
  /** 会员等级 1-3，决定配色与默认文案（VIP1/VIP2/VIP3） */
  level?: 1 | 2 | 3;
  /** 覆盖默认展示文案；不填则按 level 给「VIP{n}」 */
  label?: React.ReactNode;
  /** 是否展示文案（仅图标时为 false） */
  showLabel?: boolean;
}

const PALETTE: Record<number, { bg: string; fg: string }> = {
  1: { bg: "#c7a06a", fg: "#fff" },
  2: { bg: "#9aa7b5", fg: "#fff" },
  3: { bg: "#e0b34a", fg: "#3a2c00" },
};

/**
 * MembershipBadge - 会员 / VIP 等级角标。
 *
 * 走领域槽 `renderBadgeArea`（与 VerifyBadge / QRShare 同区，浮于头图右上，
 * 按 priority 与它们横向并排）。verified=false 时不渲染（无会员不占位置）。
 */
export function createMembershipBadgePlugin<T = any>(
  config: MembershipBadgeConfig = {}
): ProfilePlugin<T> {
  const { level = 1, label, showLabel = true } = config;
  const tone = PALETTE[level] ?? PALETTE[1];
  return {
    name: "MembershipBadge",
    version: "0.1.0",
    description: "会员 / VIP 等级角标：浮于头图右上，与认证徽标同区并排。",
    priority: 30,
    enabled: true,
    hooks: {
      renderBadgeArea: (_context: ProfilePluginContext<T>) => (
        <span
          className="vp-membership"
          title={`VIP ${level}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            background: tone.bg,
            color: tone.fg,
            lineHeight: 1.6,
          }}
        >
          <span aria-hidden style={{ fontSize: 11 }}>
            ♛
          </span>
          {showLabel ? <span>{label ?? `VIP${level}`}</span> : null}
        </span>
      ),
    },
  };
}
