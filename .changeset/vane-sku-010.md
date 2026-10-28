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

三个按需子路径插件：

- `vane-sku/custom-plugins/PriceLink`：价格联动（变体价 + 原价删除线 + 折扣文案）
- `vane-sku/custom-plugins/Quota`：限购校验（提示条 + `canPurchase` 门控写 state，事件钩子写入非渲染期 setState）
- `vane-sku/custom-plugins/ImageLink`：规格切主图，只发事件（`onImageChange` + 总线 `sku:image`），不渲染 UI

工程约束：peer 仅 react/react-dom（硬约束）；`vane-plugin-core` 走 devDep 内联（与 vane-card / vane-waterfall / vane-lazy-image 同派）；零 vane-card 依赖；渲染插槽映射到内核现有三槽，**未改动 vane-plugin-core**。

体积门：根入口 ≤7KB（实测 6.08KB，含内联内核）、插件子路径各 ≤2KB（实测 1.0–1.5KB，闭包含 doc.json 元数据）。

验证：单测 21 项（matrix 8 / core 6 / plugins 7）+ 浏览器内自测 12/12（真实点击验证禁用推导置灰、选择命中、价格联动、限购门控、切主图回调 + 几何体检无越界/负坐标/零尺寸/重叠）。
