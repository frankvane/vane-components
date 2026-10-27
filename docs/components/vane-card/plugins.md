# 插件

22 个插件，五组。**每个目录下有一份 `doc.json` 作为文档真相** —— 下面的表由 `pnpm docs:plugins` 从 `doc.json` 与源码里的 `priority` 生成，改配置项时改 `doc.json`，别手改表。

分组的顺序就是它们在一张卡上的作用顺序：

| 组 | 数量 | 一句话 | 成员 |
| --- | --- | --- | --- |
| 媒体 | 3 | 卡的上半部分是什么 | Image / Video / Gallery |
| 交易 | 8 | 从选规格到手价、优惠、汇总、库存，一条链 | SKU / Quantity / PriceCalculator / ComparePrice / Coupon / CouponRecommend / OrderSummary / Inventory |
| 展示 | 5 | 不动数据，只加信息与氛围 | Badge / UserTag / Countdown / Review / Animation |
| 交互 | 2 | 用户能点、能悬停 | Actions / Hover |
| 基础设施 | 4 | 状态、埋点、无障碍、自适应 | State / Analytics / A11y / Responsive |

## 媒体组

三个插件渲染的都是容器里的**同一块位置**（`header`），选一个而不是叠加：

- **Image** 是占位实现，只保证「有图、有比例、有兜底」。懒加载 / 模糊占位 / 自适应尺寸不在本包范围内 —— 那是 `vane-lazy-image` 的活（D1-A 决策）。`lazyLoad` 只是给 `<img>` 加 `loading` 属性，别据此认为已经做了懒加载。
- **Video** 播一个 mp4，不接管图片逻辑。
- **Gallery** 是带指示点与缩略图的轮播，一张图时退化成静态图。它**不订阅总线**：切图靠自己的状态，不是靠 SKU。

## 交易组

这一组的顺序是被 `priority` 定死的，不是随意排的：

```
SKU 60 写完总线 → Inventory 45 / Quantity 30 读库存 → PriceCalculator 20 算到手价
  → Coupon 25 / CouponRecommend 22 写券 → OrderSummary 18 / ComparePrice 20 读来汇总
```

- **SKU 是唯一「源」**：只写不订阅，所以不会因为自己的写入而重渲染。`sku.selection` / `sku.variant` / `sku.price` / `sku.image` 四个键都由它写。
- **Quantity 的上限来自 SKU**：`max` 读变体的 `stock`。不装 SKU 就退回商品级库存，看起来像「上限没生效」。
- **PriceCalculator 是到手价的唯一决策者**：它读 `skuPrice` + `quantity` + `couponApplied`，写出最终价。再装一个会写 `sku.price` 的插件（自己写的），价格区会出现两个价。
- **Coupon 与 CouponRecommend 都会写 `coupon.applied`**：同时装时，后执行的那个说了算（Coupon 25 > CouponRecommend 22）。要「自动推荐 + 手动勾选」共存，把自动推荐的 `priority` 调到 25 以下并让手动券覆盖，或者干脆只用其中一个。
- **Inventory 只读**：读 `skuVariant` 的 `stock` 出「仅剩 N 件」。它不会禁用按钮 —— 售罄置灰要自己接。

## 展示组

纯加法，除倒计时外都不碰总线：

- **Badge** 与 **Countdown** 都画在 `overlay` 的 `top-right`（偏移都是 8px、`zIndex` 都是 10），默认会**完全重叠**。要共存必须给其中一个改 `position`。
- **Animation** 在 `onMount` 里命令式写容器内联 `transform`，**priority 1 保证它最后执行**，会盖掉其它插件在 `onMount` 里写的 `opacity` / `transform`。
- **Review** 只渲染评分与评价数，不做评价列表。

## 交互组

- **Actions** 的按钮状态写在卡片 `state.cart` / `state.wishlist` 上，并向外抛 `cart:change`。state 是**每张卡独立**的，购物车总量要在外层监听事件汇总。
- **Hover** 走 `transformProps` 注入容器样式，不额外包 DOM。`priority 5`（很低）保证它先注入基础样式、被后续插件覆盖。
- 两者都与 **Animation** 抢 `transform`：后写者赢。同屏建议只留一个负责 `transform`。

## 基础设施组

- **State** 只做状态初值与差分回调（`onCartChange` / `onWishlistChange` 是 config 回调，不是钩子 —— 旧版那两个钩子从未被执行过，C2 已删）。不持久化，刷新即丢。
- **Analytics** 复用 `CardCore` 的可见性观测（不自建 IntersectionObserver）。`priority 50` 高于价格 / 券类发布方（20~25），保证 `onMount` 里先订阅、收得到首个 `price:change`。**不给 `transport` 也不给 `sdk` 时只打 console**，线上等于静默丢弃。
- **A11y** 给卡片补 `role` / `aria-label`，可选键盘导航与播报。`Enter` / `Space` 是在事件目标上直接 `.click()` —— 卡内已有原生按钮时建议关掉 `keyboardNavigation`，否则会触发两次。
- **Responsive** 按容器宽度切 `layout` 与容器样式，并在容器上写 `data-layout` 供 CSS 使用。样式走内联，优先级高于外部 class。

