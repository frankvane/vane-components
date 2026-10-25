/**
 * UserBehaviorPlugin — 用户行为采集：统计停留时长、点击与进出视口次数。
 * 文档数据见同目录 doc.json；工厂实现见 create.ts。
 */
import { createUserBehaviorPlugin as create } from "./create";
import type { UserBehaviorConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createUserBehaviorPlugin: LazyImagePluginCreator<UserBehaviorConfig> = Object.assign(create, {
  meta: doc,
}) as LazyImagePluginCreator<UserBehaviorConfig>;

export type { UserBehaviorConfig };
