/**
 * 社交评论区预设（vane-comment/presets/social）
 *
 * 装配：点赞 + 排序（全模式，默认最新）+ 楼中楼（深 3）+ 富编辑（emoji + 图片 + @提及）。
 * 微博 / 朋友圈 / 小红书等社交场景的通用组合。
 */
import { CommentCore, withCommentPlugins } from "../../index";
import { createLikePlugin } from "../../custom-plugins/LikePlugin";
import { createSortPlugin } from "../../custom-plugins/SortPlugin";
import { createThreadPlugin } from "../../custom-plugins/ThreadPlugin";
import { createRichComposerPlugin } from "../../custom-plugins/RichComposerPlugin";
import { createReportPlugin } from "../../custom-plugins/ReportPlugin";
import { createSharePlugin } from "../../custom-plugins/SharePlugin";
import { createCopyPlugin } from "../../custom-plugins/CopyPlugin";
import { createReactionPlugin } from "../../custom-plugins/ReactionPlugin";
import { createFavoritePlugin } from "../../custom-plugins/FavoritePlugin";
import { createPinPlugin } from "../../custom-plugins/PinPlugin";
import { createLocationPlugin } from "../../custom-plugins/LocationPlugin";
import { createTimestampPlugin } from "../../custom-plugins/TimestampPlugin";
import { createCountPlugin } from "../../custom-plugins/CountPlugin";
import { createFilterPlugin } from "../../custom-plugins/FilterPlugin";
import { createSearchPlugin } from "../../custom-plugins/SearchPlugin";
import { createModerationPlugin } from "../../custom-plugins/ModerationPlugin";
import { createLoginPromptPlugin } from "../../custom-plugins/LoginPromptPlugin";
import type { CommentPlugin } from "../../components/CommentPlugin/plugins/types";

export function createSocialComment(plugins?: CommentPlugin[]) {
  return withCommentPlugins(
    CommentCore,
    plugins ?? [
      createLikePlugin(),
      createSortPlugin({
        modes: ["newest", "oldest", "hottest", "mostLiked"],
        defaultMode: "newest",
      }),
      createThreadPlugin({ maxDepth: 3 }),
      createRichComposerPlugin({
        features: { emoji: true, image: true, mention: true },
      }),
      createReportPlugin(),
      createSharePlugin(),
      createCopyPlugin(),
      createReactionPlugin(),
      createFavoritePlugin(),
      createPinPlugin(),
      createLocationPlugin(),
      createTimestampPlugin(),
      createCountPlugin(),
      createFilterPlugin(),
      createSearchPlugin(),
      createModerationPlugin(),
      createLoginPromptPlugin(),
    ]
  );
}

/** 默认配置的社交评论区组件 */
export const SocialComment = createSocialComment();
