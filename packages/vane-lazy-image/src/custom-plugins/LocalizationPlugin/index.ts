/**
 * LocalizationPlugin — 国际化：根据用户语言环境自动切换图片，支持手动指定、
 * 自动检测、自定义检测函数与后备图片。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createLocalizationPlugin as create } from "./create";
import type { LocalizationPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createLocalizationPlugin: LazyImagePluginCreator<LocalizationPluginConfig> =
  Object.assign(create, {
    meta: doc,
  }) as LazyImagePluginCreator<LocalizationPluginConfig>;

export type { LocalizationPluginConfig };
