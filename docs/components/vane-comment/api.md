# 通用评论区引擎 · API

## `withCommentPlugins(CommentCore, plugins)`

返回一个装好插件的组件。这是**推荐用法**（工厂帮你绑定好了 Core，自己装配用 `withCommentPlugins`）。

```tsx
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createLikePlugin } from "vane-comment/custom-plugins/LikePlugin";

const Comment = withCommentPlugins(CommentCore, [
  createLikePlugin(),
  createSortPlugin({ modes: ["newest", "hottest"] }),
  createThreadPlugin({ maxDepth: 3 }),
  createRichComposerPlugin({ features: { emoji: true, image: true, mention: true } }),
]);
```

- 第一参必须传 `CommentCore`（核心列表壳），第二参是插件数组（或 `{ plugins, enableDebug }`）。
- 装配是**纯配置**：模块顶层或 `useMemo` 里调一次，不要在每次渲染里重新 `new`。
- `enableDebug = true` 会打印插件注册与钩子日志（调试用）。

## `<Comment />` props（`CommentCoreProps`）

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `comments` | `Comment[]` | - | 受控评论数据（便捷 prop，映射到内核 `data`）。与 `data` 二选一，二者都会经排序后透传 |
| `data` | `unknown` | - | 内核数据透传（与 `comments` 等价；`comments ?? data`） |
| `onLike` | `(id, nextLiked) => void` | - | 点赞切换回调（乐观更新由 consumer 完成，组件不缓存点赞态） |
| `onReply` | `(parentId, content: CommentNode[]) => void` | - | 楼中楼回复提交回调（`content` 为结构化富内容） |
| `onSubmit` | `(content: CommentNode[]) => void` | - | 根评论提交回调 |
| `onSortChange` | `(mode: SortMode) => void` | - | 排序模式变化回调 |
| `onLoadMore` | `() => void` | - | 加载更多回调（传入才显示按钮） |
| `onReport` | `(id) => void` | - | 举报回调 |
| `mentions` | `{ id, name, avatar? }[]` | - | @提及候选（RichComposer 下拉） |
| `defaultSortMode` | `SortMode` | `"custom"` | 默认排序（SortPlugin 未命中时兜底） |
| `loading` | `boolean` | `false` | 加载中（显示「加载中…」并隐藏加载更多） |
| `emptyText` | `ReactNode` | `还没有评论，快来抢沙发~` | 空态文案 |
| `pageSize` | `number` | - | 单页条数（留作扩展，当前仅影响分页 UI 文案） |
| `containerClassName` / `containerStyle` | `string` / `CSSProperties` | - | 容器类名 / 内联样式 |
| `onMount` / `onUnmount` | `() => void` | - | 生命周期回调 |
| `debug` | `boolean` | `false` | 打印插件注册与钩子日志 |

### Ref（`CommentCoreRef`）

| 方法 | 说明 |
| --- | --- |
| `getContainer()` | 取根 DOM |
| `forceUpdate()` | 强制刷新 |
| `getSize()` | 取容器尺寸 `{ width, height }` |

## 插件工厂

| 工厂 | 子路径 | 关键配置 |
| --- | --- | --- |
| `createLikePlugin({ showCount })` | `.../custom-plugins/LikePlugin` | `showCount`（默认 `true`：是否显示点赞数，false 只显示爱心） |
| `createSortPlugin({ modes, defaultMode })` | `.../custom-plugins/SortPlugin` | `modes`（排序栏按钮，默认 `["newest","hottest","mostLiked"]`）；`defaultMode`（默认 `"newest"`，仅在消费方未传 `defaultSortMode` 时播种） |
| `createThreadPlugin({ maxDepth, defaultExpanded, showReply })` | `.../custom-plugins/ThreadPlugin` | `maxDepth`（默认 `3`，超过不再渲染更深楼中楼）；`defaultExpanded`（默认 `true`）；`showReply`（默认 `true`：是否渲染内联回复触发） |
| `createRichComposerPlugin({ features, placeholder, submitText })` | `.../custom-plugins/RichComposerPlugin` | `features`（默认全开：emoji / image / mention 按平台开关）；`placeholder`（默认 `说点什么吧…`）；`submitText`（默认 `发布`） |

