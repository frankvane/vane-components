# 通用评论区引擎 · 插件目录

本目录由 `scripts/generate-plugin-docs.mjs` 从各插件的 `doc.json` 自动生成，请勿手改表格；新增插件请写 `doc.json` 后跑 `pnpm docs:plugins`。

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [CopyPlugin](./CopyPlugin) | 复制：每条评论操作行渲染复制按钮，把结构化富内容转纯文本后复制到剪贴板。 | - | 0.2.0 | ui, 工具, 复制 |
| [CountPlugin](./CountPlugin) | 计数：顶栏展示评论总数 + 热议标，读取 context.comments.length，随 Filter/Search 实时变化。 | - | 0.2.0 | ui, 组织, 计数 |
| [FavoritePlugin](./FavoritePlugin) | 收藏：每条评论操作行渲染收藏按钮，切换回调 onFavorite(id, nextFavorited)；收藏态读 comment.favorited。 | - | 0.2.0 | ui, 互动, 收藏 |
| [FilterPlugin](./FilterPlugin) | 筛选：顶栏「全部/有图/有回复」筛选，经 transformData 过滤评论列表（读 state.filter）。 | `options` = ["all","image","replies"] | 0.2.0 | ui, 组织, 筛选 |
| [LikePlugin](./LikePlugin) | 点赞：每条评论操作行渲染点赞按钮与计数，点击回调 onLike；乐观更新由消费方完成。本地爆裂动画（不依赖全局 overlay 槽）。 | `showCount` = true | 0.1.0 | ui, 互动, 点赞 |
| [LocationPlugin](./LocationPlugin) | 地理位置：评论含 location 字段时在操作行展示 📍 标；Core 默认不渲染 location，由本插件补充。 | - | 0.2.0 | ui, 信息, 地理位置 |
| [LoginPromptPlugin](./LoginPromptPlugin) | 未登录引导：底部渲染「登录后参与评论」引导条，回调 onLogin；与 RichComposerPlugin 同槽共存。 | - | 0.2.0 | ui, 转化, 登录 |
| [ModerationPlugin](./ModerationPlugin) | 审核：经 transformData 屏蔽敏感词（替换为 **）并过滤待审 / 已删评论；属于数据级插件，不渲染 UI。 | `words` = ["傻逼","广告","加微信","加我"]<br/>`hidePending` = true | 0.2.0 | 治理, 审核, 安全 |
| [PinPlugin](./PinPlugin) | 置顶：每条评论操作行渲染置顶按钮，切换回调 onPin(id, nextPinned)；Core 读取 comment.pinned 渲染置顶标。 | - | 0.2.0 | ui, 组织, 置顶 |
| [ReactionPlugin](./ReactionPlugin) | 多表情反应：每条评论操作行渲染表情反应条（👍❤️😂🎉），点击累加计数，回调 onReact(id, emoji)。区别于 LikePlugin 的单一赞。 | `emojis` = ["👍","❤️","😂","🎉"] | 0.2.0 | ui, 互动, 表情 |
| [ReportPlugin](./ReportPlugin) | 举报：每条评论操作行渲染举报按钮，弹出理由浮层，提交回调 onReport(id, reason)；理由可配置。 | `reasons` = ["垃圾广告","辱骂攻击","色情低俗","诈骗","其他"] | 0.2.0 | ui, 治理, 举报 |
| [RichComposerPlugin](./RichComposerPlugin) | 富编辑：底部评论框，支持 emoji 选择器 / 图片（DataURL）/ @提及（候选下拉），实时预览，提交时输出结构化 CommentNode[] 回调 onSubmit。各能力经 features 配置按平台开关。 | `features` = { emoji: true, image: true, mention: true }<br/>`placeholder` = 说点什么吧…<br/>`submitText` = 发布 | 0.1.0 | ui, 富文本, 编辑器, 评论框 |
| [SearchPlugin](./SearchPlugin) | 搜索：顶栏输入框，经 transformData 按关键词过滤评论（读 state.query，标题/正文/@提及均参与匹配）。 | - | 0.2.0 | ui, 组织, 搜索 |
| [SharePlugin](./SharePlugin) | 分享：每条评论操作行渲染分享按钮，复制本条评论锚点链接到剪贴板，给出「已复制」反馈。 | - | 0.2.0 | ui, 互动, 分享 |
| [SortPlugin](./SortPlugin) | 排序：顶栏渲染排序栏（最新/最早/最热/最赞），切换 sortMode 经内核 state 驱动列表重排。实际重排由内核 extendContext 的 sortComments 完成。 | `modes` = ["newest","hottest","mostLiked"]<br/>`defaultMode` = "newest" | 0.1.0 | ui, 排序, 列表 |
| [ThreadPlugin](./ThreadPlugin) | 楼中楼：顶评论的 renderNested 槽递归渲染嵌套回复，maxDepth 限深折叠 + 展开/收起；操作行的「回复」经 renderCommentActions 唤起内联回复框。嵌套回复同样走同一组槽，子回复也能点赞与继续回复。 | `maxDepth` = 3<br/>`defaultExpanded` = true<br/>`showReply` = true | 0.1.0 | ui, 楼中楼, 回复, 嵌套 |
| [TimestampPlugin](./TimestampPlugin) | 绝对时间：Core 默认展示相对时间，本插件在操作行补充绝对时间芯片（YYYY-MM-DD HH:mm），便于精确查看。 | - | 0.2.0 | ui, 信息, 时间 |
<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.ts`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm sync:readme`（即 `node ../../scripts/sync-readme.mjs`）把文档同步成 npm README。
