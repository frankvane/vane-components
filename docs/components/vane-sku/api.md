# 规格选择 · API

## `createSkuSelector(plugins?)`

返回一个装好插件的组件。这是**推荐用法**（`withPlugins` 需要自己传 Core，工厂帮你绑定好了）。

```tsx
const Sku = createSkuSelector([createPriceLinkPlugin(), createQuotaPlugin()]);
<Sku attributes={attributes} variants={variants} />;
```

## props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `attributes` | `SkuAttribute[]` | 必填 | 规格属性定义（`{ name, options: [{ id, label, image? }] }`） |
| `variants` | `SkuVariant[]` | 必填 | 变体列表（`{ sku, attrValues, price?, originalPrice?, stock?, image?, quota? }`） |
| `defaultSelection` | `Record<string, string>` | `{}` | 默认选择（属性名 → optionId），仅首屏生效一次 |
| `ignoreOutOfStock` | `boolean` | `true` | 缺货变体（`stock === 0`）是否视为不存在、不参与可用推导 |
| `onChange` | `(selection, variant \| null) => void` | - | 任意选择变化（首屏不触发） |
| `onValidSkuChange` | `(variant) => void` | - | 选全并命中变体时触发 |
| `data` | `unknown` | - | 业务数据，透传给插件 `context.data` |
| `containerClassName` / `containerStyle` | `string` / `CSSProperties` | - | 容器类名 / 内联样式 |
| `onMount` / `onUnmount` | `() => void` | - | 生命周期回调（插件链由 `withPlugins` 触发，不重复） |
| `debug` | `boolean` | `false` | 打印插件注册与钩子日志 |

### Ref

| 方法 | 说明 |
| --- | --- |
| `getContainer()` | 取根 DOM |
| `forceUpdate()` | 强制刷新 |
| `getSize()` | 取容器尺寸 |
| `getSelection()` | 当前选择（属性名 → optionId） |
| `getVariant()` | 当前命中变体（未命中为 `null`） |

## 纯函数（可单独测试 / 复用）

| 函数 | 说明 |
| --- | --- |
| `buildAvailability(attributes, variants, selection, opts?)` | 组合矩阵 + 禁用推导，返回 `{ disabledMap, availableCount }` |
| `matchVariant(variants, attributes, selection)` | 选全并命中则返回变体，否则 `null` |
| `isSelectionComplete(attributes, selection)` | 所有属性是否已选 |

## 插件上下文 `SkuPluginContext`

在内核 `PluginContext`（`props` / `data` / `bus` / `refs` / `state` / `setState` / `shared` / `deviceInfo` / `forceUpdate` / `getSize` / `logger`）之上追加：

| 字段 | 说明 |
| --- | --- |
| `selection` | 当前选择 |
| `disabledMap` | 禁用推导结果：属性名 → 被置灰的 optionId 集合 |
| `variant` | 命中变体（未选全或未命中为 `null`） |
| `isComplete` | 是否已选全 |
| `selectOption(attrName, optionId)` | 选择某选项（再选同值 = 取消），写入内核 state 并触发 context 重建 |

## 事件

| 事件 | 触发时机 |
| --- | --- |
| 领域钩子 `onSkuChange(context, selection, variant)` | 选择/命中变体变化后（首屏不触发） |
| 总线 `sku:change`（`{ attrs, variant }`） | 同上 |
| 总线 `sku:image`（ImageLink 发） | 命中变体带 `image` 时 |

## 渲染插槽（映射内核三槽，零改动内核）

| 宿主位置 | 内核钩子 | 典型用途 |
| --- | --- | --- |
| 规格组之上 | `renderHeader`（`slotPosition: "before"`） | 标题 / 头部 |
| 选中摘要之后 | `renderOverlay` | 价格浮层（PriceLink） |
| 价格之后 | `renderHeader`（`slotPosition: "after"`） | 限购提示条（Quota）/ 加购按钮区 |
| 最底部 | `renderFooter` | 补充说明 |

## `withPlugins(Core, plugins)`

需要完全自定义装配时才用（例如要替换 Core）。签名与内核一致，但会带 `extendContext` 注入领域字段。

```tsx
import { SkuSelectorCore, withPlugins } from "vane-sku";
const Sku = withPlugins(SkuSelectorCore, [createPriceLinkPlugin()]);
```
