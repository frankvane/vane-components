import { SkuSelectorCore } from "./SkuSelectorCore";
import { withPlugins } from "./withPlugins";
import type { SkuPlugin } from "./plugins/types";

/**
 * 工厂：把插件装到 SkuSelectorCore 上，返回一个可直接使用的组件。
 *
 * 与内核 withPlugins 的差别是这里已绑定 Core，调用方只需给插件数组：
 *   const Sku = createSkuSelector([createPriceLinkPlugin(), createQuotaPlugin()]);
 */
export function createSkuSelector(plugins: SkuPlugin[] = []) {
  return withPlugins(SkuSelectorCore, plugins);
}

/** 不带任何插件的裸选择器（规格按钮组 + 选中摘要） */
export const SkuSelector = createSkuSelector([]);
