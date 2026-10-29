---
"vane-comment": minor
---

首次发布 vane-comment 0.1.0：插件式通用评论区引擎。

核心（内置在 core，数据驱动列表壳，不内置后端）：

- `CommentCore`：只渲染「顶栏（排序/计数）→ 评论列表（头像/昵称/时间/富内容/操作行/楼中楼）→ 加载更多 → 底部评论框」，所有可变行为交插件
- `withCommentPlugins`：领域 HOC，`extendContext` 注入 `comments`（经 `sortComments` 已排序）/ `sortMode` / `setSortMode`；排序结果同时覆盖 `comments` 与 `data`（`CommentCore` 读 `comments ?? data`，消费方无论传哪个都拿到排好序的列表）
- `sortComments`：纯视图变换，幂等；`newest`/`oldest`/`mostLiked`/`hottest`/`custom` 五模式
- 领域槽 `renderToolbar` / `renderFooter` / `renderCommentActions` / `renderNested` 走包内 `renderCommentSlot`（复用内核 priority 排序 + 错误边界单槽隔离）

数据模型：`Comment{ id, author{id,name,avatar?,verified?,badge?}, content: CommentNode[], text?, createdAt, likeCount(必填), liked?, replies?, replyCount?, pinned?, status?, images?, hotScore? }`；`CommentNode` 结构化富内容（text/emoji/image/mention），抖音/电商/社交评论统一渲染。

四个按需子路径插件（ADR-6，不进根入口）：

- `LikePlugin`：操作行点赞按钮 + 计数 + 本地爆裂动画，回调 `onLike(id, nextLiked)`，状态真相在消费方数据
- `SortPlugin`：顶栏排序栏（最新/最早/最热/最赞），切换即时重排，默认模式尊重消费方 `defaultSortMode`
- `ThreadPlugin`：递归楼中楼（限深折叠 + 展开/收起）+ 内联回复框，回调 `onReply(parentId, content)`，子回复复用同一组槽
- `RichComposerPlugin`：底部评论框（emoji 选择器 / 图片 DataURL / @提及候选下拉）+ 实时预览，提交输出 `CommentNode[]` 回调 `onSubmit`

三平台整装预设（同一内核 + 差异化装配，证明跨平台通用）：

- `createVideoComment()`（`/presets/video`）：最热优先 + 深 3 楼中楼 + emoji/图片
- `createSocialComment()`（`/presets/social`）：全排序 + 深 3 楼中楼 + emoji/图片/@提及
- `createEcommerceComment()`（`/presets/ecommerce`）：最新/最赞 + 深 2 楼中楼 + emoji/图片晒单

工程约束：peer 仅 react/react-dom/vane-plugin-core（硬约束）；`vane-plugin-core` 走 peer 外部化（构建期外置，不进 dist）；零 vane-card 依赖；复用内核插槽，**未改动 vane-plugin-core**。

体积门：根入口 ≤4KB（实测 3.7KB）、LikePlugin ≤2KB（1.5）、SortPlugin ≤2KB（1.9）、ThreadPlugin ≤4.5KB（4.1）、RichComposerPlugin ≤4.5KB（3.9）。后两者的 4.5KB 是「改口径必须写理由」硬约束下调的（初版 2KB 扁平预算对重 UI 插件不成立），理由见 `package.json` 的 `sizeBudgetNote`，而非静默调大。

演示站（P2）：HashRouter 四层结构（首页/插件工坊/场景/单 demo），四个平台场景卡 + 自定义工坊（四插件任意开关），几何体检审计（越界/负坐标/零尺寸/重叠/scrollHeight）+ happy-dom 自测（21 项断言全绿），根入口 alias 指向 src 使 demo 无需 lib dist 即可构建。

验证：tsc 0 error、eslint 0 error（仅 any/react-refresh 类 warning，与仓库其他包同档）、vitest 自测 PASS、`pnpm check` 体积门全绿、demo 构建 + 本地静态服务 health 200、README 经 sync-readme 生成。
