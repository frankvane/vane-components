/**
 * product-feed · 商品 / 后台列表配方
 *
 * 版式特点：等高卡片（图固定比例）、有筛选排序、分页、需要点击埋点。
 * 数据管线固定为 Filter → Sort → Search → Pagination（priority 已内置）。
 */
import { createClickAnalyticsPlugin } from "../../custom-plugins/ClickAnalyticsPlugin";
import { createFilterPlugin } from "../../custom-plugins/FilterPlugin";
import { createFixedHeightPlugin } from "../../custom-plugins/FixedHeightPlugin";
import { createPaginationPlugin } from "../../custom-plugins/PaginationPlugin";
import { createSortPlugin } from "../../custom-plugins/SortPlugin";
import { createResponsiveColumnsPlugin } from "../../custom-plugins/ResponsiveColumnsPlugin";
import { createTransitionPlugin } from "../../custom-plugins/TransitionPlugin";
import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export interface ProductFeedPresetOptions {
  /** 统一卡片高度，默认 300 */
  itemHeight?: number;
  /** 每页条数，默认 24 */
  pageSize?: number;
}

export function productFeedPreset(options: ProductFeedPresetOptions = {}): WaterfallPlugin[] {
  const { itemHeight = 300, pageSize = 24 } = options;

  return [
    createResponsiveColumnsPlugin({
      breakpoints: {
        mobile: { width: 0, columns: 2 },
        tablet: { width: 720, columns: 3 },
        desktop: { width: 1100, columns: 4 },
      },
    }),
    createFixedHeightPlugin({ itemHeight }),
    createFilterPlugin({ scrollToTop: true }),
    createSortPlugin({ scrollToTop: true }),
    createPaginationPlugin({ pageSize, scrollToTop: true }),
    createTransitionPlugin({ duration: 200 }),
    createClickAnalyticsPlugin(),
  ];
}
