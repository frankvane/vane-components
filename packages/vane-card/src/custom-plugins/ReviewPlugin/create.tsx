import type { CardPlugin, PluginCreator } from "../../components/CardPlugin/plugins/types";
import React from "react";

export interface ReviewPluginConfig {
  showRating?: boolean;
  showReviewCount?: boolean;
  enableUserReview?: boolean;
  onReviewSubmit?: (rating: number, comment: string) => void;
}

const Star: React.FC<{ filled: boolean; onClick?: () => void }> = ({
  filled,
  onClick,
}) => (
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

const STARS = [1, 2, 3, 4, 5];

interface ReviewFooterProps {
  rating: number;
  reviewCount: number;
  showRating: boolean;
  showReviewCount: boolean;
  enableUserReview: boolean;
  onReviewSubmit?: (rating: number, comment: string) => void;
}

/**
 * 页脚评价区。
 *
 * 必须定义在模块级：旧版把 React.useState 写在 renderFooter 里，而 renderFooter
 * 是父组件渲染期间被调用的普通函数 —— 用户评分/评论这两个 state 会被挂到父组件的
 * hook 链上，启停本插件或 footer 段有无插件都会改变 hook 数量，从而崩在
 * "Rendered more hooks than during the previous render"。
 */
const ReviewFooter: React.FC<ReviewFooterProps> = ({
  rating,
  reviewCount,
  showRating,
  showReviewCount,
  enableUserReview,
  onReviewSubmit,
}) => {
  const [userRating, setUserRating] = React.useState<number>(0);
  const [comment, setComment] = React.useState<string>("");

  return (
    <div style={{ padding: "8px 12px", borderTop: "1px solid #eee" }}>
      {showRating && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div>
            {STARS.map((i) => (
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
            {STARS.map((i) => (
              <Star
                key={`user-${i}`}
                filled={i <= userRating}
                onClick={() => setUserRating(i)}
              />
            ))}
          </div>
          <textarea
            rows={2}
            placeholder="说说你的看法..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{
              width: "100%",
              resize: "vertical",
              padding: 6,
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          />
          <button
            onClick={() => onReviewSubmit?.(userRating, comment)}
            style={{
              padding: "6px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
              background: "#fff",
              color: "#333",
              cursor: "pointer",
            }}
          >
            提交评价
          </button>
        </div>
      )}
    </div>
  );
};

export const createReviewPlugin: PluginCreator<any, ReviewPluginConfig> = (
  config = {}
) => {
  const {
    showRating = true,
    showReviewCount = true,
    enableUserReview = false,
    onReviewSubmit,
  } = config;

  const plugin: CardPlugin = {
    name: "ReviewPlugin",
    version: "1.0.0",
    description: "评分与评价展示插件",
    priority: 30,
    hooks: {
      renderFooter: (context) => {
        const rating: number = (context.data as any)?.rating ?? 0;
        const reviewCount: number = (context.data as any)?.ratingCount ?? 0;

        return (
          <ReviewFooter
            rating={rating}
            reviewCount={reviewCount}
            showRating={showRating}
            showReviewCount={showReviewCount}
            enableUserReview={enableUserReview}
            onReviewSubmit={onReviewSubmit}
          />
        );
      },
    },
    config,
  };

  return plugin;
};
