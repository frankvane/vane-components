# 通用评论区引擎 · 插件目录

本目录由 `scripts/generate-plugin-docs.mjs` 从各插件的 `doc.json` 自动生成，请勿手改表格；新增插件请写 `doc.json` 后跑 `pnpm docs:plugins`。

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [CopyPlugin](#copyplugin) | 复制：每条评论操作行渲染复制按钮，把结构化富内容转纯文本后复制到剪贴板。 | - | 0.2.0 | ui, 工具, 复制 |
| [CountPlugin](#countplugin) | 计数：顶栏展示评论总数 + 热议标，读取 context.comments.length，随 Filter/Search 实时变化。 | - | 0.2.0 | ui, 组织, 计数 |
| [FavoritePlugin](#favoriteplugin) | 收藏：每条评论操作行渲染收藏按钮，切换回调 onFavorite(id, nextFavorited)；收藏态读 comment.favorited。 | - | 0.2.0 | ui, 互动, 收藏 |
| [FilterPlugin](#filterplugin) | 筛选：顶栏「全部/有图/有回复」筛选，经 transformData 过滤评论列表（读 state.filter）。 | `options` = ["all","image","replies"] | 0.2.0 | ui, 组织, 筛选 |
| [LikePlugin](#likeplugin) | 点赞：每条评论操作行渲染点赞按钮与计数，点击回调 onLike；乐观更新由消费方完成。本地爆裂动画（不依赖全局 overlay 槽）。 | `showCount` = true | 0.1.0 | ui, 互动, 点赞 |
| [LocationPlugin](#locationplugin) | 地理位置：评论含 location 字段时在操作行展示 📍 标；Core 默认不渲染 location，由本插件补充。 | - | 0.2.0 | ui, 信息, 地理位置 |
| [LoginPromptPlugin](#loginpromptplugin) | 未登录引导：底部渲染「登录后参与评论」引导条，回调 onLogin；与 RichComposerPlugin 同槽共存。 | - | 0.2.0 | ui, 转化, 登录 |
| [ModerationPlugin](#moderationplugin) | 审核：经 transformData 屏蔽敏感词（替换为 **）并过滤待审 / 已删评论；属于数据级插件，不渲染 UI。 | `words` = ["傻逼","广告","加微信","加我"]<br/>`hidePending` = true | 0.2.0 | 治理, 审核, 安全 |
| [PinPlugin](#pinplugin) | 置顶：每条评论操作行渲染置顶按钮，切换回调 onPin(id, nextPinned)；Core 读取 comment.pinned 渲染置顶标。 | - | 0.2.0 | ui, 组织, 置顶 |
| [ReactionPlugin](#reactionplugin) | 多表情反应：每条评论操作行渲染表情反应条（👍❤️😂🎉），点击累加计数，回调 onReact(id, emoji)。区别于 LikePlugin 的单一赞。 | `emojis` = ["👍","❤️","😂","🎉"] | 0.2.0 | ui, 互动, 表情 |
| [ReportPlugin](#reportplugin) | 举报：每条评论操作行渲染举报按钮，弹出理由浮层，提交回调 onReport(id, reason)；理由可配置。 | `reasons` = ["垃圾广告","辱骂攻击","色情低俗","诈骗","其他"] | 0.2.0 | ui, 治理, 举报 |
| [RichComposerPlugin](#richcomposerplugin) | 富编辑：底部评论框，支持 emoji 选择器 / 图片（DataURL）/ @提及（候选下拉），实时预览，提交时输出结构化 CommentNode[] 回调 onSubmit。各能力经 features 配置按平台开关。 | `features` = { emoji: true, image: true, mention: true }<br/>`placeholder` = 说点什么吧…<br/>`submitText` = 发布 | 0.1.0 | ui, 富文本, 编辑器, 评论框 |
| [SearchPlugin](#searchplugin) | 搜索：顶栏输入框，经 transformData 按关键词过滤评论（读 state.query，标题/正文/@提及均参与匹配）。 | - | 0.2.0 | ui, 组织, 搜索 |
| [SharePlugin](#shareplugin) | 分享：每条评论操作行渲染分享按钮，复制本条评论锚点链接到剪贴板，给出「已复制」反馈。 | - | 0.2.0 | ui, 互动, 分享 |
| [SortPlugin](#sortplugin) | 排序：顶栏渲染排序栏（最新/最早/最热/最赞），切换 sortMode 经内核 state 驱动列表重排。实际重排由内核 extendContext 的 sortComments 完成。 | `modes` = ["newest","hottest","mostLiked"]<br/>`defaultMode` = "newest" | 0.1.0 | ui, 排序, 列表 |
| [ThreadPlugin](#threadplugin) | 楼中楼：顶评论的 renderNested 槽递归渲染嵌套回复，maxDepth 限深折叠 + 展开/收起；操作行的「回复」经 renderCommentActions 唤起内联回复框。嵌套回复同样走同一组槽，子回复也能点赞与继续回复。 | `maxDepth` = 3<br/>`defaultExpanded` = true<br/>`showReply` = true | 0.1.0 | ui, 楼中楼, 回复, 嵌套 |
| [TimestampPlugin](#timestampplugin) | 绝对时间：Core 默认展示相对时间，本插件在操作行补充绝对时间芯片（YYYY-MM-DD HH:mm），便于精确查看。 | - | 0.2.0 | ui, 信息, 时间 |

## 插件能力明细

### CopyPlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCommentActions` | 逐条渲染评论的操作行（payload 为当前 comment） | 点赞、回复、复制、举报等单条操作按钮 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CountPlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染，列表级顶栏槽位 | 排序栏、计数、筛选开关等列表级工具 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### FavoritePlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCommentActions` | 逐条渲染评论的操作行（payload 为当前 comment） | 点赞、回复、复制、举报等单条操作按钮 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### FilterPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `options` | `("all"\|"image"\|"replies")[]` | `["all","image","replies"]` | 筛选项 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对评论列表链式改写 | 排序、过滤、审核隐藏、敏感词替换；下游拿到的 context.data 即可见列表 |
| `renderToolbar` | 每次渲染，列表级顶栏槽位 | 排序栏、计数、筛选开关等列表级工具 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### LikePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showCount` | `boolean` | `true` | 是否展示点赞数，false 时只显示爱心图标 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCommentActions` | 逐条渲染评论的操作行（payload 为当前 comment） | 点赞、回复、复制、举报等单条操作按钮 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### LocationPlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCommentActions` | 逐条渲染评论的操作行（payload 为当前 comment） | 点赞、回复、复制、举报等单条操作按钮 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### LoginPromptPlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染，列表级底部槽位 | 根评论框、加载更多、登录提示 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ModerationPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `words` | `string[]` | `["傻逼","广告","加微信","加我"]` | 敏感词集合，命中替换为 ** |
| `hidePending` | `boolean` | `true` | 是否过滤待审 / 已删评论 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对评论列表链式改写 | 排序、过滤、审核隐藏、敏感词替换；下游拿到的 context.data 即可见列表 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PinPlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCommentActions` | 逐条渲染评论的操作行（payload 为当前 comment） | 点赞、回复、复制、举报等单条操作按钮 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ReactionPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `emojis` | `string[]` | `["👍","❤️","😂","🎉"]` | 可选表情集合 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCommentActions` | 逐条渲染评论的操作行（payload 为当前 comment） | 点赞、回复、复制、举报等单条操作按钮 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ReportPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `reasons` | `string[]` | `["垃圾广告","辱骂攻击","色情低俗","诈骗","其他"]` | 举报理由选项 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCommentActions` | 逐条渲染评论的操作行（payload 为当前 comment） | 点赞、回复、复制、举报等单条操作按钮 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### RichComposerPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `features` | `{ emoji?: boolean; image?: boolean; mention?: boolean }` | `{ emoji: true, image: true, mention: true }` | 启用哪些富编辑能力，按平台开关 |
| `placeholder` | `string` | `说点什么吧…` | 文本框占位符 |
| `submitText` | `string` | `发布` | 提交按钮文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染，列表级底部槽位 | 根评论框、加载更多、登录提示 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SearchPlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对评论列表链式改写 | 排序、过滤、审核隐藏、敏感词替换；下游拿到的 context.data 即可见列表 |
| `renderToolbar` | 每次渲染，列表级顶栏槽位 | 排序栏、计数、筛选开关等列表级工具 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SharePlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCommentActions` | 逐条渲染评论的操作行（payload 为当前 comment） | 点赞、回复、复制、举报等单条操作按钮 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SortPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modes` | `"newest" \| "oldest" \| "hottest" \| "mostLiked"[]` | `["newest","hottest","mostLiked"]` | 排序栏展示的模式按钮 |
| `defaultMode` | `SortMode` | `newest` | 默认排序（仅在消费方未传 defaultSortMode 时播种） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 组件挂载完成、插件注册后执行一次（返回的清理函数在 manager.clear 时逆序执行） | 初始化副作用：注册监听、起定时器、建观察器；必须返回清理函数或配合 onUnmount 收尾 |
| `renderToolbar` | 每次渲染，列表级顶栏槽位 | 排序栏、计数、筛选开关等列表级工具 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setSortMode` | `ctx.setSortMode(mode: SortMode): void` | 切换列表排序模式（写入内核 state，触发 context 重建与重排） |

### ThreadPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `maxDepth` | `number` | `3` | 最大嵌套深度，超过则不再渲染更深的楼中楼 |
| `defaultExpanded` | `boolean` | `true` | 是否默认展开楼中楼 |
| `showReply` | `boolean` | `true` | 是否在操作行渲染内联回复框触发 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderNested` | 逐条渲染楼中楼嵌套区（payload 为当前 comment） | 展开 / 收起子回复、嵌套列表 |
| `renderCommentActions` | 逐条渲染评论的操作行（payload 为当前 comment） | 点赞、回复、复制、举报等单条操作按钮 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### TimestampPlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCommentActions` | 逐条渲染评论的操作行（payload 为当前 comment） | 点赞、回复、复制、举报等单条操作按钮 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.ts`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm sync:readme`（即 `node ../../scripts/sync-readme.mjs`）把文档同步成 npm README。
