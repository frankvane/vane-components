/**
 * SocialSharePlugin — 社交分享：在图片上显示社交分享按钮，支持 Facebook、Twitter、
 * Pinterest、LinkedIn、WhatsApp、WeChat，悬停展开与分享回调。
 * 文档数据见同目录 doc.json；工厂实现见 create.tsx。
 */
import { createSocialSharePlugin as create } from "./create";
import type { SocialSharePluginConfig } from "./create";
import doc from "./doc.json";
import type { LazyImagePluginCreator } from "../../components/LazyLoadImagePlugin/plugins/types";

/** 工厂 + .meta（文档生成与 demo 导航的数据源） */
export const createSocialSharePlugin: LazyImagePluginCreator<SocialSharePluginConfig> =
  Object.assign(create, {
    meta: doc,
  }) as LazyImagePluginCreator<SocialSharePluginConfig>;

export type { SocialSharePluginConfig };
