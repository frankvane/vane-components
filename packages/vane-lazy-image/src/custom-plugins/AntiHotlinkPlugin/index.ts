/**
 * AntiHotlinkPlugin — 防盗链：为 URL 追加签名 token，并限制允许的域名。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createAntiHotlinkPlugin as create } from "./create";
import type { AntiHotlinkPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createAntiHotlinkPlugin: LazyImagePluginCreator<AntiHotlinkPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<AntiHotlinkPluginConfig>;

export type { AntiHotlinkPluginConfig };
