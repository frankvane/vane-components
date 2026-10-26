/**
 * photo-feed · 摄影 / 图文信息流配方
 *
 * 版式特点：不等高图片、列数随宽度变、筛选条件多。
 * 装配顺序按 priority 自动决定，这里只按"读得懂"的顺序写。
 */
import { createA11yPlugin } from "../../custom-plugins/A11yPlugin";
import { createAutoColumnPlugin } from "../../custom-plugins/AutoColumnPlugin";
import { createGapPlugin } from "../../custom-plugins/GapPlugin";
import { createInfiniteScrollPlugin } from "../../custom-plugins/InfiniteScrollPlugin";
import { createReducedMotionPlugin } from "../../custom-plugins/ReducedMotionPlugin";
import { createTransitionPlugin } from "../../custom-plugins/TransitionPlugin";
import type { WaterfallPlugin } from "../../components/WaterfallPlugin/plugins/types";

export interface PhotoFeedPresetOptions {
  /** 每列最小宽度，默认 240 */
  minColumnWidth?: number;
  /** 列数上限，默认 4 */
  maxColumns?: number;
  /** 间距，默认 16 */
  gap?: number;
  /** 距底多少 px 预加载，默认 400 */
  threshold?: number;
}

export function photoFeedPreset(options: PhotoFeedPresetOptions = {}): WaterfallPlugin[] {
  const { minColumnWidth = 240, maxColumns = 4, gap = 16, threshold = 400 } = options;

  return [
    createAutoColumnPlugin({ minColumnWidth, maxColumns }),
    createGapPlugin({ columnGap: gap, rowGap: gap }),
    createTransitionPlugin({ duration: 260 }),
    createReducedMotionPlugin(),
    createInfiniteScrollPlugin({ threshold }),
    createA11yPlugin({ enableTabIndex: false }),
  ];
}
