# 规格选择 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [Analytics](./Analytics) | 规格选择埋点：sku:mount / sku:change / sku:invalid 三类事件，回调（onEvent）与总线（sku:analytics）双通道，自身不渲染 UI。 | `onEvent` = -<br/>`onlyMatched` = false | 0.1.0 | sku, analytics, event |
| [ImageLink](./ImageLink) | 规格切主图：命中变体带 image 时抛事件（回调 + 总线 sku:image），自身不渲染任何 UI。 | `onImageChange` = - | 0.1.0 | sku, image, event |
| [KeyboardNav](./KeyboardNav) | 键盘漫游：方向键在规格按钮间移动并选择，←→ 同属性切换、↑↓ 跨属性跳转，自动跳过被禁用推导置灰的选项。 | `preventDefault` = true | 0.1.0 | sku, a11y, keyboard |
| [PriceLink](./PriceLink) | 价格联动：把命中变体的价格渲染到浮层（选中摘要之后），支持原价删除线与折扣文案。 | `currency` = "¥"<br/>`showOriginal` = true<br/>`discountText` = - | 0.1.0 | sku, price, overlay |
| [PriceRange](./PriceRange) | 价格区间：未选全或组合无货时，按当前选择过滤变体后取 min/max 展示价格区间（如 ¥199–¥269）；命中变体后默认退场，把价格区让给 PriceLink。 | `currency` = "¥"<br/>`separator` = "–"<br/>`showWhenMatched` = false | 0.1.0 | sku, price, range |
| [Quantity](./Quantity) | 数量步进器：上限取「库存」与「限购」的较小值，数量写入内核 state（key: quantity）供宿主加购按钮读取。 | `defaultValue` = 1<br/>`max` = -<br/>`onChange` = - | 0.1.0 | sku, quantity, stepper |
| [Quota](./Quota) | 限购校验：读 variant.quota 与已购数渲染限购提示条，并把 canPurchase 写入内核 state 供宿主加购按钮门控。 | `purchasedCount` = 0<br/>`onExceed` = - | 0.1.0 | sku, quota, limit |
| [ResetBar](./ResetBar) | 清空重选：一键重置全部规格选择，走 context.clearSelection()。未选任何规格时不渲染。 | `text` = "清空重选"<br/>`onReset` = - | 0.1.0 | sku, reset, ux |
| [SkuCode](./SkuCode) | 货号展示：命中变体后显示 SKU 编码，便于客服对单、用户报修与订单核对。 | `label` = "货号" | 0.1.0 | sku, code, meta |
| [StatePersistence](./StatePersistence) | 选择态持久化：把上次选的规格存进 localStorage / sessionStorage，挂载时自动还原；清空选择时删除键。 | `key` = "vane-sku:selection"<br/>`scope` = "local" | 0.1.0 | sku, persistence, storage |
| [StockStatus](./StockStatus) | 库存状态：命中变体后展示「现货 / 仅剩 N 件 / 缺货」，低库存阈值可配。 | `lowStockThreshold` = 5<br/>`soldOutText` = "暂时缺货"<br/>`showCount` = true | 0.1.0 | sku, stock, inventory |
| [UrlSync](./UrlSync) | URL 同步：把规格选择写进查询串（?sku_颜色=red&amp;sku_尺码=s），挂载时反向解析还原，刷新与分享都能保持选择。 | `paramPrefix` = "sku_"<br/>`useReplace` = true | 0.1.0 | sku, url, share |
<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.ts`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
