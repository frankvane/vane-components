import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
  BadgeType,
} from "../../components/ProfilePlugin/plugins/types";
import doc from "./doc.json";

export interface VerifyBadgeConfig {
  /** 强制认证态，覆盖 context.verified */
  verified?: boolean;
  /** 认证类型，覆盖 context.badgeType */
  type?: BadgeType;
  /** 徽标旁文字；缺省按 type 给「认证」/「机构认证」 */
  label?: React.ReactNode;
  /** 是否展示文字，默认 true */
  showLabel?: boolean;
}

/** 内联 SVG 对勾徽标（不引外部资源） */
function BadgeIcon({ type }: { type: BadgeType }) {
  const color = type === "institution" ? "#ff8f00" : "#1da1f2";
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill={color} />
      <path
        d="M7 12.5l3 3 7-7"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * VerifyBadge - 认证徽标：个人 / 机构认证对勾，浮于头图右上角。
 *
 * 走领域槽 `renderBadgeArea`（由 ProfileCore 的 `vp-badge-area` 消费，绝对定位
 * 于头图右上）。`verified` 为 false（config 或 context）时不渲染。
 */
export function createVerifyBadgePlugin<T = any>(
  config: VerifyBadgeConfig = {}
): ProfilePlugin<T> {
  const { showLabel = true } = config;
  return {
    name: "VerifyBadge",
    version: "0.1.0",
    description:
      "认证徽标：个人 / 机构认证对勾，浮于头图右上角。",
    priority: 30,
    enabled: true,
    hooks: {
      renderBadgeArea: (context: ProfilePluginContext<T>) => {
        const verified = config.verified ?? context.verified;
        const type = config.type ?? context.badgeType;
        if (!verified) return null;
        const labelText =
          config.label ?? (type === "institution" ? "机构认证" : "认证");
        return (
          <span
            className="vp-badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.92)",
              color: "#333",
              fontSize: 12,
            }}
          >
            <BadgeIcon type={type} />
            {showLabel && labelText}
          </span>
        );
      },
    },
  };
}