## 目录（自动生成）

<!-- AUTO-GENERATED:BEGIN priority -->
| 插件 | priority | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- | --- |
| [A11yPlugin](./A11yPlugin) | 100 | 无障碍增强：给卡片补 role / aria-label、可选键盘导航与聚焦播报、高对比配色。 | `announceOnFocus` = false<br/>`keyboardNavigation` = true<br/>`highContrast` = false | 2.0.0 | infra, a11y, 无障碍 |
| [ActionsPlugin](./ActionsPlugin) | 20 | 页脚的操作按钮区：加入购物车 / 加入心愿单，状态写在卡片 state 上（cart / wishlist），并向外抛出 cart:change 事件。 | `showCartButton` = true<br/>`showWishlistButton` = true<br/>`cartButtonText` = { add: "加入购物车", remove: "移出购物车" }<br/>`wishlistButtonText` = { add: "加入心愿单", remove: "移出心愿单" }<br/>`renderCustomActions` = - | 2.0.0 | interaction, footer, 按钮 |
| [AnalyticsPlugin](./AnalyticsPlugin) | 50 | 曝光 / 点击 / 加购 / 心愿单上报。曝光复用 CardCore 的可见性观测（不自建 IntersectionObserver），可接自定义 transport 或第三方 SDK。 | `transport` = -<br/>`sdk` = -<br/>`minExposureMs` = 0 | 2.0.0 | infra, analytics, 埋点 |
| [AnimationPlugin](./AnimationPlugin) | 1 | 入场动画：挂载时淡入 + 上移 20px。尊重系统「减弱动效」偏好，卸载时清理定时器并复原内联样式。 | - | 2.0.0 | display, animation, 动效 |
| [BadgePlugin](./BadgePlugin) | 15 | 在卡片角落渲染一枚角标（甄选 / 热卖 / 新品 / 促销）。config 优先，未配置时回落到数据里的 badge 与 badgeType 字段。 | `text` = -<br/>`type` = "default"<br/>`position` = "top-right"<br/>`customStyle` = {} | 2.0.0 | display, overlay, 角标 |
| [ComparePricePlugin](./ComparePricePlugin) | 20 | 竞品比价：列出其它平台价格，标出最低价，并高亮「比我们便宜」的项。当前价取自总线 skuPrice，变化时会重算高亮。 | `competitors` = []<br/>`showLowestPrice` = true<br/>`sortBy` = "price"<br/>`sortOrder` = "asc"<br/>`filterMaxPrice` = -<br/>`highlightLowerThanOurPrice` = true<br/>`priceDiffHighlightThreshold` = 0 | 2.0.0 | buy, price, 比价 |
| [CountdownPlugin](./CountdownPlugin) | 40 | 倒计时角标：按截止时间或持续时长每秒刷新，归零显示「已结束」并停止计时。 | `endTimestamp` = -<br/>`durationMs` = 3600000<br/>`position` = "top-left"<br/>`style` = {}<br/>`prefix` = "⏰" | 2.0.0 | display, overlay, 倒计时 |
| [CouponPlugin](./CouponPlugin) | 25 | 展示可选优惠券并写入总线（coupon.applied），供 OrderSummary / PriceCalculator 等消费。可配置自动套用第一张。 | `coupons` = []<br/>`autoApply` = false | 2.0.0 | buy, footer, 优惠券, bus-source |
| [CouponRecommendPlugin](./CouponRecommendPlugin) | 22 | 按当前小计推荐可用券，可自动套用最优券；套用结果写进总线 coupon.applied，与手选券（CouponPlugin）共用同一个键。 | `coupons` = -<br/>`placement` = "footer"<br/>`autoApplyBest` = false<br/>`currency` = CNY<br/>`locale` = zh-CN<br/>`order` = 0 | 2.0.0 | buy, coupon, bus-source |
| [GalleryPlugin](./GalleryPlugin) | 40 | 图片/视频轮播头图：指示点、缩略图、点击放大，视频可插到指定位置。一张图时退化为静态图。 | `images` = []<br/>`autoplay` = false<br/>`interval` = 3000<br/>`showIndicators` = true<br/>`enableZoom` = false<br/>`showThumbnails` = true<br/>`style` = {}<br/>`videoSrc` = -<br/>`videoPoster` = -<br/>`videoIndex` = 末尾<br/>`headerPosition` = "before"<br/>`order` = 0 | 2.0.0 | media, header, 画廊 |
| [HoverPlugin](./HoverPlugin) | 5 | 悬停时的视觉反馈：投影 / 轻微放大 / 描边。走 transformProps 注入容器样式，不额外包 DOM。 | `enableShadow` = true<br/>`enableScale` = true<br/>`enableBorder` = false<br/>`shadowIntensity` = "medium"<br/>`scaleRatio` = 1.02 | 2.0.0 | display, interaction, hover |
| [ImagePlugin](./ImagePlugin) | 10 | 商品主图（占位实现）：固定 1:1、加载前可占位、失败可兜底；选中变体带图时自动换图。要真正的懒加载/模糊占位请用 vane-lazy-image。 | `src` = -<br/>`alt` = data.name 或「商品图片」<br/>`lazyLoad` = false<br/>`placeholder` = -<br/>`errorFallback` = - | 2.0.0 | media, header, 图片 |
| [InventoryPlugin](./InventoryPlugin) | 45 | 库存状态：无货盖「已售罄」蒙层，低库存角标提示。库存口径与 QuantityPlugin 一致（选中变体库存优先）。 | `lowStockThreshold` = 5<br/>`showOverlayWhenSoldOut` = true | 2.0.0 | buy, overlay, 库存 |
| [OrderSummaryPlugin](./OrderSummaryPlugin) | 18 | 订单汇总：小计、券抵扣、税费、运费、合计逐行展开，数据全部取自总线，不重复算价。 | `showBreakdown` = true<br/>`showTax` = false<br/>`showShipping` = false<br/>`currency` = CNY<br/>`locale` = zh-CN<br/>`taxRate` = 0<br/>`shippingFee` = 0<br/>`placement` = "footer" | 2.0.0 | buy, summary, footer |
| [PriceCalculatorPlugin](./PriceCalculatorPlugin) | 20 | 价格区核心：展示单价、划线原价、折扣、节省额与合计，并在价格/数量/券变化时发布 price:change 事件。 | `showOriginalPrice` = false<br/>`showDiscount` = false<br/>`showSavings` = false<br/>`showSavingsBadgeInPriceArea` = false<br/>`showTotalPrice` = false<br/>`currency` = CNY<br/>`locale` = zh-CN<br/>`order` = 0 | 2.0.0 | buy, price, bus-source |
| [QuantityPlugin](./QuantityPlugin) | 30 | 数量步进器：上下限随变体库存自动收紧，数量写入总线（quantity）供价格/汇总插件消费；可渲染在页脚或覆盖层。 | `min` = 1<br/>`max` = 自动<br/>`step` = 1<br/>`renderIn` = "footer"<br/>`useVariantStock` = true<br/>`resetOnVariantChange` = true<br/>`clampOnMaxDecrease` = true | 2.0.0 | buy, quantity, stepper |
| [ResponsivePlugin](./ResponsivePlugin) | 80 | 按容器宽度切换布局方向与容器样式：手机/平板竖向、桌面横向，并在容器上写 data-layout 供 CSS 选择器使用。 | `breakpoints` = { mobile: 600, tablet: 900, desktop: 1200 }<br/>`layouts` = { mobile: "vertical", tablet: "vertical", desktop: "horizontal" }<br/>`containerStyles` = {} | 2.0.0 | media, responsive, 布局 |
| [ReviewPlugin](./ReviewPlugin) | 30 | 页脚评价区：星级 + 评分 + 评价数；可选开启用户打分与评论输入。 | `showRating` = true<br/>`showReviewCount` = true<br/>`enableUserReview` = false<br/>`onReviewSubmit` = - | 2.0.0 | buy, footer, 评价 |
| [SKUPlugin](./SKUPlugin) | 60 | 变体选择与匹配：属性选择写入总线，命中的变体（价格/库存/图片）同步到 selection、variant、price、image 四个键，是整条交易链的源头。 | `attributes` = -<br/>`variants` = -<br/>`renderIn` = "footer" | 2.0.0 | buy, sku, bus-source |
| [StatePlugin](./StatePlugin) | 100 | 卡片状态初值与差分回调：把 cart / wishlist 初始化为 false，并在状态变化时回调 config 里的 onCartChange / onWishlistChange。 | `enableCart` = true<br/>`enableWishlist` = true<br/>`onCartChange` = -<br/>`onWishlistChange` = - | 2.0.0 | infra, state, 生命周期 |
| [UserTagPlugin](./UserTagPlugin) | 35 | 在图片右下角叠加一组用户标签（如「宝妈首选」「回购 3 次」），超量自动截断。 | `tags` = []<br/>`maxTags` = 3 | 2.0.0 | display, overlay, 标签 |
| [VideoPlugin](./VideoPlugin) | 40 | 在卡片头部区域渲染 16:9 视频；可选悬停自动播放/暂停。与 GalleryPlugin 同时启用时自动让位，避免重复渲染。 | `src` = -<br/>`autoplay` = false<br/>`muted` = true<br/>`loop` = false<br/>`controls` = true<br/>`poster` = -<br/>`playOnHover` = false<br/>`style` = {}<br/>`headerPosition` = "after"<br/>`order` = 0 | 2.0.0 | media, header, 视频 |
<!-- AUTO-GENERATED:END -->

