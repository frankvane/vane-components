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
| [A11yPlugin](#a11yplugin) | 100 | 无障碍增强：给卡片补 role / aria-label、可选键盘导航与聚焦播报、高对比配色。 | `announceOnFocus` = false<br/>`keyboardNavigation` = true<br/>`highContrast` = false | 2.0.0 | infra, a11y, 无障碍 |
| [ActionsPlugin](#actionsplugin) | 20 | 页脚的操作按钮区：加入购物车 / 加入心愿单，状态写在卡片 state 上（cart / wishlist），并向外抛出 cart:change 事件。 | `showCartButton` = true<br/>`showWishlistButton` = true<br/>`cartButtonText` = { add: "加入购物车", remove: "移出购物车" }<br/>`wishlistButtonText` = { add: "加入心愿单", remove: "移出心愿单" }<br/>`renderCustomActions` = - | 2.0.0 | interaction, footer, 按钮 |
| [AnalyticsPlugin](#analyticsplugin) | 50 | 曝光 / 点击 / 加购 / 心愿单上报。曝光复用 CardCore 的可见性观测（不自建 IntersectionObserver），可接自定义 transport 或第三方 SDK。 | `transport` = -<br/>`sdk` = -<br/>`minExposureMs` = 0 | 2.0.0 | infra, analytics, 埋点 |
| [AnimationPlugin](#animationplugin) | 1 | 入场动画：挂载时淡入 + 上移 20px。尊重系统「减弱动效」偏好，卸载时清理定时器并复原内联样式。 | - | 2.0.0 | display, animation, 动效 |
| [BadgePlugin](#badgeplugin) | 15 | 在卡片角落渲染一枚角标（甄选 / 热卖 / 新品 / 促销）。config 优先，未配置时回落到数据里的 badge 与 badgeType 字段。 | `text` = -<br/>`type` = "default"<br/>`position` = "top-right"<br/>`customStyle` = {} | 2.0.0 | display, overlay, 角标 |
| [ComparePricePlugin](#comparepriceplugin) | 20 | 竞品比价：列出其它平台价格，标出最低价，并高亮「比我们便宜」的项。当前价取自总线 skuPrice，变化时会重算高亮。 | `competitors` = []<br/>`showLowestPrice` = true<br/>`sortBy` = "price"<br/>`sortOrder` = "asc"<br/>`filterMaxPrice` = -<br/>`highlightLowerThanOurPrice` = true<br/>`priceDiffHighlightThreshold` = 0 | 2.0.0 | buy, price, 比价 |
| [CountdownPlugin](#countdownplugin) | 40 | 倒计时角标：按截止时间或持续时长每秒刷新，归零显示「已结束」并停止计时。 | `endTimestamp` = -<br/>`durationMs` = 3600000<br/>`position` = "top-left"<br/>`style` = {}<br/>`prefix` = "⏰" | 2.0.0 | display, overlay, 倒计时 |
| [CouponPlugin](#couponplugin) | 25 | 展示可选优惠券并写入总线（coupon.applied），供 OrderSummary / PriceCalculator 等消费。可配置自动套用第一张。 | `coupons` = []<br/>`autoApply` = false | 2.0.0 | buy, footer, 优惠券, bus-source |
| [CouponRecommendPlugin](#couponrecommendplugin) | 22 | 按当前小计推荐可用券，可自动套用最优券；套用结果写进总线 coupon.applied，与手选券（CouponPlugin）共用同一个键。 | `coupons` = -<br/>`placement` = "footer"<br/>`autoApplyBest` = false<br/>`currency` = CNY<br/>`locale` = zh-CN<br/>`order` = 0 | 2.0.0 | buy, coupon, bus-source |
| [GalleryPlugin](#galleryplugin) | 40 | 图片/视频轮播头图：指示点、缩略图、点击放大，视频可插到指定位置。一张图时退化为静态图。 | `images` = []<br/>`autoplay` = false<br/>`interval` = 3000<br/>`showIndicators` = true<br/>`enableZoom` = false<br/>`showThumbnails` = true<br/>`style` = {}<br/>`videoSrc` = -<br/>`videoPoster` = -<br/>`videoIndex` = 末尾<br/>`headerPosition` = "before"<br/>`order` = 0 | 2.0.0 | media, header, 画廊 |
| [HoverPlugin](#hoverplugin) | 5 | 悬停时的视觉反馈：投影 / 轻微放大 / 描边。走 transformProps 注入容器样式，不额外包 DOM。 | `enableShadow` = true<br/>`enableScale` = true<br/>`enableBorder` = false<br/>`shadowIntensity` = "medium"<br/>`scaleRatio` = 1.02 | 2.0.0 | display, interaction, hover |
| [ImagePlugin](#imageplugin) | 10 | 商品主图（占位实现）：固定 1:1、加载前可占位、失败可兜底；选中变体带图时自动换图。要真正的懒加载/模糊占位请用 vane-lazy-image。 | `src` = -<br/>`alt` = data.name 或「商品图片」<br/>`lazyLoad` = false<br/>`placeholder` = -<br/>`errorFallback` = - | 2.0.0 | media, header, 图片 |
| [InventoryPlugin](#inventoryplugin) | 45 | 库存状态：无货盖「已售罄」蒙层，低库存角标提示。库存口径与 QuantityPlugin 一致（选中变体库存优先）。 | `lowStockThreshold` = 5<br/>`showOverlayWhenSoldOut` = true | 2.0.0 | buy, overlay, 库存 |
| [OrderSummaryPlugin](#ordersummaryplugin) | 18 | 订单汇总：小计、券抵扣、税费、运费、合计逐行展开，数据全部取自总线，不重复算价。 | `showBreakdown` = true<br/>`showTax` = false<br/>`showShipping` = false<br/>`currency` = CNY<br/>`locale` = zh-CN<br/>`taxRate` = 0<br/>`shippingFee` = 0<br/>`placement` = "footer" | 2.0.0 | buy, summary, footer |
| [PriceCalculatorPlugin](#pricecalculatorplugin) | 20 | 价格区核心：展示单价、划线原价、折扣、节省额与合计，并在价格/数量/券变化时发布 price:change 事件。 | `showOriginalPrice` = false<br/>`showDiscount` = false<br/>`showSavings` = false<br/>`showSavingsBadgeInPriceArea` = false<br/>`showTotalPrice` = false<br/>`currency` = CNY<br/>`locale` = zh-CN<br/>`order` = 0 | 2.0.0 | buy, price, bus-source |
| [QuantityPlugin](#quantityplugin) | 30 | 数量步进器：上下限随变体库存自动收紧，数量写入总线（quantity）供价格/汇总插件消费；可渲染在页脚或覆盖层。 | `min` = 1<br/>`max` = 自动<br/>`step` = 1<br/>`renderIn` = "footer"<br/>`useVariantStock` = true<br/>`resetOnVariantChange` = true<br/>`clampOnMaxDecrease` = true | 2.0.0 | buy, quantity, stepper |
| [ResponsivePlugin](#responsiveplugin) | 80 | 按容器宽度切换布局方向与容器样式：手机/平板竖向、桌面横向，并在容器上写 data-layout 供 CSS 选择器使用。 | `breakpoints` = { mobile: 600, tablet: 900, desktop: 1200 }<br/>`layouts` = { mobile: "vertical", tablet: "vertical", desktop: "horizontal" }<br/>`containerStyles` = {} | 2.0.0 | media, responsive, 布局 |
| [ReviewPlugin](#reviewplugin) | 30 | 页脚评价区：星级 + 评分 + 评价数；可选开启用户打分与评论输入。 | `showRating` = true<br/>`showReviewCount` = true<br/>`enableUserReview` = false<br/>`onReviewSubmit` = - | 2.0.0 | buy, footer, 评价 |
| [SKUPlugin](#skuplugin) | 60 | 变体选择与匹配：属性选择写入总线，命中的变体（价格/库存/图片）同步到 selection、variant、price、image 四个键，是整条交易链的源头。 | `attributes` = -<br/>`variants` = -<br/>`renderIn` = "footer" | 2.0.0 | buy, sku, bus-source |
| [StatePlugin](#stateplugin) | 100 | 卡片状态初值与差分回调：把 cart / wishlist 初始化为 false，并在状态变化时回调 config 里的 onCartChange / onWishlistChange。 | `enableCart` = true<br/>`enableWishlist` = true<br/>`onCartChange` = -<br/>`onWishlistChange` = - | 2.0.0 | infra, state, 生命周期 |
| [UserTagPlugin](#usertagplugin) | 35 | 在图片右下角叠加一组用户标签（如「宝妈首选」「回购 3 次」），超量自动截断。 | `tags` = []<br/>`maxTags` = 3 | 2.0.0 | display, overlay, 标签 |
| [VideoPlugin](#videoplugin) | 40 | 在卡片头部区域渲染 16:9 视频；可选悬停自动播放/暂停。与 GalleryPlugin 同时启用时自动让位，避免重复渲染。 | `src` = -<br/>`autoplay` = false<br/>`muted` = true<br/>`loop` = false<br/>`controls` = true<br/>`poster` = -<br/>`playOnHover` = false<br/>`style` = {}<br/>`headerPosition` = "after"<br/>`order` = 0 | 2.0.0 | media, header, 视频 |

## 插件能力明细

### A11yPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `announceOnFocus` | `boolean` | `false` | 聚焦时向全局播报区写入「聚焦：xx」 |
| `keyboardNavigation` | `boolean` | `true` | 容器可聚焦，Enter / Space 触发点击 |
| `highContrast` | `boolean` | `false` | 黑描边白底黑字的高对比模式 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getContainer` | `ctx.getContainer(): HTMLDivElement \| null` | 取宿主 DOM 容器，可能为 null，使用前需判空 |

### ActionsPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showCartButton` | `boolean` | `true` | 显示购物车按钮 |
| `showWishlistButton` | `boolean` | `true` | 显示心愿单按钮 |
| `cartButtonText` | `{ add: string; remove: string }` | `{ add: "加入购物车", remove: "移出购物车" }` | 购物车按钮在两种状态下的文案 |
| `wishlistButtonText` | `{ add: string; remove: string }` | `{ add: "加入心愿单", remove: "移出心愿单" }` | 心愿单按钮在两种状态下的文案 |
| `renderCustomActions` | `(context) => React.ReactNode` | `-` | 在所有按钮之后追加自定义操作区 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染，卡片底部槽位 | 卡片底部内容（操作行、价格补充、来源） |
| `cart:change` | 点击加购按钮后 | 广播加购结果 { id, count }，供外部购物车同步 |
| `wishlist:change` | 点击收藏按钮后 | 广播收藏状态 { id, active } |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setState` | `ctx.setState(updates: Partial<CardState>): void` | 合并写入内核 state 并触发重渲染；只有字段真正变化时才更新 |

### AnalyticsPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `transport` | `(event: string, payload: any) => void` | `-` | 自定义上报管道，优先级高于 sdk |
| `sdk` | `{ track?: (event: string, payload: any) => void }` | `-` | 第三方 SDK 适配；transport 未提供时才用 |
| `minExposureMs` | `number` | `0` | 最小曝光时长阈值，短于此时不上报 exposure_exit |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |
| `onClick` | 用户点击卡片主体（内部按钮的点击也会冒泡到这里，需自行判 target） | 整卡点击行为：跳转、埋点、展开详情 |
| `onVisibilityChange` | IntersectionObserver 判定可见性变化（首次判定也会触发） | 曝光 / 离开视口的上报与懒执行入口 |
| `onStateChange` | setState 提交后（回传 prevState / nextState 两份完整状态） | 状态差分后的联动：刷新派生值、上报曝光、触发动效；setState updater 本身保持纯函数 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### AnimationPlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getContainer` | `ctx.getContainer(): HTMLDivElement \| null` | 取宿主 DOM 容器，可能为 null，使用前需判空 |

### BadgePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | `-` | 角标文案；不填则读 data.badge |
| `type` | `"premium" \| "hot" \| "new" \| "sale" \| "default"` | `default` | 配色，对应金 / 橙 / 绿 / 红 / 灰；不填则读 data.badgeType |
| `position` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `top-right` | 角标贴哪个角 |
| `customStyle` | `React.CSSProperties` | `{}` | 覆盖默认样式（默认配色之后合并） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，绝对定位覆盖在卡片内容之上 | 卡片浮层：角标、收藏按钮、动画、骨架遮罩等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ComparePricePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `competitors` | `Array<{ name: string; price: number; url?: string }>` | `[]` | 竞品列表；为空时整块不渲染 |
| `showLowestPrice` | `boolean` | `true` | 标记最低价 |
| `sortBy` | `"price" \| "name"` | `price` | 排序字段 |
| `sortOrder` | `"asc" \| "desc"` | `asc` | 排序方向 |
| `filterMaxPrice` | `number` | `-` | 只显示不高于该价格的竞品 |
| `highlightLowerThanOurPrice` | `boolean` | `true` | 高亮比当前价低的竞品 |
| `priceDiffHighlightThreshold` | `number` | `0` | 价差超过该值才高亮 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |
| `renderFooter` | 每次渲染，卡片底部槽位 | 卡片底部内容（操作行、价格补充、来源） |
| `renderPriceArea` | 渲染价格区时（卡片按 usePluginSlot("priceArea") 读取） | 价格区领域槽：比价、省钱徽章、单位价、可领券提示等，排序规则与内核插槽一致 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CountdownPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `endTimestamp` | `number` | `-` | 结束时间戳（毫秒）；与 durationMs 二选一，优先本项 |
| `durationMs` | `number` | `3600000` | 从挂载时刻起的持续时长（毫秒），默认 1 小时 |
| `position` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `top-left` | 角标位置 |
| `style` | `React.CSSProperties` | `{}` | 覆盖默认样式（黑底白字等宽） |
| `prefix` | `string` | `⏰` | 文本前缀 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，绝对定位覆盖在卡片内容之上 | 卡片浮层：角标、收藏按钮、动画、骨架遮罩等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CouponPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `coupons` | `Coupon[]` | `[]` | 可用券列表（必填），每项含 code / discount / minAmount? / expiry? |
| `autoApply` | `boolean` | `false` | 挂载时自动套用第一张券 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |
| `renderFooter` | 每次渲染，卡片底部槽位 | 卡片底部内容（操作行、价格补充、来源） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CouponRecommendPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `coupons` | `Coupon[]` | `-` | 候选券列表（必填） |
| `placement` | `"footer" \| "overlay"` | `footer` | 渲染位置 |
| `autoApplyBest` | `boolean` | `false` | 挂载时自动套用门槛内优惠力度最大的券 |
| `currency` | `string` | `CNY` | 货币代码 |
| `locale` | `string` | `zh-CN` | 格式化区域 |
| `order` | `number` | `0` | priceArea 渲染顺序 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |
| `renderOverlay` | 每次渲染，绝对定位覆盖在卡片内容之上 | 卡片浮层：角标、收藏按钮、动画、骨架遮罩等 |
| `renderFooter` | 每次渲染，卡片底部槽位 | 卡片底部内容（操作行、价格补充、来源） |
| `renderPriceArea` | 渲染价格区时（卡片按 usePluginSlot("priceArea") 读取） | 价格区领域槽：比价、省钱徽章、单位价、可领券提示等，排序规则与内核插槽一致 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### GalleryPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `images` | `string[]` | `[]` | 图片地址列表；不填则读 data.images |
| `autoplay` | `boolean` | `false` | 自动轮播（含视频时自动关闭，避免抢播） |
| `interval` | `number` | `3000` | 轮播间隔（毫秒） |
| `showIndicators` | `boolean` | `true` | 显示底部指示点 |
| `enableZoom` | `boolean` | `false` | 点击图片放大查看 |
| `showThumbnails` | `boolean` | `true` | 显示缩略图条 |
| `style` | `React.CSSProperties` | `{}` | 画廊容器样式 |
| `videoSrc` | `string` | `-` | 要插入的单个视频地址 |
| `videoPoster` | `string` | `-` | 视频封面 |
| `videoIndex` | `number` | `末尾` | 视频插入位置（从 1 开始），默认追加到末尾 |
| `headerPosition` | `"before" \| "after"` | `before` | 放在卡片主体之前还是之后 |
| `order` | `number` | `0` | 同区域内的排序权重（越小越前） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，卡片头部槽位 | 卡片头部内容（标题行、标签、状态条） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### HoverPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enableShadow` | `boolean` | `true` | 悬停加投影 |
| `enableScale` | `boolean` | `true` | 悬停轻微放大 |
| `enableBorder` | `boolean` | `false` | 悬停加描边 |
| `shadowIntensity` | `"light" \| "medium" \| "heavy"` | `medium` | 投影强度 |
| `scaleRatio` | `number` | `1.02` | 放大倍数，1 表示不放大 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onHover` | 指针进入 / 离开卡片（isHovered 布尔值） | 悬停态处理：预加载、浮层提示、动效触发 |
| `transformProps` | 渲染前链式改写卡片 props | 注入默认值、裁剪字段、按 config 覆盖宿主 props |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getContainer` | `ctx.getContainer(): HTMLDivElement \| null` | 取宿主 DOM 容器，可能为 null，使用前需判空 |

### ImagePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `src` | `string` | `-` | 固定封面图；不填则依次取变体图、data.image |
| `alt` | `string` | `data.name 或「商品图片」` | 替代文本 |
| `lazyLoad` | `boolean` | `false` | 只透传给 &lt;img loading&gt;，不做真正的懒加载（已废弃，见 notes） |
| `placeholder` | `React.ReactNode` | `-` | 加载完成前显示的内容 |
| `errorFallback` | `React.ReactNode` | `-` | 加载失败时替换整张图的内容 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |
| `renderHeader` | 每次渲染，卡片头部槽位 | 卡片头部内容（标题行、标签、状态条） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### InventoryPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `lowStockThreshold` | `number` | `5` | 低库存阈值，库存 ≤ 该值且 &gt; 0 时显示「库存紧张」 |
| `showOverlayWhenSoldOut` | `boolean` | `true` | 无货时是否盖蒙层 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |
| `renderOverlay` | 每次渲染，绝对定位覆盖在卡片内容之上 | 卡片浮层：角标、收藏按钮、动画、骨架遮罩等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### OrderSummaryPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showBreakdown` | `boolean` | `true` | 显示明细行（小计/优惠/税/运费） |
| `showTax` | `boolean` | `false` | 显示税费 |
| `showShipping` | `boolean` | `false` | 显示运费 |
| `currency` | `string` | `CNY` | 货币代码 |
| `locale` | `string` | `zh-CN` | 格式化区域 |
| `taxRate` | `number` | `0` | 税率，0.1 表示 10%（按小计计） |
| `shippingFee` | `number` | `0` | 固定运费 |
| `placement` | `"footer" \| "overlay"` | `footer` | 渲染位置 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |
| `renderOverlay` | 每次渲染，绝对定位覆盖在卡片内容之上 | 卡片浮层：角标、收藏按钮、动画、骨架遮罩等 |
| `renderFooter` | 每次渲染，卡片底部槽位 | 卡片底部内容（操作行、价格补充、来源） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PriceCalculatorPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showOriginalPrice` | `boolean` | `false` | 显示划线原价（需 data.oldPrice &gt; 当前价；兼容旧字段 originalPrice） |
| `showDiscount` | `boolean` | `false` | 显示折扣百分比 |
| `showSavings` | `boolean` | `false` | 显示节省金额 |
| `showSavingsBadgeInPriceArea` | `boolean` | `false` | 在价格区放节省徽章 |
| `showTotalPrice` | `boolean` | `false` | 显示按数量与优惠折算后的合计 |
| `currency` | `string` | `CNY` | 货币代码，交给 Intl.NumberFormat |
| `locale` | `string` | `zh-CN` | 格式化区域 |
| `order` | `number` | `0` | priceArea 渲染顺序（越小越前） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |
| `renderFooter` | 每次渲染，卡片底部槽位 | 卡片底部内容（操作行、价格补充、来源） |
| `renderPriceArea` | 渲染价格区时（卡片按 usePluginSlot("priceArea") 读取） | 价格区领域槽：比价、省钱徽章、单位价、可领券提示等，排序规则与内核插槽一致 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `forceUpdate` | `ctx.forceUpdate(): void` | 主动触发宿主重渲染；改了闭包里的可变状态后必须调用，否则视图不刷新 |

### QuantityPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `min` | `number` | `1` | 最小数量 |
| `max` | `number` | `自动` | 最大数量；不填则由变体库存或 data.inventory 推断 |
| `step` | `number` | `1` | 每次增减的步长 |
| `renderIn` | `"footer" \| "overlay"` | `footer` | 渲染位置（footer 页脚 / overlay 覆盖层，两条分支都已实现） |
| `useVariantStock` | `boolean` | `true` | 优先用选中变体的库存作为上限 |
| `resetOnVariantChange` | `boolean` | `true` | 切换规格时把数量重置回最小值 |
| `clampOnMaxDecrease` | `boolean` | `true` | 上限变小时把当前数量钳制到新上限 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |
| `renderOverlay` | 每次渲染，绝对定位覆盖在卡片内容之上 | 卡片浮层：角标、收藏按钮、动画、骨架遮罩等 |
| `renderFooter` | 每次渲染，卡片底部槽位 | 卡片底部内容（操作行、价格补充、来源） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ResponsivePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `breakpoints` | `{ mobile: number; tablet: number; desktop: number }` | `{ mobile: 600, tablet: 900, desktop: 1200 }` | 三档宽度阈值（px），按容器实际宽度判断 |
| `layouts` | `{ mobile?: "vertical" \| "horizontal"; tablet?: ...; desktop?: ... }` | `{ mobile: "vertical", tablet: "vertical", desktop: "horizontal" }` | 各档位的布局方向 |
| `containerStyles` | `{ mobile?: CSSProperties; tablet?: CSSProperties; desktop?: CSSProperties }` | `{}` | 各档位注入到容器的内联样式 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |
| `onResize` | 容器尺寸变化（width / height，ResizeObserver 驱动） | 按尺寸切换排版或降级（如窄卡隐藏副标题） |
| `transformProps` | 渲染前链式改写卡片 props | 注入默认值、裁剪字段、按 config 覆盖宿主 props |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getContainer` | `ctx.getContainer(): HTMLDivElement \| null` | 取宿主 DOM 容器，可能为 null，使用前需判空 |
| `getSize` | `ctx.getSize(): CardSize` | 读取宿主容器当前尺寸（px），用于按尺寸排版或降级 |

### ReviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showRating` | `boolean` | `true` | 显示星级与平均分 |
| `showReviewCount` | `boolean` | `true` | 显示评价条数 |
| `enableUserReview` | `boolean` | `false` | 开启用户打分与评论输入框 |
| `onReviewSubmit` | `(rating: number, comment: string) => void` | `-` | 提交回调，自己负责发请求 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染，卡片底部槽位 | 卡片底部内容（操作行、价格补充、来源） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SKUPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `attributes` | `SKUAttribute[]` | `-` | 属性定义，如 [{ name: "颜色", options: ["红","蓝"] }] |
| `variants` | `SKUVariant[]` | `-` | 变体列表，每项 { sku, attrs, price?, stock?, image? } |
| `renderIn` | `"footer" \| "overlay"` | `footer` | 选择控件渲染位置 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |
| `renderOverlay` | 每次渲染，绝对定位覆盖在卡片内容之上 | 卡片浮层：角标、收藏按钮、动画、骨架遮罩等 |
| `renderFooter` | 每次渲染，卡片底部槽位 | 卡片底部内容（操作行、价格补充、来源） |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### StatePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enableCart` | `boolean` | `true` | 启用购物车状态 |
| `enableWishlist` | `boolean` | `true` | 启用心愿单状态 |
| `onCartChange` | `(cardId: string, isAdded: boolean) => void` | `-` | 购物车状态变化回调（由 onStateChange 差分触发） |
| `onWishlistChange` | `(cardId: string, isWishlisted: boolean) => void` | `-` | 心愿单状态变化回调 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 卡片挂载完成、插件注册后执行一次 | 建立观察器 / 监听器，返回清理函数以便卸载时释放 |
| `onStateChange` | setState 提交后（回传 prevState / nextState 两份完整状态） | 状态差分后的联动：刷新派生值、上报曝光、触发动效；setState updater 本身保持纯函数 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setState` | `ctx.setState(updates: Partial<CardState>): void` | 合并写入内核 state 并触发重渲染；只有字段真正变化时才更新 |

### UserTagPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tags` | `UserTag[]` | `[]` | 标签列表；data.tags 有值时以数据为准 |
| `maxTags` | `number` | `3` | 最多展示几个，超出直接丢弃（不做省略号） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderOverlay` | 每次渲染，绝对定位覆盖在卡片内容之上 | 卡片浮层：角标、收藏按钮、动画、骨架遮罩等 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### VideoPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `src` | `string` | `-` | 视频地址；不填则读 data.video |
| `autoplay` | `boolean` | `false` | 进页面即自动播放 |
| `muted` | `boolean` | `true` | 静音；autoplay 时必须为 true，否则浏览器会拦截 |
| `loop` | `boolean` | `false` | 循环播放 |
| `controls` | `boolean` | `true` | 显示原生播放控件 |
| `poster` | `string` | `-` | 封面图；不填则读 data.poster |
| `playOnHover` | `boolean` | `false` | 悬停播放、移开暂停（需打开 controls 或 autoplay 才有意义） |
| `style` | `React.CSSProperties` | `{}` | 视频元素样式 |
| `headerPosition` | `"before" \| "after"` | `after` | 放在卡片主体之前还是之后 |
| `order` | `number` | `0` | 同区域内的排序权重（越小越前） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onHover` | 指针进入 / 离开卡片（isHovered 布尔值） | 悬停态处理：预加载、浮层提示、动效触发 |
| `renderHeader` | 每次渲染，卡片头部槽位 | 卡片头部内容（标题行、标签、状态条） |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getContainer` | `ctx.getContainer(): HTMLDivElement \| null` | 取宿主 DOM 容器，可能为 null，使用前需判空 |

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
