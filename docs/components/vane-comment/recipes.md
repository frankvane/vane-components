# 通用评论区引擎 · 组合配方

配方 = 一组插件的预设组合，用来降低「不知道该装哪几个」的成本。**配方只是快捷方式，不是白名单**——任何插件都能单独引入。

## 平台预设（推荐起步）

同一内核 + 四插件差异化配置。直接拿现成的：

```tsx
import { createVideoComment } from "vane-comment/presets/video";
import { createSocialComment } from "vane-comment/presets/social";
import { createEcommerceComment } from "vane-comment/presets/ecommerce";

// 视频：最热优先 + 深 3 楼中楼 + emoji/图片
const VideoComment = createVideoComment();

// 社交：全排序 + 深 3 楼中楼 + emoji/图片/@提及
const SocialComment = createSocialComment();

// 电商：最新/最赞 + 深 2 楼中楼 + emoji/图片晒单
const EcommerceComment = createEcommerceComment();
```

| 预设 | 排序 | 楼中楼深 | 富编辑 |
| --- | --- | --- | --- |
| 视频 (`/presets/video`) | 最热 / 最新（默认最热） | 3 | emoji + 图片 |
| 社交 (`/presets/social`) | 最新 / 最早 / 最热 / 最赞（默认最新） | 3 | emoji + 图片 + @提及 |
| 电商 (`/presets/ecommerce`) | 最新 / 最赞（默认最新） | 2 | emoji + 图片 |

预设的 `create*Comment(plugins?)` 也接受自定义插件数组覆盖默认装配。

## 视频评论区（手动装配）

```tsx
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createLikePlugin } from "vane-comment/custom-plugins/LikePlugin";
import { createSortPlugin } from "vane-comment/custom-plugins/SortPlugin";
import { createThreadPlugin } from "vane-comment/custom-plugins/ThreadPlugin";
import { createRichComposerPlugin } from "vane-comment/custom-plugins/RichComposerPlugin";

export const VideoComment = withCommentPlugins(CommentCore, [
  createLikePlugin(),
  createSortPlugin({ modes: ["hottest", "newest"], defaultMode: "hottest" }),
  createThreadPlugin({ maxDepth: 3 }),
  createRichComposerPlugin({ features: { emoji: true, image: true } }),
]);
```

## 社交评论区（加 @提及）

```tsx
export const SocialComment = withCommentPlugins(CommentCore, [
  createLikePlugin(),
  createSortPlugin({
    modes: ["newest", "oldest", "hottest", "mostLiked"],
    defaultMode: "newest",
  }),
  createThreadPlugin({ maxDepth: 3 }),
  createRichComposerPlugin({
    features: { emoji: true, image: true, mention: true },
  }),
]);

// 使用时把候选名单喂给组件：
<SocialComment
  comments={comments}
  mentions={[{ id: "u1", name: "Monica" }, { id: "u2", name: "Ross" }]}
  onLike={...} onReply={...} onSubmit={...}
/>;
```

## 电商评论区（突出晒单与最赞）

```tsx
export const EcommerceComment = withCommentPlugins(CommentCore, [
  createLikePlugin(),
  createSortPlugin({ modes: ["newest", "mostLiked"], defaultMode: "newest" }),
  createThreadPlugin({ maxDepth: 2 }),
  createRichComposerPlugin({ features: { emoji: true, image: true } }),
]);
```

## 只要点赞 + 排序（极简）

```tsx
export const MiniComment = withCommentPlugins(CommentCore, [
  createLikePlugin(),
  createSortPlugin({ modes: ["newest"] }),
]);
```

## 动态引入（低频 / 重型插件）

```tsx
const { createThreadPlugin } = await import("vane-comment/custom-plugins/ThreadPlugin");
```

## 推荐做法

- 常用组合沉淀为预设导出在业务侧（3–5 个起步即可）；平台差异靠「装配 + 配置」表达，不 fork 内核；
- 插件一律走子路径按需引入（ADR-6），只有确实全都要用才引 `vane-comment/custom-plugins` 桶；
- 点赞态 / 评论数据真相放在消费方：`onLike` / `onReply` / `onSubmit` 拿到事件后改自己的 `comments` 回流，组件不内置后端、不缓存草稿；
- `likeCount` 是必填字段，漏传会导致点赞计数与「最赞」排序失效。
