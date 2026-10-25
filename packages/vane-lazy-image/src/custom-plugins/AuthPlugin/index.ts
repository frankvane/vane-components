/**
 * AuthPlugin — 鉴权支持：为图片 URL 追加 token 参数并配置跨域/Referrer 策略。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createAuthPlugin as create } from "./create";
import type { AuthPluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createAuthPlugin: LazyImagePluginCreator<AuthPluginConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<AuthPluginConfig>;

export type { AuthPluginConfig };
