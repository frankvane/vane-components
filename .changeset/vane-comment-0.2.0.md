---
"vane-comment": minor
---

vane-comment 0.2.0：插件家族从 4 个扩展到 17 个，并修复社交预设操作行布局。

新增 13 个轻量插件（均走按需子路径 `vane-comment/custom-plugins/*`，不进根入口）：

- `ReportPlugin`（举报）/ `SharePlugin`（分享）/ `CopyPlugin`（复制）/ `ReactionPlugin`（多表情反应）/ `FavoritePlugin`（收藏）/ `PinPlugin`（置顶管理）/ `LocationPlugin`（地理位置）/ `TimestampPlugin`（绝对时间）/ `CountPlugin`（计数）
- 数据级插件（在 `withCommentPlugins` 运行时先于排序执行，并同步 `comments`/`data` 双字段）：`FilterPlugin`（关键词筛选）/ `SearchPlugin`（关键词搜索）/ `ModerationPlugin`（敏感词审核脱敏）/ `LoginPromptPlugin`（未登录引导）

布局修复：社交预设操作行按钮被压成竖排的问题——操作行开启 `flex-wrap`，子项统一 `flex-shrink:0`，回复框展开时独占整行。

文档与演示：补全 13 个新插件的逐项示例页；三平台预设（视频/社交/电商）+ 自定义工坊 demo；happy-dom 自测 24 项断言全绿（含布局断言）。

体积门：根入口 ≤4KB（实测 3.8KB）；17 个子路径预算同步（13 个轻量插件各 2KB 留足余量，ThreadPlugin/RichComposerPlugin 维持 4.5KB，理由见 `package.json` 的 `sizeBudgetNote`）。
