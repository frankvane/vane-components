/**
 * 配方：商品展示卡
 *
 * 最常用的一组——主图 + 角标 + 悬停反馈 + 加购/收藏 + 状态初值。
 * 用法：
 *   import { productCardPreset } from "vane-card/presets/product-card";
 *   const Card = withPlugins(CardCore, { plugins: productCardPreset({ badge: { text: "甄选" } }) });
 *
 * 配方只是「一组插件的工厂」，没有任何隐藏行为：每一项都可以单独覆盖或替换，
 * 也可以把它们拆开只取其中几个。
 */

import type { CardPlugin } from "../../components/CardPlugin/plugins/types";
import {
  createImagePlugin,
  type ImagePluginConfig,
} from "../../custom-plugins/ImagePlugin";
import {
  createBadgePlugin,
  type BadgePluginConfig,
} from "../../custom-plugins/BadgePlugin";
import {
  createHoverPlugin,
  type HoverPluginConfig,
} from "../../custom-plugins/HoverPlugin";
import {
  createActionsPlugin,
  type ActionsPluginConfig,
} from "../../custom-plugins/ActionsPlugin";
import {
  createStatePlugin,
  type StatePluginConfig,
} from "../../custom-plugins/StatePlugin";

export interface ProductCardPresetOptions {
  image?: ImagePluginConfig;
  badge?: BadgePluginConfig;
  hover?: HoverPluginConfig;
  actions?: ActionsPluginConfig;
  state?: StatePluginConfig;
  /** 单独关掉某个插件（默认全部开启） */
  omit?: Array<"image" | "badge" | "hover" | "actions" | "state">;
}

export function productCardPreset(
  options: ProductCardPresetOptions = {}
): CardPlugin[] {
  const omit = new Set(options.omit ?? []);
  const plugins: CardPlugin[] = [];

  if (!omit.has("image")) plugins.push(createImagePlugin({ ...options.image }));
  if (!omit.has("badge")) plugins.push(createBadgePlugin({ ...options.badge }));
  if (!omit.has("hover")) plugins.push(createHoverPlugin({ ...options.hover }));
  if (!omit.has("actions")) {
    plugins.push(createActionsPlugin({ ...options.actions }));
  }
  if (!omit.has("state")) plugins.push(createStatePlugin({ ...options.state }));

  return plugins;
}

export default productCardPreset;
