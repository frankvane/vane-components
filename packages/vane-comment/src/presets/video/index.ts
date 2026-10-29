/**
 * 视频评论区预设（vane-comment/presets/video）
 *
 * 装配：点赞 + 排序（最热/最新，默认最热）+ 楼中楼（深 3）+ 富编辑（emoji + 图片）。
 * 抖音 / B站 / 视频号等视频场景的通用组合——同一内核，只换配置。
 */
import { CommentCore, withCommentPlugins } from "../../index";
import { createLikePlugin } from "../../custom-plugins/LikePlugin";
import { createSortPlugin } from "../../custom-plugins/SortPlugin";
import { createThreadPlugin } from "../../custom-plugins/ThreadPlugin";
import { createRichComposerPlugin } from "../../custom-plugins/RichComposerPlugin";
import { createReportPlugin } from "../../custom-plugins/ReportPlugin";
import { createSharePlugin } from "../../custom-plugins/SharePlugin";
import { createCountPlugin } from "../../custom-plugins/CountPlugin";
import { createModerationPlugin } from "../../custom-plugins/ModerationPlugin";
import { createLoginPromptPlugin } from "../../custom-plugins/LoginPromptPlugin";
import type { CommentPlugin } from "../../components/CommentPlugin/plugins/types";

export function createVideoComment(plugins?: CommentPlugin[]) {
  return withCommentPlugins(
    CommentCore,
    plugins ?? [
      createLikePlugin(),
      createSortPlugin({ modes: ["hottest", "newest"], defaultMode: "hottest" }),
      createThreadPlugin({ maxDepth: 3 }),
      createRichComposerPlugin({ features: { emoji: true, image: true } }),
      createReportPlugin(),
      createSharePlugin(),
      createCountPlugin(),
      createModerationPlugin(),
      createLoginPromptPlugin(),
    ]
  );
}

/** 默认配置的视频评论区组件 */
export const VideoComment = createVideoComment();