完整配置项与特性见 [插件目录](plugins.md)。

## 平台预设

整装逃生口：同一内核 + 四插件差异化配置，证明跨平台通用。返回值是已装好插件的组件。

| 预设 | 装配 | 适用 |
| --- | --- | --- |
| `createVideoComment()` | 点赞 + 排序(最热/最新,默认最热) + 楼中楼(深3) + 富编辑(emoji+图片) | 抖音 / B站 / 视频号 |
| `createSocialComment()` | 点赞 + 排序(全模式,默认最新) + 楼中楼(深3) + 富编辑(emoji+图片+@提及) | 微博 / 朋友圈 / 小红书 |
| `createEcommerceComment()` | 点赞 + 排序(最新/最赞,默认最新) + 楼中楼(深2) + 富编辑(emoji+图片晒单) | 淘宝 / 京东 / 拼多多 |

也可只取导出的成品组件（已按默认配置装配）：`VideoComment` / `SocialComment` / `EcommerceComment`。

```tsx
import { createSocialComment } from "vane-comment/presets/social";
const Comment = createSocialComment(); // 或传入自定义插件数组覆盖默认
```

预设入口：`vane-comment/presets/video` · `vane-comment/presets/social` · `vane-comment/presets/ecommerce`。

## 渲染插槽（复用内核基建）

内核 9 钩子 + 评论领域 4 槽，槽经包内 `renderCommentSlot` 消费（复用内核 `priority` 排序 + 错误边界单槽隔离）：

| 层级 | 领域钩子 | 典型用途 |
| --- | --- | --- |
| 列表级顶栏 | `renderToolbar` | 排序栏（SortPlugin）/ 计数 |
| 列表级底部 | `renderFooter` | 根评论框（RichComposerPlugin）/ 加载更多 |
| 逐条操作行 | `renderCommentActions` | 点赞 / 回复按钮（payload = 当前评论） |
| 逐条楼中楼 | `renderNested` | 嵌套回复区（payload = 当前评论的 `replies`） |

`useCommentContext()` 取评论专属上下文（`comments` 已排序列表 / `sortMode` / `setSortMode`）；`useCommentSlot(name, payload?)` 在插件内消费对应槽。

## 插件上下文 `CommentPluginContext`

在内核 `PluginContext`（`props` / `data` / `bus` / `refs` / `state` / `setState` / `shared` / `deviceInfo` / `forceUpdate` / `getSize` / `logger`）之上追加：

| 字段 | 说明 |
| --- | --- |
| `comments` | 经排序后的评论列表 |
| `sortMode` | 当前排序模式（SortPlugin 写入 state；无 SortPlugin 时为 `defaultSortMode`） |
| `setSortMode(mode)` | 切换排序模式（写入内核 state，触发 context 重建与列表重排） |

## 领域类型

```ts
type SortMode = "newest" | "oldest" | "hottest" | "mostLiked" | "custom";
type CommentStatus = "normal" | "pending" | "deleted";

interface CommentNode {
  type: "text" | "emoji" | "image" | "mention";
  value?: string;   // text / emoji
  url?: string;     // image
  alt?: string;     // image
  userId?: string;  // mention
  name?: string;    // mention
}

interface CommentAuthor {
  id: string; name: string; avatar?: string; verified?: boolean; badge?: string;
}

interface Comment {
  id: string;
  author: CommentAuthor;
  content: CommentNode[];
  text?: string;
  createdAt: number;
  likeCount: number;          // 必填
  liked?: boolean;
  replies?: Comment[];
  replyCount?: number;
  pinned?: boolean;
  status?: CommentStatus;
  images?: { url: string; alt?: string; width?: number; height?: number }[];
  hotScore?: number;
}
```

上述类型均从 `vane-comment` 根入口导出（`import type { Comment, CommentNode, CommentAuthor, SortMode } from "vane-comment"`）。
