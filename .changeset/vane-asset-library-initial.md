---
"vane-asset-library": minor
---

初始发布：插件式 React 素材网格墙（20 插件）。

- `AssetLibraryCore`：网格壳（role="listbox" + roving tabindex + 方向键/空格/Enter 导航），只做渲染 + 生命周期转发；8 个槽位（toolbar×2 / card×3 / bulk / footer / overlay / empty）复用内核排序（order 升序 → priority 降序）与错误边界
- 领域纯函数：normalizeAssets / filterAssets / sortAssets / paginateAssets / formatDuration / formatSize / buildTagFacets / buildFolderFacets / resolveEmptyReason（宿主可复用）
- 工具栏 9 插件：dropzone(5) / search(10) / kind-filter(11) / tag-filter(12) / folder-filter(13) / sort(14) / view-switch(15) / count(16) / select-all(17)
- 卡片区 7 插件：select-mark(20) / kind-badge(21) / duration(22) / status-badge(23) / favorite(24) / card-actions(25) / meta-line(26)
- 底部区 2 插件：bulk-bar(30) / pagination(31)
- 浮层 2 插件：empty-state(40) / lightbox(45)
- 装配：`withAssetPlugins(AssetLibraryCore, [...])`；插件子路径 `vane-asset-library/custom-plugins/<Name>Plugin`
- 受控/非受控双模选择（value + defaultValue + max 上限 + disabled 阻断）
- 配色遵循 ADR-13（容器自带 color+background，正文 ≥4.5 / 禁用 ≥3 / UI ≥3）
- 体积：入口 11.6KB / 预算 12KB（消费方口径 9.07KB），全量并集 25.2KB / 70KB
- 测试：vitest 49 条 + 浏览器自测 SELFTEST OK 39/39（根路由 / /plugins / /scenarios 复跑）
- demo：20 逐项示例 + 插件工坊 + 4 场景示例（品牌素材库 / 投稿审核 / 视频选题 / 商品选图单选）
