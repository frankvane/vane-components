/**
 * ResponsivePlugin — 响应式图片：注入 srcset/sizes 多宽度资源，可按宽度生成链接。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createResponsivePlugin as create } from "./create";
import type { ResponsivePluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createResponsivePlugin: LazyImagePluginCreator<ResponsivePluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<ResponsivePluginConfig>;

export type { ResponsivePluginConfig };
