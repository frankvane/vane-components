import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import doc from "./doc.json";

export type LiveStatusKind = "online" | "away" | "busy" | "offline" | "live";

export interface LiveStatusConfig {
  /** 状态：在线 / 离开 / 忙碌 / 离线 / 直播中 */
  status?: LiveStatusKind;
  /** status=live 时的直播标题 */
  liveTitle?: string;
  /** 是否展示文案（仅圆点为 false） */
  showLabel?: boolean;
}

const META: Record<LiveStatusKind, { color: string; label: string }> = {
  online: { color: "#2ecc71", label: "在线" },
  away: { color: "#f1c40f", label: "离开" },
  busy: { color: "#e74c3c", label: "忙碌" },
  offline: { color: "#95a5a6", label: "离线" },
  live: { color: "#ff4757", label: "直播中" },
};

/**
 * LiveStatus - 在线 / 直播状态指示。
 *
 * 走领域槽 `renderBioArea`（与 BioSlot / SocialLinks / TagList 同区，按 priority 串联）。
 * status=live 时显示红点 + 「直播中：{liveTitle}」。
 */
export function createLiveStatusPlugin<T = any>(
  config: LiveStatusConfig = {}
): ProfilePlugin<T> {
  const { status = "online", liveTitle, showLabel = true } = config;
  const m = META[status] ?? META.online;
  return {
    name: "LiveStatus",
    version: "0.1.0",
    description: "在线 / 直播状态指示：圆点 + 文案，直播态高亮。",
    priority: 12,
    enabled: true,
    hooks: {
      renderBioArea: (_context: ProfilePluginContext<T>) => (
        <div
          className="vp-livestatus"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "inherit",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: m.color,
              boxShadow: status === "live" ? `0 0 0 3px ${m.color}33` : "none",
              flex: "0 0 auto",
            }}
          />
          {showLabel ? (
            <span>
              {m.label}
              {status === "live" && liveTitle ? `：${liveTitle}` : ""}
            </span>
          ) : null}
        </div>
      ),
    },
  };
}
