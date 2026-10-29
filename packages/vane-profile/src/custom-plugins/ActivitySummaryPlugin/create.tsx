import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import doc from "./doc.json";

export interface ActivitySummaryConfig {
  /** 最近活跃描述，如「2 小时前」 */
  lastActive?: string;
  /** 本月发布篇数 */
  postsThisMonth?: number;
  /** 总阅读量描述，如「120w」 */
  totalViews?: string;
  /** 是否显示图标字 */
  showIcon?: boolean;
}

/**
 * ActivitySummary - 活跃度小结：最近活跃 / 本月发布 / 总阅读，一行小字。
 *
 * 走领域槽 `renderBioArea`（与 BioSlot / SocialLinks / TagList / ContactCard 同区串联）。
 * 三项全空时不渲染。
 */
export function createActivitySummaryPlugin<T = any>(
  config: ActivitySummaryConfig = {}
): ProfilePlugin<T> {
  const { lastActive, postsThisMonth, totalViews, showIcon = true } = config;
  const parts: string[] = [];
  if (lastActive) parts.push(`最近活跃 ${lastActive}`);
  if (typeof postsThisMonth === "number")
    parts.push(`本月发布 ${postsThisMonth} 篇`);
  if (totalViews) parts.push(`总阅读 ${totalViews}`);

  return {
    name: "ActivitySummary",
    version: "0.1.0",
    description: "活跃度小结：最近活跃 / 本月发布 / 总阅读，一行小字。",
    priority: 12,
    enabled: true,
    hooks: {
      renderBioArea: (_context: ProfilePluginContext<T>) => {
        if (!parts.length) return null;
        return (
          <div
            className="vp-activity"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              opacity: 0.72,
              color: "inherit",
            }}
          >
            {showIcon && (
              <span aria-hidden style={{ opacity: 0.8 }}>
                ◷
              </span>
            )}
            <span>{parts.join(" · ")}</span>
          </div>
        );
      },
    },
  };
}
