# 规格选择 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [Analytics](#analytics) | 规格选择埋点：sku:mount / sku:change / sku:invalid 三类事件，回调（onEvent）与总线（sku:analytics）双通道，自身不渲染 UI。 | `onEvent` = -<br/>`onlyMatched` = false | 0.1.0 | sku, analytics, event |
| [ImageLink](#imagelink) | 规格切主图：命中变体带 image 时抛事件（回调 + 总线 sku:image），自身不渲染任何 UI。 | `onImageChange` = - | 0.1.0 | sku, image, event |
| [KeyboardNav](#keyboardnav) | 键盘漫游：方向键在两行规格按钮间移动焦点（←→ 同属性、↑↓ 跨属性），Enter / Space 才选中，自动跳过被禁用推导置灰的选项。 | `preventDefault` = true | 0.1.0 | sku, a11y, keyboard |
| [PriceLink](#pricelink) | 价格联动：把命中变体的价格渲染到浮层（选中摘要之后），支持原价删除线与折扣文案。 | `currency` = "¥"<br/>`showOriginal` = true<br/>`discountText` = - | 0.1.0 | sku, price, overlay |
| [PriceRange](#pricerange) | 价格区间：未选全或组合无货时，按当前选择过滤变体后取 min/max 展示价格区间（如 ¥199–¥269）；命中变体后默认退场，把价格区让给 PriceLink。 | `currency` = "¥"<br/>`separator` = "–"<br/>`showWhenMatched` = false | 0.1.0 | sku, price, range |
| [Quantity](#quantity) | 数量步进器：上限取「库存」与「限购」的较小值，数量写入内核 state（key: quantity）供宿主加购按钮读取。 | `defaultValue` = 1<br/>`max` = -<br/>`onChange` = - | 0.1.0 | sku, quantity, stepper |
| [Quota](#quota) | 限购校验：读 variant.quota 与已购数渲染限购提示条，并把 canPurchase 写入内核 state 供宿主加购按钮门控。 | `purchasedCount` = 0<br/>`onExceed` = - | 0.1.0 | sku, quota, limit |
| [ResetBar](#resetbar) | 清空重选：一键重置全部规格选择，走 context.clearSelection()。未选任何规格时不渲染。 | `text` = "清空重选"<br/>`onReset` = - | 0.1.0 | sku, reset, ux |
| [SkuCode](#skucode) | 货号展示：命中变体后显示 SKU 编码，便于客服对单、用户报修与订单核对。 | `label` = "货号" | 0.1.0 | sku, code, meta |
| [StatePersistence](#statepersistence) | 选择态持久化：把上次选的规格存进 localStorage / sessionStorage，挂载时自动还原；清空选择时删除键。 | `key` = "vane-sku:selection"<br/>`scope` = "local" | 0.1.0 | sku, persistence, storage |
| [StockStatus](#stockstatus) | 库存状态：命中变体后展示「现货 / 仅剩 N 件 / 缺货」，低库存阈值可配。 | `lowStockThreshold` = 5<br/>`soldOutText` = "暂时缺货"<br/>`showCount` = true | 0.1.0 | sku, stock, inventory |
| [UrlSync](#urlsync) | URL 同步：把规格选择写进查询串（?sku_颜色=red&amp;sku_尺码=s），挂载时反向解析还原，刷新与分享都能保持选择。 | `paramPrefix` = "sku_"<br/>`useReplace` = true | 0.1.0 | sku, url, share |

## 插件能力明细

### Analytics

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `onEvent` | `(event) => void` | `-` | 统一事件出口，推荐接自己的埋点 SDK |
| `onlyMatched` | `boolean` | `false` | 只在命中变体时上报；关闭时未命中也上报，便于发现「选不出来」的组合 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 规格组件挂载完成 | 初始化副作用（URL 同步、状态恢复） |
| `onSkuChange` | 用户选择或命中变体变化后（回传 selection / variant） | 联动价格、库存、图片，或做埋点上报 |
| `sku:analytics` | 挂载 / 命中变更 / 无效组合时 | 广播埋点事件对象，供外部 SDK 上报 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ImageLink

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `onImageChange` | `(image: string) => void` | `-` | 主图切换回调（推荐用法） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 规格组件挂载完成 | 初始化副作用（URL 同步、状态恢复） |
| `onSkuChange` | 用户选择或命中变体变化后（回传 selection / variant） | 联动价格、库存、图片，或做埋点上报 |
| `sku:image` | 命中变体带图、需要切换主图时 | 广播目标图片地址，由外部图区响应 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### KeyboardNav

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `preventDefault` | `boolean` | `true` | 是否阻止方向键的默认滚动行为 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 规格组件挂载完成 | 初始化副作用（URL 同步、状态恢复） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PriceLink

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `currency` | `string` | `¥` | 货币符号 |
| `showOriginal` | `boolean` | `true` | 是否展示原价（原价 &gt; 现价时才画删除线） |
| `discountText` | `string` | `-` | 折扣文案，如 "限时8折" |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在规格面板之上 | 浮层选择器、库存提示、加载遮罩 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PriceRange

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `currency` | `string` | `¥` | 货币符号 |
| `separator` | `string` | `–` | 区间连接符 |
| `showWhenMatched` | `boolean` | `false` | 命中变体时是否仍显示区间（默认让位给 PriceLink） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，覆盖在规格面板之上 | 浮层选择器、库存提示、加载遮罩 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### Quantity

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `defaultValue` | `number` | `1` | 初始数量 |
| `max` | `number` | `-` | 硬上限（不传则取 库存/限购 的较小值） |
| `onChange` | `(quantity: number) => void` | `-` | 数量变化回调 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 规格组件挂载完成 | 初始化副作用（URL 同步、状态恢复） |
| `onSkuChange` | 用户选择或命中变体变化后（回传 selection / variant） | 联动价格、库存、图片，或做埋点上报 |
| `renderHeader` | 每次渲染，规格面板头部槽位 | 商品图、价格、已选摘要 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### Quota

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `purchasedCount` | `number` | `0` | 当前用户已购件数 |
| `onExceed` | `() => void` | `-` | 超出限购时回调 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 规格组件挂载完成 | 初始化副作用（URL 同步、状态恢复） |
| `onSkuChange` | 用户选择或命中变体变化后（回传 selection / variant） | 联动价格、库存、图片，或做埋点上报 |
| `renderHeader` | 每次渲染，规格面板头部槽位 | 商品图、价格、已选摘要 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ResetBar

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | `清空重选` | 按钮文案 |
| `onReset` | `() => void` | `-` | 清空后回调 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，规格面板头部槽位 | 商品图、价格、已选摘要 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `clearSelection` | `ctx.clearSelection(): void` | 清空全部已选规格，回到未选状态 |

### SkuCode

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | `货号` | 前缀文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，规格面板头部槽位 | 商品图、价格、已选摘要 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### StatePersistence

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `key` | `string` | `vane-sku:selection` | 存储键 |
| `scope` | `"local" \| "session"` | `local` | local=localStorage，session=sessionStorage |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 规格组件挂载完成 | 初始化副作用（URL 同步、状态恢复） |
| `onSkuChange` | 用户选择或命中变体变化后（回传 selection / variant） | 联动价格、库存、图片，或做埋点上报 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setSelection` | `ctx.setSelection(selection: SkuSelection): void` | 写入已选规格（内核 state，触发价格 / 库存 / 图片联动） |

### StockStatus

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `lowStockThreshold` | `number` | `5` | 低库存预警阈值：库存 ≤ 该值时显示「仅剩 N 件」 |
| `soldOutText` | `string` | `暂时缺货` | 缺货文案 |
| `showCount` | `boolean` | `true` | 是否展示具体库存数字 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，规格面板头部槽位 | 商品图、价格、已选摘要 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### UrlSync

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `paramPrefix` | `string` | `sku_` | 查询参数前缀，避免与页面其它参数冲突 |
| `useReplace` | `boolean` | `true` | true=replaceState（不污染前进后退），false=pushState |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 规格组件挂载完成 | 初始化副作用（URL 同步、状态恢复） |
| `onSkuChange` | 用户选择或命中变体变化后（回传 selection / variant） | 联动价格、库存、图片，或做埋点上报 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setSelection` | `ctx.setSelection(selection: SkuSelection): void` | 写入已选规格（内核 state，触发价格 / 库存 / 图片联动） |

<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.ts`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