## 渲染位置与排序

`priority` 管执行顺序，`config.order` 管插槽位置。下表是 22 个插件的实际落点：

| 插件 | priority | 渲染位置 | 碰的总线键 |
| --- | --- | --- | --- |
| SKU | 60 | footer + overlay | `sku.selection` `sku.variant` `sku.price` `sku.image` |
| Quantity | 30 | footer + overlay | `quantity`（写）、`sku.variant`（读） |
| PriceCalculator | 20 | footer + priceArea | `sku.price`（写）、`quantity` `coupon.applied`（读） |
| Coupon | 25 | footer | `coupon.applied`（写） |
| CouponRecommend | 22 | footer + overlay + priceArea | `coupon.applied`（写）、`quantity` `sku.price`（读） |
| OrderSummary | 18 | footer + overlay | `sku.price` `quantity` `coupon.applied`（读） |
| ComparePrice | 20 | footer + priceArea | `sku.price`（读） |
| Inventory | 45 | overlay | `sku.variant`（读） |
| Image | 10 | header | `sku.variant`（读） |
| Video | 40 | header | — |
| Gallery | 40 | header | — |
| Badge | 15 | overlay | — |
| UserTag | 35 | overlay | — |
| Countdown | 40 | overlay | — |
| Review | 30 | footer | — |
| Animation | 1 | —（写容器内联样式） | — |
| Actions | 20 | footer（`order: 20`） | — |
| Hover | 5 | —（`transformProps`） | — |
| State | 100 | — | — |
| A11y | 100 | —（改容器属性） | — |
| Analytics | 50 | — | — |
| Responsive | 80 | —（`transformProps`） | — |

