/**
 * vane-waterfall 官方插件（26 个）。
 *
 * 分组只是文档口径，实际装配顺序由 priority 决定（越大越先执行）：
 *   perf 80–65 → layout 100–45 → data 40–10 → interaction / ui 0
 * 数据管线内部固定为 Filter(40) → Sort(30) → Search(20) → Pagination(10)。
 *
 * 单个插件也可以走子路径按需引入：`vane-waterfall/custom-plugins/FilterPlugin`。
 */

// ---------------- layout · 布局 ----------------
export { createAlignmentPlugin } from "./AlignmentPlugin";
export type { AlignmentConfig } from "./AlignmentPlugin";
export { createAutoColumnPlugin } from "./AutoColumnPlugin";
export type { AutoColumnConfig } from "./AutoColumnPlugin";
export { createResponsiveColumnsPlugin } from "./ResponsiveColumnsPlugin";
export { createGapPlugin } from "./GapPlugin";
export type { GapConfig } from "./GapPlugin";
export { createFixedHeightPlugin } from "./FixedHeightPlugin";
export type { FixedHeightConfig } from "./FixedHeightPlugin";
export { createPinItemPlugin } from "./PinItemPlugin";
export type { PinItemConfig } from "./PinItemPlugin";

// ---------------- perf · 性能与动效 ----------------
export { createThrottlePlugin } from "./ThrottlePlugin";
export type { ThrottleConfig } from "./ThrottlePlugin";
export { createDebounceLayoutPlugin } from "./DebounceLayoutPlugin";
export type { DebounceConfig } from "./DebounceLayoutPlugin";
export { createReducedMotionPlugin } from "./ReducedMotionPlugin";
export type { ReducedMotionConfig } from "./ReducedMotionPlugin";
export { createTransitionPlugin } from "./TransitionPlugin";
export type { TransitionConfig } from "./TransitionPlugin";

// ---------------- data · 数据管线 ----------------
export { createFilterPlugin } from "./FilterPlugin";
export type { FilterConfig } from "./FilterPlugin";
export { createSortPlugin } from "./SortPlugin";
export type { SortConfig } from "./SortPlugin";
export { createSearchPlugin } from "./SearchPlugin";
export type { SearchConfig } from "./SearchPlugin";
export { createPaginationPlugin } from "./PaginationPlugin";
export type { PaginationConfig } from "./PaginationPlugin";
export { createInfiniteScrollPlugin } from "./InfiniteScrollPlugin";
export type { InfiniteScrollConfig } from "./InfiniteScrollPlugin";

// ---------------- interaction · 交互与埋点 ----------------
export { createClickAnalyticsPlugin } from "./ClickAnalyticsPlugin";
export type { ClickAnalyticsConfig, ClickAnalyticsStats } from "./ClickAnalyticsPlugin";
export { createHeatmapAnalyticsPlugin } from "./HeatmapAnalyticsPlugin";
export type { HeatmapAnalyticsConfig, HeatmapAnalyticsStats } from "./HeatmapAnalyticsPlugin";
export { createDragReorderPlugin } from "./DragReorderPlugin";
export type { DragReorderConfig } from "./DragReorderPlugin";
export { createScrollAnchorPlugin } from "./ScrollAnchorPlugin";
export type { ScrollAnchorConfig } from "./ScrollAnchorPlugin";
export { createRecyclePlugin } from "./RecyclePlugin";
export type { RecycleConfig } from "./RecyclePlugin";

// ---------------- ui · 语义与状态 ----------------
export { createA11yPlugin } from "./A11yPlugin";
export type { A11yConfig } from "./A11yPlugin";
export { createGroupingPlugin } from "./GroupingPlugin";
export type { GroupingConfig } from "./GroupingPlugin";
export { createStickyHeaderPlugin } from "./StickyHeaderPlugin";
export type { StickyHeaderConfig } from "./StickyHeaderPlugin";
export { createBookmarkPlugin } from "./BookmarkPlugin";
export type { BookmarkConfig } from "./BookmarkPlugin";
export { createStatePersistencePlugin } from "./StatePersistencePlugin";
export type { StatePersistenceConfig } from "./StatePersistencePlugin";
export { createURLSyncPlugin } from "./URLSyncPlugin";
export type { URLSyncConfig } from "./URLSyncPlugin";
