/**
 * ScrollIdlePlugin — 滚动空闲加载：滚动停止后再发起加载，避免与滚动争抢带宽。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createScrollIdlePlugin as create } from "./create";
import type { ScrollIdleConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createScrollIdlePlugin: LazyImagePluginCreator<ScrollIdleConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ScrollIdleConfig>;

export type { ScrollIdleConfig };
