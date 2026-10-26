/**
 * InventoryStatusPlugin — 库存状态：实时显示商品库存状态，支持自动刷新和低库存预警。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createInventoryStatusPlugin as create } from "./create";
import type { InventoryStatusPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createInventoryStatusPlugin: LazyImagePluginCreator<InventoryStatusPluginConfig> =
  Object.assign(create, {
    meta: doc,
  }) as LazyImagePluginCreator<InventoryStatusPluginConfig>;

export type { InventoryStatusPluginConfig };
