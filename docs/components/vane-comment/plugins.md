# 通用评论区引擎 · 插件目录

本目录由 `scripts/generate-plugin-docs.mjs` 从各插件的 `doc.json` 自动生成，请勿手改表格；新增插件请写 `doc.json` 后跑 `pnpm docs:plugins`。

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [LikePlugin](./LikePlugin) | 点赞：每条评论操作行渲染点赞按钮与计数，点击回调 onLike；乐观更新由消费方完成。本地爆裂动画（不依赖全局 overlay 槽）。 | `showCount` = true | 0.1.0 | ui, 互动, 点赞 |
| [RichComposerPlugin](./RichComposerPlugin) | 富编辑：底部评论框，支持 emoji 选择器 / 图片（DataURL）/ @提及（候选下拉），实时预览，提交时输出结构化 CommentNode[] 回调 onSubmit。各能力经 features 配置按平台开关。 | `features` = { emoji: true, image: true, mention: true }<br/>`placeholder` = 说点什么吧…<br/>`submitText` = 发布 | 0.1.0 | ui, 富文本, 编辑器, 评论框 |
| [SortPlugin](./SortPlugin) | 排序：顶栏渲染排序栏（最新/最早/最热/最赞），切换 sortMode 经内核 state 驱动列表重排。实际重排由内核 extendContext 的 sortComments 完成。 | `modes` = ["newest","hottest","mostLiked"]<br/>`defaultMode` = "newest" | 0.1.0 | ui, 排序, 列表 |
| [ThreadPlugin](./ThreadPlugin) | 楼中楼：顶评论的 renderNested 槽递归渲染嵌套回复，maxDepth 限深折叠 + 展开/收起；操作行的「回复」经 renderCommentActions 唤起内联回复框。嵌套回复同样走同一组槽，子回复也能点赞与继续回复。 | `maxDepth` = 3<br/>`defaultExpanded` = true<br/>`showReply` = true | 0.1.0 | ui, 楼中楼, 回复, 嵌套 |
<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.ts`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm sync:readme`（即 `node ../../scripts/sync-readme.mjs`）把文档同步成 npm README。
