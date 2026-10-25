/**
 * BadgePlugin — 角标徽章：按加载状态（loading/loaded/error）在四角或中心显示文字徽章。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createBadgePlugin as create } from "./create";
import type { BadgePluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createBadgePlugin: LazyImagePluginCreator<BadgePluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<BadgePluginConfig>;

export type { BadgePluginConfig };
