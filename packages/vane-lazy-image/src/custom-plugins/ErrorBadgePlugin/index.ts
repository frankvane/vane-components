/**
 * ErrorBadgePlugin — 错误徽标：加载失败时在角落显示错误徽标。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createErrorBadgePlugin as create } from "./create";
import type { ErrorBadgeConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createErrorBadgePlugin: LazyImagePluginCreator<ErrorBadgeConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ErrorBadgeConfig>;

export type { ErrorBadgeConfig };
