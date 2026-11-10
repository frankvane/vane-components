import { AssetLibraryCore } from "./AssetLibraryCore";
import { withPlugins } from "./withPlugins";
import type { AssetPlugin } from "./plugins/types";

/**
 * 工厂：把插件装到 AssetLibraryCore 上，返回可直接使用的组件。
 *
 *   const Library = createAssetLibrary([createSearchPlugin(), createSortPlugin()]);
 *
 * 用 .ts 而非 .tsx：本文件不含 JSX，却同时导出工厂函数与组件实例；
 * 放在 .tsx 里会触发 react-refresh 的「只导出组件」告警。
 */
export function createAssetLibrary(plugins: AssetPlugin[] = []) {
  return withPlugins(AssetLibraryCore, plugins);
}

/** 不带任何插件的裸网格墙（只有卡片、键盘导航与兜底空态） */
export const AssetLibrary = createAssetLibrary([]);
