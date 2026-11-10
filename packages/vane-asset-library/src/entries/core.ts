/**
 * 子路径入口 `vane-asset-library/entries/core` —— 只要核心组件时导入这里，体积最小。
 * 仅 AssetLibraryCore + 装配器 + props/ref 类型。
 */
export { AssetLibraryCore } from "../components/AssetLibraryPlugin/AssetLibraryCore";
export {
  withPlugins,
  withAssetLibraryPlugins,
} from "../components/AssetLibraryPlugin/withPlugins";
export { createAssetLibrary, AssetLibrary } from "../components/AssetLibraryPlugin/createAssetLibrary";
export type {
  AssetItem,
  AssetFolder,
  AssetLibraryCoreProps,
  AssetLibraryCoreRef,
} from "../components/AssetLibraryPlugin/plugins/types";
