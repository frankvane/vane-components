/**
 * SvgPlaceholderPlugin — SVG 占位符覆盖层：支持静态或动态生成，加载成功后淡出。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createSvgPlaceholderPlugin as create } from "./create";
import type { SvgPlaceholderConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createSvgPlaceholderPlugin: LazyImagePluginCreator<SvgPlaceholderConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<SvgPlaceholderConfig>;

export type { SvgPlaceholderConfig };
