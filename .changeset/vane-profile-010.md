---
"vane-profile": minor
---

首次发布 vane-profile 0.1.0：插件式个人主页引擎。

- `ProfileCore` 三段落布局壳（头图区 / 数据行 + 关注区 / 页签栏 / 内容区）+ `withPlugins` 装配器
- 5 个领域插件：`BannerSlot`（头图）、`StatRow`（数据行）、`TabSync`（页签联动）、`VerifyBadge`（认证徽标）、`FollowEcho`（关注三态）
- 页签切换经内核 state 驱动内容区重渲染（`useProfileContext().activeTab` 订阅）
- 领域槽复用内核排序 / priority / `PluginErrorBoundary` 单槽隔离
- 根入口 gzip ≈3.0KB（预算 3.5KB），官方插件严格走子路径 `./custom-plugins/*`
