import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import doc from "./doc.json";

export interface BioSlotConfig {
  /** 昵称（头图已用 overlay 显示时留空，避免重复） */
  name?: React.ReactNode;
  /** 个性签名 / 一句话简介 */
  bio?: React.ReactNode;
  /** 所在地 */
  location?: string;
  /** 加入时间（如 "2021 加入"） */
  joinDate?: string;
  /** 副标题 / 职业（显示在昵称下方小字） */
  subtitle?: React.ReactNode;
}

/**
 * BioSlot - 简介区：昵称 + 签名 + 所在地 / 加入时间。
 *
 * 走领域槽 `renderBioArea`（由 ProfileCore 的 `vp-bio-area` 消费，排在头图与数据行之间）。
 * 内容全空时整体返回 null，不占空间。
 */
export function createBioSlotPlugin<T = any>(
  config: BioSlotConfig = {}
): ProfilePlugin<T> {
  const { name, bio, location, joinDate, subtitle } = config;
  const metaLine = [location, joinDate].filter(Boolean).join(" · ");

  return {
    name: "BioSlot",
    version: "0.1.0",
    description: "简介区：昵称 + 签名 + 所在地 / 加入时间。",
    priority: 12,
    enabled: true,
    hooks: {
      renderBioArea: (_context: ProfilePluginContext<T>) => {
        if (!name && !subtitle && !bio && !metaLine) return null;
        return (
          <div className="vp-bio">
            {name && <div className="vp-bio-name">{name}</div>}
            {subtitle && <div className="vp-bio-sub">{subtitle}</div>}
            {bio && <div className="vp-bio-text">{bio}</div>}
            {metaLine && <div className="vp-bio-meta">{metaLine}</div>}
          </div>
        );
      },
    },
  };
}
