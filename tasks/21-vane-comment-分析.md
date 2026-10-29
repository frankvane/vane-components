# vane-comment 分析文档（P1 分析 · 奇数编号）

> 配套实施清单：`22-vane-comment-实施清单.md`
> 基线：vane-sku（骨架/插件样板）+ vane-profile（peer 外部化派 + 领域槽机制）
> 创建时间：2026-10-29

## 0. 一句话定位

**插件式通用评论区引擎**：`CommentCore` 只负责"数据驱动渲染评论列表 + 生命周期转发"，其余全部能力（点赞 / 排序 / 楼中楼 / 富编辑）通过插件按需组合。**视频 / 社交 / 电商评论区的差异不在内核，而在"装配了哪些插件 + 各自的配置"**——同一份内核，三套预设即可通用。

## 1. 硬性决策（已拍板）

| 项 | 决策 | 理由 |
|---|---|---|
| core 依赖派系 | **peer 外部化**（vane-plugin-core 走 peer + 构建外置，对齐 vane-profile） | 评论区是"家族型"组件：不同平台按需装配不同插件集合，内核必须最小、可被多包共享一份 |
| 入口划分 | 根 `.`（Core+装配+领域槽+类型，≤4KB）+ `./entries/core` + `./entries/plugins` + `./custom-plugins/*` + `./presets/*` | 根不桶导出插件（ADR-6）；预设是"逃生口式"整装，仍走独立子路径 |
| 数据模型 | **受控 / 展示型**（consumer 拥有数据 + 回调，组件无内置后端） | "通用跨平台"的前提：每个平台有各自 API/数据形态，组件只渲染 + 回调 |
| 富内容模型 | 结构化 `CommentNode[]`（text/emoji/image/mention），非纯字符串 | 抖音/电商/社交评论都是"文字+表情+图片+@"，结构化才能通用渲染 |
| 体积预算 | 根入口 `sizeBudgetKb: 4`；子路径插件各 `2` | 对齐 vane-profile（3.5KB）/ vane-sku（插件 2KB）同量级 |
| demo 策略 | P2 再做（本阶段只交付骨架+内核+插件+dist 绿） | 见实施清单 |

## 2. 插槽设计（4 个领域槽，复用内核基建）

评论区渲染分"列表级"与"逐条级"两类。内核 `renderHeader/renderFooter/renderOverlay` 是全局槽，不够表达"逐条"语义，因此**沿用 vane-profile 的包内领域槽机制**（`CommentSlotProvider` + `renderCommentSlot`，复用内核 order 排序 + priority 决策 + `PluginErrorBoundary` 单槽隔离），并支持逐条 payload：

| 槽位名 | 级别 | 映射需求 | 承载插件 |
|---|---|---|---|
| `renderToolbar` | 列表级（顶栏） | 排序栏 / 计数 / 筛选 | `SortPlugin` |
| `renderFooter` | 列表级（底部） | 根评论框 + 加载更多 | `RichComposerPlugin` |
| `renderCommentActions` | **逐条**（payload=comment） | 点赞按钮 / 回复触发 | `LikePlugin`、`ThreadPlugin` |
| `renderNested` | **逐条**（payload=comment） | 楼中楼嵌套渲染 | `ThreadPlugin` |

- `renderCommentSlot(plugins, context, hookName, payload?)`：逐条槽把 `comment` 作为第二参数传给钩子 `(context, comment) => ReactNode`。
- 列表级槽（toolbar/footer）走内核 `composeSlots` / 领域槽，无 payload。
- 单槽渲染抛错只丢自己那一段（错误边界隔离），不影响整条评论。

> 注：点赞的"爆裂动画"**不**走 overlay 全局槽（overlay 只在宿主渲染时求值，点哪条难定位）。改为 `LikeButton` 组件内部用 CSS keyframe 局部动画，点击即触发——规避 pitfall 1.1。

## 3. 四核心插件清单与需求映射

| 用户需求 | 插件 | 槽位 | 关键实现 |
|---|---|---|---|
| 点赞 | `LikePlugin` | `renderCommentActions` | 读取 `comment.liked/likeCount`，调 `context.props.onLike(id, next)`；本地爆裂动画；真相在 consumer 数据 |
| 排序 | `SortPlugin` | `renderToolbar` + `transformData` | `transformData` 按 `state.sortMode` 重排列表；`renderToolbar` 渲染排序栏，`onChange` 调 `context.setSortMode`（写内核 state→重渲→重排）；支持 `newest/oldest/hottest/mostLiked` |
| 楼中楼 | `ThreadPlugin` | `renderNested` + `renderCommentActions` | 递归渲染 `comment.replies`，`maxDepth` 限深（默认 3）+ 展开/收起（组件本地 state）；"回复"按钮唤起内联轻量回复框，提交调 `onReply(parentId, content)` |
| 富编辑 | `RichComposerPlugin` | `renderFooter` | 根评论框：textarea + 工具条（emoji 选择器 / 图片 / @提及），输出 `CommentNode[]` 调 `onSubmit`；按 `features` 配置开关，平台按需启用 |

