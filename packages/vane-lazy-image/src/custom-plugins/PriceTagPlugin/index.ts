/**
 * PriceTagPlugin — 商品价格标签：在图片上叠加价格信息，支持原价、折扣、
 * 节省金额、异步价格获取（API 集成）与淡入动画。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createPriceTagPlugin as create } from "./create";
import type { PriceTagPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createPriceTagPlugin: LazyImagePluginCreator<PriceTagPluginConfig> =
  Object.assign(create, {
    meta: doc,
  }) as LazyImagePluginCreator<PriceTagPluginConfig>;

export type { PriceTagPluginConfig };
