/**
 * NetworkAnalyticsPlugin — 网络分析：上报加载耗时、成功率与 CDN 分布。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createNetworkAnalyticsPlugin as create } from "./create";
import type { NetworkAnalyticsPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createNetworkAnalyticsPlugin: LazyImagePluginCreator<NetworkAnalyticsPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<NetworkAnalyticsPluginConfig>;

export type { NetworkAnalyticsPluginConfig };
