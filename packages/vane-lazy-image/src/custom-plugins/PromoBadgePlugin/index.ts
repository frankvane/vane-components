/**
 * PromoBadgePlugin — 促销角标：在商品图片上显示 NEW/HOT/SALE 等促销标签，
 * 支持脉冲动画和丝带样式，同一图片可叠加多个角标。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createPromoBadgePlugin as create } from "./create";
import type { PromoBadgePluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createPromoBadgePlugin: LazyImagePluginCreator<PromoBadgePluginConfig> =
  Object.assign(create, {
    meta: doc,
  }) as LazyImagePluginCreator<PromoBadgePluginConfig>;

export type { PromoBadgePluginConfig };