`priceArea` 是**领域槽**，不是内核插槽：三个价格类插件把片段写进槽里，由复合组件（`Price` / `CouponBar` / `OrderSummaryPanel`）决定插在自己布局的哪一段。它们不直接往 footer 里塞 DOM。

## 谁和谁不能一起装

判据只有一条：同时装上之后会**「看起来能用，其实不生效」**。单纯的功能叠加不算冲突。

| A | B | 为什么 |
| --- | --- | --- |
| Image | Gallery | 都渲染 `header` 的主媒体区，Gallery 盖掉 Image，兜底逻辑等于没装 |
| Badge | Countdown | 都在 `overlay` 的 `top-right`、8px、`zIndex: 10` —— 完全重叠。改 `position` 才能共存 |
| Animation | Hover | 都在写容器的 `transform`：一个命令式写内联、一个走 `transformProps`，后写者覆盖 |
| Quantity | SKU | 不算错，但 `max` 依赖变体库存：不装 SKU 就退回商品级库存，像「上限没生效」 |

另外两处「同名不同命」值得留意：

- **两个 Countdown** 会叠在同一个角，只留一个；
- **两个会写 `sku.price` 的插件**（比如自己再写一个折扣插件）会让价格区出现两个「到手价」。

演示站的插件工坊把这四对做成了勾选时的提示，勾上就能当场看见。

## 一个插件都不装

`CardCore` 单独用是合法的：

```tsx
<CardCore cardId="p1" data={item} renderContent={(data) => <div>{data.title}</div>} />
```

此时只有盒子、padding、三个回调和一个 ref。`withPlugins` 的价值在于「按需加行为」，不在于「必须有插件」。

## 写自己的插件

插件就是一个对象：

```tsx
import type { CardPlugin } from "vane-card";

export function createMyPlugin(options: { label: string }): CardPlugin {
  return {
    name: "MyPlugin",
    priority: 30,
    config: { order: 10 },
    hooks: {
      renderPriceArea: (ctx) => <span className="my-tag">{options.label}</span>,
      onMount: (ctx) => {
        const off = ctx.bus.on("price:change", () => ctx.forceUpdate());
        return off; // 返回值当清理函数，卸载时执行
      },
    },
  };
}
```

三条约定：`onMount` 的返回值是清理函数（不是被丢弃）；`setState` 的 updater 保持纯函数（事件在 `onStateChange` 里发）；改总线键名要同步改 [API · 总线协议](api.md#总线协议) 那张表。钩子全清单见 [API · 15 个钩子](api.md#15-个钩子)。
