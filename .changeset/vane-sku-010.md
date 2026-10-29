---
"vane-sku": minor
---

首次发布 vane-sku 0.1.0：插件式 React SKU 规格选择引擎。

核心能力（内置在 core，**禁用推导**是相对 vane-card 现有 SKUPlugin 的关键增量 —— 后者每个选项永远可点，错配只是不命中）：

- `matrix.ts`：`buildAvailability` 组合矩阵 + 禁用推导（选 A 后自动置灰"无有效变体"的 B 选项）、`matchVariant`、`isSelectionComplete`；`ignoreOutOfStock` 控制缺货变体是否参与推导
- `withPlugins.tsx`：领域 HOC，`extendContext` 注入 `selection` / `disabledMap` / `variant` / `isComplete` / `selectOption`；选择态写内核 state，写入即触发 context 重建；再选同值 = 取消
- `SkuSelectorCore.tsx`：只渲染「规格按钮组（含禁用态）+ 选中摘要」，长尾全交插槽
- 事件：领域钩子 `onSkuChange` + 总线 `sku:change`；用户回调 `onChange` / `onValidSkuChange`（首屏不触发）

数据模型：`SkuOption{ id, label, image? }`（稳定 id，非展示字符串，是禁用推导与 i18n 的刚需）、`SkuVariant{ sku, attrValues, price?, originalPrice?, stock?, image?, quota? }`

十二个按需子路径插件（工具条内按 order 排序，价格与库存 → 信息与联动 → 选择与交互）：

价格与库存（5）：
- `PriceRange`：未选全时按当前选择过滤变体展示价格区间（¥199–¥229），命中后让位给 PriceLink
- `PriceLink`：命中变体后单价 + 原价删除线 + 折扣文案
- `StockStatus`：现货 / 仅剩 N 件 / 缺货（低库存阈值可配）
- `Quota`：限购校验（提示条 + `canPurchase` 门控写 state，事件钩子写入非渲染期 setState）
- `Quantity`：数量步进，上限 = min(库存, 限购, config.max)

信息与联动（3）：
- `ImageLink`：规格切主图，只发事件（`onImageChange` + 总线 `sku:image`），不渲染 UI
- `SkuCode`：货号 / SKU 编码展示
- `Analytics`：埋点 `sku:mount` / `sku:change` / `sku:invalid`，回调 + 总线双通道

选择与交互（4）：
- `ResetBar`：一键清空重选（走新增的 `context.clearSelection()`）
- `KeyboardNav`：←→ 同行切换、↑↓ 跨行跳转，自动跳过置灰项
- `StatePersistence`：选择存 localStorage / sessionStorage，挂载还原、清空删键
- `UrlSync`：选择 ↔ 查询串（`?sku_颜色=red`）双向同步，可分享与刷新还原

核心新增 `context.clearSelection()`（ResetBar / StatePersistence 需要整段重置）。原候选 `ThumbPreview` 不单独成插件——core 在 `option.image` 存在时已直接渲染色块图，没有插入点。

工程约束：peer 仅 react/react-dom（硬约束）；`vane-plugin-core` 走 devDep 内联（与 vane-card / vane-waterfall / vane-lazy-image 同派）；零 vane-card 依赖；渲染插槽映射到内核现有三槽，**未改动 vane-plugin-core**。

体积门：根入口 ≤7KB（实测 6.08KB，含内联内核）、12 个插件子路径各 ≤2KB（实测 1.0–1.8KB，闭包含 doc.json 元数据）。

演示站视觉系统对齐 vane-lazy-image：同一套 App.css（暖墨黑底 + 琥珀橙强调 + 发丝边框 + 等宽读数）、自托管 Chakra Petch / JetBrains Mono 字体、Sidebar + TopBar + HashRouter 外壳；新增插件清单页（数据直接读各插件 doc.json 的 meta，杜绝文档漂移）、8 个场景卡、工坊支持 12 个插件开关。

验证：单测 41 项（matrix 8 / core 6 / plugins 27）+ 浏览器内自测 21/21（真实点击验证禁用推导置灰、价格区间与联动、库存与限购、数量上限、清空重选、键盘漫游、切主图回调 + 几何体检无越界/负坐标/零尺寸/重叠）。
