# 组合配方

三个配方，覆盖「一张商品卡」的三种用法。配方**只是「一组插件的工厂」**，没有隐藏行为：每一项都能覆盖、能 `omit`、能拆开只取其中几个。

```ts
import { productCardPreset } from "vane-card/presets/product-card";
import { skuFlowPreset } from "vane-card/presets/sku-flow";
import { checkoutPreset } from "vane-card/presets/checkout";
```

## product-card：展示卡

最常用的一组 —— 主图 + 角标 + 悬停反馈 + 加购 / 收藏 + 状态初值。

```tsx
const Card = withPlugins(CardCore, {
  plugins: productCardPreset({
    image: { alt: "商品主图" },
    badge: { text: "甄选", type: "new" },
  }),
});
```

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| `image` / `badge` / `hover` / `actions` / `state` | 各插件的 config | 透传给对应插件 |
| `omit` | `Array<"image" \| "badge" \| "hover" \| "actions" \| "state">` | 去掉其中某几项 |

列墙（列表页）用它就够了：不装交易组，`state.cart` 也还是初始值 `false`，加购按钮点了会变文案但不会有跨卡汇总 —— 汇总要在外层监听 `cart:change`。

## sku-flow：选规格到价格联动

`SKU（源）→ 数量 → 价格计算 → 库存`。四个插件靠总线串起来，**任何一环缺失价格区都会失效**，所以打包成配方，避免漏装。

```tsx
const Card = withPlugins(CardCore, {
  plugins: skuFlowPreset({
    attributes: [
      { name: "颜色", options: ["红", "蓝"] },
      { name: "尺码", options: ["M", "L"] },
    ],
    variants: [
      { sku: "R-M", attrs: { 颜色: "红", 尺码: "M" }, price: 299, stock: 8 },
      { sku: "B-L", attrs: { 颜色: "蓝", 尺码: "L" }, price: 319, stock: 0 },
    ],
    quantity: { max: 5 },
    renderIn: "footer",
  }),
});
```

| 选项 | 说明 |
| --- | --- |
| `attributes` / `variants` | **必填**。属性定义与变体列表 |
| `quantity` / `price` / `inventory` | 三个插件的 config |
| `renderIn` | 规格控件放 `footer` 还是 `overlay` |
| `omit` | `Array<"quantity" \| "price" \| "inventory">` |

`omit` 是给「商详页只要规格选择、价格由外面的大价格区负责」这类场景准备的 —— 此时页面外侧自己渲染价格，卡内只留选规格。

## checkout：结算区

券 + 订单摘要 + 比价 + 埋点。它假设价格已经在总线上（`sku.price`），所以**不装 SKU / Quantity** —— 结算页的数量通常由订单行决定，不在卡上改。

```tsx
const Summary = withPlugins(CardCore, {
  plugins: checkoutPreset({
    // Coupon 的形状就是这四栏：code / discount / minAmount / expiry
    coupons: [
      { code: "MINUS20", discount: 20, minAmount: 200 },
      { code: "OFF10", discount: 10 },
    ],
    summary: { showShipping: true, shippingFee: 8 },
  }),
});
```

| 选项 | 说明 |
| --- | --- |
| `coupons` | 券列表，同时给到手价与推荐插件用（推荐项的 config 从它取 `coupons`） |
| `summary` / `compare` / `analytics` | 三个插件的 config |
| `coupon` | 推荐插件的 config（`coupons` 自动注入，不用再传） |
| `omit` | `Array<"coupon" \| "summary" \| "compare" \| "analytics">` |

## 组合经验

四条都是踩过的，不是原则性说教。

### 1. 价格区只有一个决策者

会写 `sku.price` 的插件只能有一个。`PriceCalculator` 是默认决策者：它读 `skuPrice` + `quantity` + `couponApplied`，写出到手价。再装一个自己写的「折扣插件」也去写 `sku.price`，价格区就出现两个价 —— 而且谁赢取决于 `priority`，改一次参数就换一个结果。

要加规则（会员价、阶梯价），**改 PriceCalculator 的输入**（往总线写一个 `memberLevel` 之类的键，自己读），而不是再写一个 `sku.price`。

### 2. 改总线键名必须同步消费者

6 个键是唯一的隐式契约。改 `BusKeys.quantity` 的字符串值而漏改某个插件，症状是「数量变了但价格不动」—— 没有报错，只是不生效。

`test/bus-protocol.test.tsx` 锁住了三条链（SKU→价格、数量→价格、券→到手价）。改键之前先跑它，改完确认它还是绿的。

### 3. 装配定型一次

`withPlugins` 每次调用返回**新的组件类型**。放在渲染函数里，React 认为是另一个组件 → 整棵子树卸载重建：`onMount` 重跑、内部 state 归零、图片重新加载。

- 固定组合 → 模块顶层调一次（`makeCard`）
- 动态组合 → 按**插件名**记忆，不是按数组引用（内联数组每次都是新引用）

```tsx
const key = plugins.map((p) => p.name).join("|");
const Card = useMemo(() => withPlugins(CardCore, { plugins }), [key]);
```

### 4. `order` 改位置，`priority` 改顺序

想「按钮排最后」就用 `config.order`（结构性），不要用 `priority` 去撞 —— 撞赢了这次，下次有人加插件就又乱了。反过来，想让某个插件「先读到最新值」才用 `priority`。

这也是 `ActionsPlugin` 的 `order: 20` 的由来：footer 里「券 → 价格 → 按钮」应该是结构性的，不靠运气。

### 5. 配方的 `omit` 比拆插件更好读

`productCardPreset({ omit: ["hover"] })` 比手写四个 `createXxxPlugin` 更清楚意图：**看到的是我拿走了什么**，而不是我得逐个核对「还差什么」。
