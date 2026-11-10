/**
 * vane-asset-library 主入口（子路径 "."）
 *
 * 只导出「核心 + 装配 + 纯函数 + 类型」，插件一律走子路径按需引入（ADR-6）：
 *   import { createSearchPlugin } from "vane-asset-library/custom-plugins/SearchPlugin";
 */
export { AssetLibraryCore } from "./components/AssetLibraryPlugin/AssetLibraryCore";
export { withPlugins, withAssetLibraryPlugins } from "./components/AssetLibraryPlugin/withPlugins";
export { createAssetLibrary, AssetLibrary } from "./components/AssetLibraryPlugin/createAssetLibrary";

/** 领域纯函数：宿主可复用同一套口径做预检 / 服务端排序 */
export {
  normalizeAssets,
  normalizeFolders,
  normalizeSelection,
  filterAssets,
  sortAssets,
  paginateAssets,
  isAssetSelectable,
  formatDuration,
  formatSize,
  buildTagFacets,
  buildFolderFacets,
  resolveEmptyReason,
  titleOf,
  toTimestamp,
} from "./components/AssetLibraryPlugin/domain";
export type { NormalizeResult, PageResult, TagFacet } from "./components/AssetLibraryPlugin/domain";

export type {
  AssetKind,
  AssetStatus,
  AssetSortKey,
  AssetSortDir,
  AssetView,
  AssetEmptyReason,
  AssetItem,
  AssetFolder,
  AssetFilter,
  AssetSort,
  AssetLibraryState,
  AssetCardView,
  AssetSlots,
  AssetLibraryCoreProps,
  AssetLibraryCoreRef,
  AssetLibraryContext,
  AssetPlugin,
  AssetPluginHooks,
  AssetPluginCreator,
} from "./components/AssetLibraryPlugin/plugins/types";
export { EMPTY_SLOTS, DECORATIVE_SLOTS } from "./components/AssetLibraryPlugin/plugins/types";
