/**
 * OfflinePlugin — 离线支持：网络断开时显示离线提示覆盖层。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createOfflinePlugin as create } from "./create";
import type { OfflinePluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createOfflinePlugin: LazyImagePluginCreator<OfflinePluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<OfflinePluginConfig>;

export type { OfflinePluginConfig };
