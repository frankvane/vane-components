/**
 * 子路径入口 `vane-asset-library/entries/plugins` —— 插件系统 + 官方插件全家桶（20 个）。
 * 只要装配器请走根入口的 withAssetLibraryPlugins；要全量官方插件走这里。
 */
export {
  withPlugins,
  withAssetLibraryPlugins,
} from "../components/AssetLibraryPlugin/withPlugins";
export { createAssetLibrary } from "../components/AssetLibraryPlugin/createAssetLibrary";
export type {
  AssetPlugin,
  AssetLibraryContext,
  AssetPluginHooks,
  AssetPluginCreator,
} from "../components/AssetLibraryPlugin/plugins/types";

export * from "../custom-plugins";
