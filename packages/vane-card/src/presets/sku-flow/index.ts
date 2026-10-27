/**
 * 配方：SKU 选规格到价格联动
 *
 * SKU（源）→ 数量 → 价格计算 → 库存状态。总线键 sku.selection / sku.variant /
 * sku.price / quantity 在这四个插件之间流转，任何一环缺失都会让价格区失效，
 * 所以打包成配方，避免使用者漏装。
 */

import type { CardPlugin } from "../../components/CardPlugin/plugins/types";
import {
  createSKUPlugin,
  type SKUAttribute,
  type SKUVariant,
} from "../../components/CardPlugin/custom-plugins/SKUPlugin";
import {
  createQuantityPlugin,
  type QuantityPluginConfig,
} from "../../components/CardPlugin/custom-plugins/QuantityPlugin";
import {
  createPriceCalculatorPlugin,
  type PriceCalculatorPluginConfig,
} from "../../components/CardPlugin/custom-plugins/PriceCalculatorPlugin";
import {
  createInventoryPlugin,
  type InventoryPluginConfig,
} from "../../components/CardPlugin/custom-plugins/InventoryPlugin";

export interface SkuFlowPresetOptions {
  /** 属性定义（必填） */
  attributes: SKUAttribute[];
  /** 变体列表（必填） */
  variants: SKUVariant[];
  quantity?: QuantityPluginConfig;
  price?: PriceCalculatorPluginConfig;
  inventory?: InventoryPluginConfig;
  /** 选择控件放页脚还是覆盖层 */
  renderIn?: "footer" | "overlay";
  omit?: Array<"quantity" | "price" | "inventory">;
}

export function skuFlowPreset(options: SkuFlowPresetOptions): CardPlugin[] {
  const { attributes, variants, renderIn } = options;
  const omit = new Set(options.omit ?? []);
  const plugins: CardPlugin[] = [
    createSKUPlugin({ attributes, variants, renderIn }),
  ];

  if (!omit.has("quantity")) {
    plugins.push(createQuantityPlugin({ ...options.quantity }));
  }
  if (!omit.has("price")) {
    plugins.push(createPriceCalculatorPlugin({ ...options.price }));
  }
  if (!omit.has("inventory")) {
    plugins.push(createInventoryPlugin({ ...options.inventory }));
  }

  return plugins;
}

export default skuFlowPreset;
