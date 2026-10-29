/**
 * 电商评论区预设（vane-comment/presets/ecommerce）
 *
 * 装配：点赞 + 排序（最新 / 最赞，默认最新）+ 楼中楼（深 2）+ 富编辑（emoji + 图片晒单）。
 * 淘宝 / 京东 / 拼多多等电商场景的通用组合：突出图片晒单与最赞。
 */
import { CommentCore, withCommentPlugins } from "../../index";
import { createLikePlugin } from "../../custom-plugins/LikePlugin";
import { createSortPlugin } from "../../custom-plugins/SortPlugin";
import { createThreadPlugin } from "../../custom-plugins/ThreadPlugin";
import { createRichComposerPlugin } from "../../custom-plugins/RichComposerPlugin";
import { createFavoritePlugin } from "../../custom-plugins/FavoritePlugin";
import { createFilterPlugin } from "../../custom-plugins/FilterPlugin";
import { createCountPlugin } from "../../custom-plugins/CountPlugin";
import { createModerationPlugin } from "../../custom-plugins/ModerationPlugin";
import { createReportPlugin } from "../../custom-plugins/ReportPlugin";
import type { CommentPlugin } from "../../components/CommentPlugin/plugins/types";

export function createEcommerceComment(plugins?: CommentPlugin[]) {
  return withCommentPlugins(
    CommentCore,
    plugins ?? [
      createLikePlugin(),
      createSortPlugin({
        modes: ["newest", "mostLiked"],
        defaultMode: "newest",
      }),
      createThreadPlugin({ maxDepth: 2 }),
      createRichComposerPlugin({ features: { emoji: true, image: true } }),
      createFavoritePlugin(),
      createFilterPlugin(),
      createCountPlugin(),
      createModerationPlugin(),
      createReportPlugin(),
    ]
  );
}

/** 默认配置的电商评论区组件 */
export const EcommerceComment = createEcommerceComment();
