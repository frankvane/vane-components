/**
 * OfflinePlugin — 离线支持：网络断开时显示离线提示覆盖层。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createOfflinePlugin as create } from "./create";
import type { OfflineConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createOfflinePlugin: LazyImagePluginCreator<OfflineConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<OfflineConfig>;

export type { OfflineConfig };
