import type { CardPlugin, PluginCreator } from "../../components/CardPlugin/plugins/types";
import React from "react";

import { ReviewFooter } from "./internal";

export interface ReviewPluginConfig {
  showRating?: boolean;
  showReviewCount?: boolean;
  enableUserReview?: boolean;
  onReviewSubmit?: (rating: number, comment: string) => void;
}

// 工厂返回 T 收敛为 unknown：T 仅经 data 透传，自定义 data 形态的调用方请显式写泛型参数。
export const createReviewPlugin: PluginCreator<unknown, ReviewPluginConfig> = (
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
