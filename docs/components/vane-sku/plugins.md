# 规格选择 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [ImageLink](./ImageLink) | 规格切主图：命中变体带 image 时抛事件（回调 + 总线 sku:image），自身不渲染任何 UI。 | `onImageChange` = - | 0.1.0 | sku, image, event |
| [PriceLink](./PriceLink) | 价格联动：把命中变体的价格渲染到浮层（选中摘要之后），支持原价删除线与折扣文案。 | `currency` = "¥"<br/>`showOriginal` = true<br/>`discountText` = - | 0.1.0 | sku, price, overlay |
| [Quota](./Quota) | 限购校验：读 variant.quota 与已购数渲染限购提示条，并把 canPurchase 写入内核 state 供宿主加购按钮门控。 | `purchasedCount` = 0<br/>`onExceed` = - | 0.1.0 | sku, quota, limit |
<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.ts`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
