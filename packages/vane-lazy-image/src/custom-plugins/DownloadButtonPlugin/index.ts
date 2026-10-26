/**
 * DownloadButtonPlugin — 下载按钮：为图片添加一键下载功能，支持多位置、自定义样式、
 * 悬停显示与生命周期回调。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createDownloadButtonPlugin as create } from "./create";
import type { DownloadButtonPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createDownloadButtonPlugin: LazyImagePluginCreator<DownloadButtonPluginConfig> =
  Object.assign(create, {
    meta: doc,
  }) as LazyImagePluginCreator<DownloadButtonPluginConfig>;

export type { DownloadButtonPluginConfig };
