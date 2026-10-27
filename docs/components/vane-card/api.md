# API

三样东西构成整个包的公开面：**容器**（`CardCore` 的 props 与 ref）、**装配函数**（`withPlugins`）、**插件契约**（context / 15 个钩子 / 总线）。复合组件的数据契约见 [ProductData](#productdata复合组件的数据契约)。

```ts
import { CardCore, withPlugins, usePluginSlot, renderDomainSlot, BusKeys } from "vane-card";
import type {
  CardPlugin, CardPluginContext, CardPluginHooks, WithPluginsConfig,
  PluginBus, BusKey, CardState, CardSize, DeviceInfo,
} from "vane-card";
```

## CardCoreProps

`CardCore` 只做五件事：盒子、padding、点击、悬停、可见性，外加一个 ref。**它不认识商品数据**——`data` 只是原样透传给 `renderContent` 和你写的插件。

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `cardId` | `string` | — | **必填**。写进 `data-card-id`，也是插件 context 里的 `cardId` |
| `data` | `T` | — | 业务数据。有 `data` 且有 `renderContent` 时才渲染内容 |
| `renderContent` | `(data: T, ctx: { isVisible: boolean }) => ReactNode` | — | 内容渲染函数；`ctx.isVisible` 来自 IntersectionObserver |
| `layout` | `"vertical" \| "horizontal"` | `"vertical"` | 只加 `card-vertical` / `card-horizontal` 类名，具体排版由 CSS 决定 |
| `padding` | `number \| { top?, right?, bottom?, left? }` | `0` | 内联到容器上（功能性，不受 `style.css` 影响） |
| `containerStyle` | `CSSProperties` | — | 内联样式，与功能性样式合并（可覆盖） |
| `containerClassName` | `string` | — | 追加类名 |
| `children` | `ReactNode` | — | 插槽区。用 `withPlugins` 时**会被接管**（内核 `composeSlots` 的五段结构） |
| `containerRefExternal` | `RefObject<HTMLDivElement \| null>` | — | 由 `withPlugins` 注入；手写插件需要拿到容器时也可自己传 |
| `onMount` / `onUnmount` | `() => void` | — | 挂载 / 卸载回调（只跑一次） |
| `onClick` | `(e: MouseEvent) => void` | — | 容器点击 |
| `onHover` | `(isHovered: boolean) => void` | — | 进出各一次 |
| `onVisibilityChange` | `(isVisible: boolean) => void` | — | IntersectionObserver，`threshold: 0.1`，仅挂载时建立一次 |
| `debug` | `boolean` | `false` | 挂载 / 卸载打日志（`withPlugins` 的 `enableDebug` 也会落到这里） |

## CardCoreRef

`withPlugins` 透传 ref，拿到的就是 `CardCore` 的 ref —— 外壳没有包 wrapper，没有第二层。

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getContainer` | `() => HTMLDivElement \| null` | 拿容器 DOM |
| `forceUpdate` | `() => void` | 强制重渲染（改的是 Core 自己的 state） |
| `getSize` | `() => { width: number; height: number }` | 读 `offsetWidth` / `offsetHeight`，未挂载时返回 `{0,0}` |

## withPlugins

```ts
withPlugins(CardCore, config: WithPluginsConfig | CardPlugin[]): Component
```

| 配置 | 类型 | 说明 |
| --- | --- | --- |
| `plugins` | `CardPlugin[]` | 插件实例数组（`createXxxPlugin(...)` 的返回值） |
| `enableDebug` | `boolean` | 内核 debug 日志 |

**装配必须定型一次**：

```tsx
// ✅ 模块顶层：类型稳定，React 认为是同一个组件
const ProductCard = withPlugins(CardCore, { plugins: [/* ... */] });

// ❌ 渲染里调：每次都是新类型 → 整棵子树卸载重建
function Bad({ plugins }) {
  const Card = withPlugins(CardCore, { plugins }); // 状态全丢、图片重载
  return <Card cardId="p1" data={data} />;
}
```

动态组合要「按插件名记忆」，而不是按数组引用记忆（内联数组每次都是新引用）：

```tsx
function useCard(plugins: CardPlugin[]) {
  const key = plugins.map((p) => p.name).join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => withPlugins(CardCore, { plugins }), [key]);
}
```

## 插件契约

### CardPlugin

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 唯一标识。动态记忆组件类型时按它做 key |
| `hooks` | `CardPluginHooks` | 15 个钩子，全可选 |
| `config` | `Record<string, any>` | 插件自己的配置；`order` / `headerPosition` / `slotPosition` 也挂这里 |
| `priority` | `number` | 钩子执行顺序，**越大越先**。默认 0 |
| `enabled` | `boolean` | `false` 时所有钩子与渲染都跳过 |
| `dependencies` | `string[]` | 需要先加载的插件名 |
| `version` / `description` | `string` | 元信息 |

### CardPluginContext

内核 context 的超集，插件代码里拿到的就是这一个对象。`props` / `data` / `size` 是**动态 getter**（读的是当前值，不是挂载时快照）。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `props` | `CardCoreProps<T>` | 当前 props（`transformProps` 之后的值） |
| `data` | `T \| undefined` | 当前 data |
| `cardId` | `string` | 等于 `props.cardId` |
| `containerRef` | `RefObject<HTMLDivElement \| null>` | 容器 ref |
| `getContainer` | `() => HTMLDivElement \| null` | 容器 DOM |
| `size` / `getSize` | `CardSize` / `() => CardSize` | 实时尺寸（`offsetWidth` / `offsetHeight`） |
| `state` | `CardState` | `{ isHovered, isVisible, isActive, isSelected, cart, wishlist }` |
| `setState` | `(updates: Partial<CardState>) => void` | 触发的差分会在 state 变化后走 `onStateChange` |
| `bus` | `PluginBus` | 总线（见下） |
| `sharedData` | `Map<string, any>` | 跨插件共享数据，不走 React 渲染 |
| `deviceInfo` | `DeviceInfo` | `type` / `os` / `browser` / `devicePixelRatio` / `viewportWidth` / `viewportHeight` / `isTouchDevice` / `isRetina` |
| `forceUpdate` | `() => void` | 强制重渲染 |

### 15 个钩子

**内核 9 个**（生命周期 4 + 转换 2 + 渲染 3）：

| 钩子 | 签名 | 什么时候跑 |
| --- | --- | --- |
| `onMount` | `(ctx) => void \| (() => void)` | 挂载后。**返回值当清理函数**，卸载时逆序执行 |
| `onUnmount` | `(ctx) => void` | 卸载前（由内核统一触发一次） |
| `onPropsChange` | `(ctx, prevProps, nextProps) => void` | props 引用变化后 |
| `onError` | `(ctx, error, errorInfo?) => void` | 插件渲染抛错（`PluginErrorBoundary` 捕获） |
| `transformProps` | `(props) => props` | 每次渲染前，链式改写 props |
| `transformData` | `(ctx, data) => data` | 同上，改写 data |
| `renderOverlay` | `(ctx) => ReactNode` | 覆盖层插槽 |
| `renderHeader` | `(ctx) => ReactNode` | 头部插槽，位置由 `config.headerPosition`（`before` / `after`）决定 |
| `renderFooter` | `(ctx) => ReactNode` | 页脚插槽 |

**领域 6 个**（交互 3 + 尺寸 1 + 状态 1 + 价格区 1）：

| 钩子 | 签名 | 什么时候跑 |
| --- | --- | --- |
| `onClick` | `(ctx, event) => void` | 容器点击 |
| `onHover` | `(ctx, isHovered) => void` | 进出各一次 |
| `onVisibilityChange` | `(ctx, isVisible) => void` | 进出视口 |
| `onResize` | `(ctx, width, height) => void` | `ResizeObserver`，内容盒尺寸 |
| `onStateChange` | `(ctx, prevState, nextState) => void` | `setState` 后，带前后快照 |
| `renderPriceArea` | `(ctx) => ReactNode` | 价格区领域槽（见下） |

> 用**方法语法**声明参数（`onMount?(ctx: CardPluginContext<T>)`）是有意的：内核把 context 收窄成领域上下文时靠 bivariance 校验，写成属性箭头函数会类型报错。

### 插槽与排序

`renderHeader` / `renderFooter` / `renderOverlay` 由内核 `composeSlots` 按固定五段拼：

```
before-header → children → overlay → after-header → footer
```

`renderPriceArea` 走包内领域槽（`renderDomainSlot`），由复合组件读取后渲染进自己的布局。

两处排序规则一致：**`config.order` 升序 → `priority` 降序**。

```ts
// 价格区：券条在最上（0），价格居中（10），按钮最后（20）
createCouponPlugin({ /* config.order 默认 0 */ })
createPriceCalculatorPlugin()   // config.order = 10
createActionsPlugin()           // config.order = 20
```

`headerPosition` 是公开配置名，装配层会映射成内核认的 `config.slotPosition`。不映射的话所有头部插件都会落到默认的 `after` 段。

### 领域槽 API

```ts
usePluginSlot(slot: "priceArea"): ReactNode[]
renderDomainSlot(plugins, context, "renderPriceArea"): ReactNode[]
```

复合组件用前者（在装配好的卡里就读得到），手写布局用后者。单个插件渲染抛错只丢它自己那一段（每个片段单独一层 `PluginErrorBoundary`）。

## 总线协议

`PluginBus` 是内核实现，形状在这里**重新声明**而不是从 `@vane/plugin-core` re-export —— 内核未发布到 npm，公开 d.ts 里出现 `import type { PluginBus } from "@vane/plugin-core"` 会让消费方直接 `Cannot find module`。

| 方法 | 说明 |
| --- | --- |
| `emit(event, data?)` | 发事件 |
| `on(event, handler)` | 订阅，返回退订函数 |
| `once(event, handler)` | 订阅一次，返回退订函数 |
| `off(event, handler?)` | 退订 |
| `getData` / `setData` / `deleteData` / `hasData` / `getAll` / `clear` | 键值存储 |

### 6 个约定键（`BusKeys`）

| 常量 | 键 | 写 | 读 |
| --- | --- | --- | --- |
| `skuSelection` | `sku.selection` | SKU | —（外部可读，包内无消费者） |
| `skuVariant` | `sku.variant` | SKU | Image（切图）、Inventory（库存）、Quantity（上限） |
| `skuPrice` | `sku.price` | SKU（命中变体价）、PriceCalculator（到手价） | ComparePrice、CouponRecommend、OrderSummary、PriceCalculator |
| `skuImage` | `sku.image` | SKU | —（历史键，保留给外部消费者；复合组件走 `matchVariant` 自己算） |
| `quantity` | `quantity` | Quantity | PriceCalculator、OrderSummary、CouponRecommend |
| `couponApplied` | `coupon.applied` | Coupon、CouponRecommend | PriceCalculator、OrderSummary |

**SKU 是唯一「源」**：它只写不订阅，所以不会因为自己的写入而重渲染。改键名要同步改这张表里的所有消费者 —— 这是唯一一处「隐式契约」，动它之前先看 `test/bus-protocol.test.tsx`。

## ProductData（复合组件的数据契约）

`vane-card/compound` 里的 38 个组件都从 `useProductCard()` 读同一份 data，所以这张表就是「`<ProductCard data={...}>` 允许传什么」。

| 字段 | 类型 | 用于 |
| --- | --- | --- |
| `title` / `subtitle` / `description` | `string` | 标题、副标题、描述 |
| `image` / `images` | `string` / `string[]` | 主图、图集 |
| `price` / `oldPrice` | `number` | 价格、划线价 |
| `inventory` | `number` | 无变体时的总库存 |
| `sku` / `brand` / `badge` / `badges` | `string` / `string[]` | 商家编码、品牌、角标 |
| `tags` / `features` | `string[]` | 标签、卖点 |
| `specs` | `Record<string, ReactNode> \| Array<{ key, value }>` | 参数表（两种形态都支持） |
| `colors` / `sizes` | `Array<{ name, hex }> \| string[]` / `string[]` | 色板、尺码 |
| `variants` | `ProductVariant[] \| Record<string, string[]>` | 规格数据（数组形态 = 变体列表，映射形态 = 属性选项集） |
| `rating` / `ratingCount` | `number` | 评分、评价数 |
| `shipping` / `shippingInfo` / `warranty` | `string` | 物流、运费说明、质保 |
| `weightGram` / `unitWeight` | `number` | 单位价、运费估算 |
| `[key: string]: unknown` | — | 索引签名是刻意的：业务数据常带一堆与渲染无关的字段，收太死调用方只能 `as any` |

**所有字段可选**：缺哪个就只是对应组件不渲染或走默认值，不抛错。

### 变体工具

历史数据里 `options` 与 `attributes` 两种键名都出现过，**读变体一律走工具函数，不要直接取字段**：

| 函数 | 签名 | 说明 |
| --- | --- | --- |
| `matchVariant` | `(data, attrs) => ProductVariant \| undefined` | 属性集**一一对上**才命中；未选全返回 `undefined`（回退商品级字段） |
| `variantListOf` | `(data) => ProductVariant[] \| undefined` | 取数组形态 |
| `attributeMapOf` | `(data) => Record<string, string[]> \| undefined` | 取映射形态 |
| `variantOptionsOf` | `(variant) => Record<string, string \| number>` | 兼容 `options` / `attributes` |

`matchVariant` 的语义在 2.0 修过一次：旧逻辑是「每个已选属性都对上」，只选了颜色就会命中「红 / M」拿到 M 的价格 —— 显示错价。现在是「变体属性集与已选属性集一一对上」，选不全就不命中。
