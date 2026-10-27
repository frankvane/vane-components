import type { CardPlugin, PluginCreator } from "../../plugins/types";
import React from "react";

export interface ReviewPluginConfig {
  showRating?: boolean;
  showReviewCount?: boolean;
  enableUserReview?: boolean;
  onReviewSubmit?: (rating: number, comment: string) => void;
}

export const createReviewPlugin: PluginCreator<any, ReviewPluginConfig> = (
  config = {}
) => {
  const {
    showRating = true,
    showReviewCount = true,
    enableUserReview = false,
    onReviewSubmit,
  } = config;

  const Star: React.FC<{ filled: boolean; onClick?: () => void }> = ({ filled, onClick }) => (
    <span
      onClick={onClick}
      style={{
        color: filled ? "#FFC107" : "#ddd",
        cursor: onClick ? "pointer" : "default",
        fontSize: 16,
      }}
    >
      ★
    </span>
  );

  const plugin: CardPlugin = {
    name: "ReviewPlugin",
    version: "1.0.0",
    description: "评分与评价展示插件",
    priority: 30,
    hooks: {
      renderFooter: (context) => {
        const rating: number = (context.data as any)?.rating ?? 0;
        const reviewCount: number = (context.data as any)?.ratingCount ?? 0;

        const [userRating, setUserRating] = React.useState<number>(0);
        const [comment, setComment] = React.useState<string>("");

        const stars = Array.from({ length: 5 }, (_, i) => i + 1);

        return (
          <div style={{ padding: "8px 12px", borderTop: "1px solid #eee" }}>
            {showRating && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div>
                  {stars.map((i) => (
                    <Star key={i} filled={i <= Math.round(rating)} />
                  ))}
                </div>
                <span style={{ color: "#666", fontSize: 12 }}>{rating.toFixed(1)}</span>
                {showReviewCount && (
                  <span style={{ color: "#999", fontSize: 12 }}>（{reviewCount} 评价）</span>
                )}
              </div>
            )}

            {enableUserReview && (
              <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                <div>
                  {stars.map((i) => (
                    <Star key={`user-${i}`} filled={i <= userRating} onClick={() => setUserRating(i)} />
                  ))}
                </div>
                <textarea
                  rows={2}
                  placeholder="说说你的看法..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ width: "100%", resize: "vertical", padding: 6, border: "1px solid #ddd", borderRadius: 4 }}
                />
                <button
                  onClick={() => onReviewSubmit?.(userRating, comment)}
                  style={{ padding: "6px 12px", border: "1px solid #ddd", borderRadius: 4, background: "#fff", cursor: "pointer" }}
                >
                  提交评价
                </button>
              </div>
            )}
          </div>
        );
      },
    },
    config,
  };

  return plugin;
};