import type { CardPlugin, PluginCreator } from "../../components/CardPlugin/plugins/types";
import React from "react";

import { ReviewFooter } from "./internal";

export interface ReviewPluginConfig {
  showRating?: boolean;
  showReviewCount?: boolean;
  enableUserReview?: boolean;
  onReviewSubmit?: (rating: number, comment: string) => void;
}

// 公共契约位：工厂泛型默认值 any 保留（不写 T 的调用方依赖默认值）。
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
        const data = context.data as
          | { rating?: number; ratingCount?: number }
          | undefined;
        const rating: number = data?.rating ?? 0;
        const reviewCount: number = data?.ratingCount ?? 0;

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