### 首发插件（4 个）+ 数据属性
- 置顶（`pinned`）、删除/待审（`status`）、图片（`images`）、热度（`hotScore`）作为**数据属性**由 Core 直接渲染（徽标/占位），不另立插件——它们是数据态不是行为，跨平台通用。

## 4. 数据模型（types.ts）

```ts
type CommentNode =
  | { type: "text"; value: string }
  | { type: "emoji"; value: string }
  | { type: "image"; url: string; alt?: string }
  | { type: "mention"; userId: string; name: string };

interface CommentAuthor { id: string; name: string; avatar?: string; verified?: boolean; badge?: string; }
interface CommentImage { url: string; alt?: string; width?: number; height?: number; }
interface Comment {
  id: string; author: CommentAuthor;
  content: CommentNode[]; text?: string;        // 纯文本兜底
  createdAt: number; likeCount: number; liked?: boolean;
  replies?: Comment[]; replyCount?: number;      // 楼中楼（replyCount 可 > replies.length 表示懒加载）
  pinned?: boolean; status?: "normal"|"pending"|"deleted";
  images?: CommentImage[]; hotScore?: number;
}
type SortMode = "newest"|"oldest"|"hottest"|"mostLiked";
```

### CommentCoreProps（受控）
`comments?`（便捷 prop，映射到 `data`）/ `data?` / 回调 `onLike` `onReply` `onSubmit` `onSortChange` `onLoadMore` `onReport` / `mentions?`（@提及候选）/ `defaultSortMode?` / `pageSize?` / `loading?` / `emptyText?` / `containerClassName` `containerStyle` / 生命周期 `onMount` `onUnmount` / `debug` / `containerRefExternal`。

## 5. 平台通用策略（三套预设，证明"通用"）

`src/presets/*` 用同一内核 + 四插件差异化装配（**不**写新代码，只换配置）：

| 预设 | 装配 | 差异点 |
|---|---|---|
| `video`（视频评论区） | Like + Sort(hottest,newest) + Thread(maxDepth:3) + RichComposer(emoji,image) | 默认热评优先、表情+图片、楼中楼深 |
| `social`（社交评论区） | Like + Sort(all) + Thread + RichComposer(emoji,image,mention) | 全排序、@提及、楼中楼 |
| `ecommerce`（电商评论区） | Like + Sort(newest,mostLiked) + Thread + RichComposer(emoji,image) | 最新/最赞、图片（晒单）、无@ |

消费方也可完全自定义：自己 `withCommentPlugins(CommentCore, [...])` 选插件 + 配置。

## 6. 领域语义与边界

- **点赞**：乐观更新在 consumer（组件只回调 `onLike`，consumer 改数据回写）；组件不缓存 liked 态。
- **排序**：纯视图变换，由 `transformData` 完成；切换经内核 state 驱动重渲。
- **楼中楼**：`maxDepth` 限深，超深折叠为"查看更多"；`replyCount` 与 `replies` 可不一致（懒加载场景）。
- **富编辑**：生产结构化 `CommentNode[]`；emoji 用内置小集合（零依赖），图片支持 URL/DataURL，@提及走 `mentions` 候选下拉。
- **加载更多 / 空态 / loading**：Core 直接处理（`onLoadMore`、`emptyText`、`loading`）。
- **删除/待审**：`status` 渲染占位（"评论已删除"/"审核中"），不进计数。

## 7. 体积预算（写入 package.json vane 段）

- `sizeBudgetKb: 4`（根：CommentCore + withCommentPlugins + 领域槽 + 类型，peer 外置 core）
- `subpathBudgets`：每个 custom-plugins 子路径 `2`（含同目录 doc.json 元数据，实测约 1.0–1.8KB）
- 预设子路径不单列预算（属整装逃生口，体积随插件并集，根入口不受影响）

## 8. 风险与对策

- **transformData 重排幂等**：`state.sortMode` 变化才重排；对已排数据再排稳定，无抖动。
- **逐条 slot payload**：领域槽机制需扩展支持第二参数（comment），已设计 `renderCommentSlot(..., payload?)`。
- **点赞动画**：用组件内 CSS 动画，规避 overlay 全局槽在点击定位上的 pitfall。
- **peer 外置 core**：consumer 须自带 `vane-plugin-core`；README/文档明确声明 peer 依赖。
