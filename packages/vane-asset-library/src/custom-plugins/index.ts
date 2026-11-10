/**
 * 官方插件全家桶（20 个）。
 * 根入口不桶导出（ADR-6）：按需走 vane-asset-library/custom-plugins/<Name>Plugin，
 * 要全量才走 vane-asset-library/entries/plugins。
 */
export * from "./DropzonePlugin";
export * from "./SearchPlugin";
export * from "./KindFilterPlugin";
export * from "./TagFilterPlugin";
export * from "./FolderFilterPlugin";
export * from "./SortPlugin";
export * from "./ViewSwitchPlugin";
export * from "./CountPlugin";
export * from "./SelectAllPlugin";
export * from "./SelectMarkPlugin";
export * from "./KindBadgePlugin";
export * from "./DurationPlugin";
export * from "./StatusBadgePlugin";
export * from "./FavoritePlugin";
export * from "./CardActionsPlugin";
export * from "./MetaLinePlugin";
export * from "./BulkBarPlugin";
export * from "./PaginationPlugin";
export * from "./EmptyStatePlugin";
export * from "./LightBoxPlugin";
