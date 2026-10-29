/**
 * 子路径入口 `vane-sku/entries/plugins` —— 插件系统 + 官方插件全家桶（12 个）。
 * 写自己的插件只用 `vane-sku` 根入口的 withPlugins；要全量官方插件走这里。
 */
export { withPlugins } from "../components/SkuPlugin/withPlugins";
export type {
  SkuPlugin,
  SkuPluginContext,
  SkuPluginHooks,
  SkuPluginCreator,
} from "../components/SkuPlugin/plugins/types";

export * from "../custom-plugins";
