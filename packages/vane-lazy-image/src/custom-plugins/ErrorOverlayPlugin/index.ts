/**
 * ErrorOverlayPlugin — 错误覆盖层：加载失败时显示遮层与重试按钮。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createErrorOverlayPlugin as create } from "./create";
import type { ErrorOverlayConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createErrorOverlayPlugin: LazyImagePluginCreator<ErrorOverlayConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ErrorOverlayConfig>;

export type { ErrorOverlayConfig };
