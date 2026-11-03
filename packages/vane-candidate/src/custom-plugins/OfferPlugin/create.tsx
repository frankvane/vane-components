import type { PluginDoc } from "vane-plugin-core";
import type {
  CandidatePluginCreator,
} from "../../components/CandidatePlugin/plugins/types";
import doc from "./doc.json";

export interface OfferConfig {
  /** 各状态文案（缺省用内置中文） */
  labels?: Partial<Record<"draft" | "sent" | "accepted" | "declined", string>>;
}

const DEFAULT_LABELS: Record<"draft" | "sent" | "accepted" | "declined", string> = {
  draft: "Offer 审批中",
  sent: "Offer 已发出",
  accepted: "已接受 Offer",
  declined: "已婉拒 Offer",
};

const STATUS_COLOR: Record<"draft" | "sent" | "accepted" | "declined", { fg: string; bg: string }> = {
  draft: { fg: "#5d636a", bg: "#f2f3f5" },
  sent: { fg: "#1c6ea8", bg: "#e7f1fa" },
  accepted: { fg: "#1f7a3f", bg: "#e8f5ec" },
  declined: { fg: "#b42318", bg: "#fdeceb" },
};

/**
 * Offer —— Offer 状态徽章。
 * candidate.offer 存在时在卡片徽章区显示状态胶囊（审批中灰 / 已发出蓝 /
 * 已接受绿 / 已婉拒红）。纯展示，不改数据。
 */
export const createOfferPlugin: CandidatePluginCreator<OfferConfig> = (
  config = {}
) => {
  const labels = { ...DEFAULT_LABELS, ...(config.labels ?? {}) };
  return {
    name: "offer",
    version: "0.1.0",
    description: doc.description,
    priority: 40,
    config: { order: 40 },
    hooks: {
      renderCardBadges: (_ctx, candidate) => {
        const offer = candidate.offer;
        if (!offer) return null;
        const color = STATUS_COLOR[offer.status];
        return (
          <span
            key="offer"
            title={offer.salary ? `${labels[offer.status]} · ${offer.salary}` : labels[offer.status]}
            aria-label={labels[offer.status]}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: color.fg,
              background: color.bg,
              borderRadius: 999,
              padding: "0 8px",
              lineHeight: "18px",
            }}
          >
            {labels[offer.status]}
          </span>
        );
      },
    },
  };
};

createOfferPlugin.meta = doc as PluginDoc;
