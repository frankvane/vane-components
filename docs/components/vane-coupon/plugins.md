# 优惠券 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [AnalyticsPlugin](#analyticsplugin) | 券埋点：coupon:mount / coupon:claim / coupon:error 三类事件，回调与总线 coupon:analytics 双通道，自身不渲染 UI。 | `onEvent` = - | 0.1.0 | coupon, analytics, event |
| [ChannelPlugin](#channelplugin) | 渠道限定角标：按 coupon.channels / config.channels 渲染一组渠道小标（仅 APP / 仅新客…）。 | `channels` = coupon.channels | 0.1.0 | coupon, channel, badge, before |
| [ClaimStatePlugin](#claimstateplugin) | 领取状态机：8 态相位流转（未开始/可领取/领取中/已领取/已使用/已抢空/已过期/已达限领上限），点击触发异步领取，联动有效期、库存、限领与订单可用性自动门控。 | `initialPhase` = -<br/>`claim` = -<br/>`stock` = -<br/>`total` = coupon.total<br/>`claimed` = coupon.claimed<br/>`quota` = coupon.quota<br/>`purchasedCount` = order.purchasedCount ?? 0<br/>`now` = Date.now<br/>`onPhaseChange` = -<br/>`onClaimError` = -<br/>`texts` = -<br/>`ineligibleText` = "不可用" | 0.1.0 | coupon, claim, state-machine, footer |
| [CopyCodePlugin](#copycodeplugin) | 券码复制：claimed/used 相位展示券码与复制按钮（clipboard API + execCommand 兜底），结果写 state.codeCopied。 | `code` = coupon.code<br/>`label` = "券码"<br/>`onCopied` = -<br/>`onError` = - | 0.1.0 | coupon, code, clipboard, after |
| [CountdownPlugin](#countdownplugin) | 开抢倒计时：startAt 未到时渲染「距开抢 HH:MM:SS」，到点可自动开抢（autoStart）并触发 onFire。 | `startAt` = -<br/>`autoStart` = false<br/>`tickMs` = 1000<br/>`onCountdown` = -<br/>`onFire` = - | 0.1.0 | coupon, countdown, timer, before |
| [DetailLinkPlugin](#detaillinkplugin) | 完整规则链接：href 渲染 &lt;a&gt;、onDetail 渲染 &lt;button&gt;，落在规则区下方。 | `href` = -<br/>`text` = "查看完整规则"<br/>`onDetail` = - | 0.1.0 | coupon, link, after |
| [EligibilityPlugin](#eligibilityplugin) | 可用性判定：按订单上下文判定门槛 / 有效期 / 商品范围 / 互斥 / 叠加 / 限领 / 库存，结果写 state.eligible 供领取按钮与宿主复用。 | `order` = props.order<br/>`onEvaluate` = - | 0.1.0 | coupon, eligibility, order |
| [HistoryPlugin](#historyplugin) | 领取记录：按 coupon.history / config.records 倒序渲染最近 N 条领取/使用记录。 | `records` = coupon.history<br/>`max` = 3<br/>`format` = YYYY.MM.DD | 0.1.0 | coupon, history, after |
| [ProgressPlugin](#progressplugin) | 领取进度条：按 total/claimed 渲染已抢百分比进度条，剩余 ≤ N% 换紧迫色，接口轮询数据刷新即更新。 | `total` = coupon.total<br/>`claimed` = coupon.claimed<br/>`stock` = -<br/>`urgentPct` = 20<br/>`showRemaining` = true | 0.1.0 | coupon, progress, stock, after |
| [QuotaPlugin](#quotaplugin) | 每人限领：读 coupon.quota 与已领数渲染限领提示，超限写 state.quotaReached 并被领取按钮实际读取（quota-limited 门控）。 | `quota` = coupon.quota<br/>`purchasedCount` = order.purchasedCount ?? 0<br/>`onExceed` = - | 0.1.0 | coupon, quota, limit, after |
| [RemindPlugin](#remindplugin) | 开抢提醒：未开抢（idle / 倒计时中 / validFrom 未到）渲染提醒开关，开关态写内核 state.reminded，可被宿主复位。 | `text` = "开抢提醒"<br/>`remindedText` = "已设提醒 ✓"<br/>`onRemind` = - | 0.1.0 | coupon, remind, footer |
| [RuleExpandPlugin](#ruleexpandplugin) | 规则展开/收起：使用规则按条数折叠（默认 1 条），展开态写内核 state，可被宿主复位；不用 line-clamp 避免纵向裁切。 | `collapsedCount` = 1<br/>`expandText` = "展开"<br/>`collapseText` = "收起"<br/>`showCount` = true<br/>`title` = "使用规则" | 0.1.0 | coupon, rules, expand, after |
| [SharePlugin](#shareplugin) | 分享按钮：footer 槽渲染次按钮，分享能力由 onShare 回调提供；未配置 onShare 不渲染。 | `text` = "分享好友"<br/>`onShare` = - | 0.1.0 | coupon, share, footer |
| [StackPlugin](#stackplugin) | 叠加态角标：按 coupon.stackable 渲染「可叠加」强调角标或「不可叠加」灰标，可强制展示；渲染在票面顶部角标区。 | `text` = "可叠加"<br/>`notStackableText` = "不可叠加"<br/>`showWhenNotStackable` = false<br/>`always` = false | 0.1.0 | coupon, stack, badge, before |
| [ValidityPlugin](#validityplugin) | 有效期判定：绝对（validFrom/validTo）与相对（领取后 N 天）双模式，紧迫态（剩余 ≤ N 天）强调展示，过期结果写内核 state 供领取状态机联动。 | `now` = Date.now<br/>`urgentDays` = 3 | 0.1.0 | coupon, validity, date, after |

## 插件能力明细

### AnalyticsPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `onEvent` | `(event: string, payload: Record<string, unknown>) => void` | `-` | 埋点回调（与总线双通道） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 券组件挂载完成、插件注册后执行一次 | 初始化副作用，可返回清理函数 |
| `onError` | 任一插件钩子抛错、被沙箱隔离之后 | 上报或降级处理错误；自身抛错不会影响其他插件 |
| `onPhaseChange` | 券相位变化后（如 available → used / expired） | 相位切换时的副作用：埋点、提示、动效 |
| `coupon:analytics` | 曝光 / 领取 / 使用等动作发生时 | 统一埋点出口 { event, ...payload } |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ChannelPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `channels` | `string[]` | `coupon.channels` | 渠道标签列表 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，券面头部槽位 | 面额、券名、标签等券面主视觉 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ClaimStatePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `initialPhase` | `CouponPhase` | `-` | 初始相位，默认 available（可领取）；硬门（过期/售罄/超限）优先 |
| `claim` | `() => Promise<{ ok?: boolean; reason?: string } \| void>` | `-` | 异步领取回调；返回 ok:false 视为失败，回退 available 并触发 onClaimError |
| `stock` | `number` | `-` | 剩余库存；≤ 0 自动降级 soldout（与 total/claimed 取并集） |
| `total` | `number` | `coupon.total` | 发放总量覆盖；claimed ≥ total 时判售罄（与 ProgressPlugin 同口径） |
| `claimed` | `number` | `coupon.claimed` | 已领取数覆盖（与 ProgressPlugin 同口径） |
| `quota` | `number` | `coupon.quota` | 每人限领张数；超限进入 quota-limited |
| `purchasedCount` | `number` | `order.purchasedCount ?? 0` | 当前用户已领张数 |
| `now` | `() => number` | `Date.now` | 判定时钟，点击时按它现算过期（不依赖可能陈旧的 state.validity） |
| `onPhaseChange` | `(phase, prev) => void` | `-` | 相位变化回调 |
| `onClaimError` | `(reason?: string) => void` | `-` | 领取失败回调 |
| `texts` | `Partial<Record<CouponPhase, string>>` | `-` | 按钮文案按相位覆盖 |
| `ineligibleText` | `string` | `不可用` | 订单不可用（门槛/范围/互斥/叠加不满足）时的按钮文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 券组件挂载完成、插件注册后执行一次 | 初始化副作用，可返回清理函数 |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onPropsChange` | 宿主 props 变化后（回传 prev / next 两份） | 按新旧 props 差分决定是否重算内部状态，避免无差别刷新 |
| `onValidityChange` | 可用性判定结果变化（门槛、时间窗、库存等条件重算） | 根据可用性变更刷新外部状态或提示 |
| `renderFooter` | 每次渲染，券面底部槽位 | 有效期、使用门槛、领取 / 使用按钮 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CopyCodePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `code` | `string` | `coupon.code` | 券码 |
| `label` | `string` | `券码` | 标签文案 |
| `onCopied` | `(code: string) => void` | `-` | 复制成功回调 |
| `onError` | `(reason?: string) => void` | `-` | 复制失败回调（clipboard 与 execCommand 均失败时触发，reason 为 clipboard-unavailable） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 券组件挂载完成、插件注册后执行一次 | 初始化副作用，可返回清理函数 |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `renderHeader` | 每次渲染，券面头部槽位 | 面额、券名、标签等券面主视觉 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CountdownPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `startAt` | `number` | `-` | 开抢时间（epoch ms），必填 |
| `autoStart` | `boolean` | `false` | 到点自动进入 available |
| `tickMs` | `number` | `1000` | 定时精度 |
| `onCountdown` | `(remainingMs: number) => void` | `-` | 每跳回调 |
| `onFire` | `() => void` | `-` | 倒计时归零回调 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 券组件挂载完成、插件注册后执行一次 | 初始化副作用，可返回清理函数 |
| `renderHeader` | 每次渲染，券面头部槽位 | 面额、券名、标签等券面主视觉 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `setPhase` | `ctx.setPhase(phase: CouponPhase): void` | 写入业务相位（写入即触发 context 重建与视图切换） |

### DetailLinkPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `href` | `string` | `-` | 详情页链接（有则渲染 &lt;a&gt;） |
| `text` | `string` | `查看完整规则` | 链接文案 |
| `onDetail` | `() => void` | `-` | 点击回调（无 href 时渲染 &lt;button&gt;） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，券面头部槽位 | 面额、券名、标签等券面主视觉 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### EligibilityPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `order` | `CouponOrderContext` | `props.order` | 订单上下文（amount / items / applied / purchasedCount / claimedAt / now） |
| `onEvaluate` | `(result: CouponEligibility) => void` | `-` | 每次判定后回调，入参含 eligible / reasons / thresholdGap |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 券组件挂载完成、插件注册后执行一次 | 初始化副作用，可返回清理函数 |
| `onPropsChange` | 宿主 props 变化后（回传 prev / next 两份） | 按新旧 props 差分决定是否重算内部状态，避免无差别刷新 |
| `onPhaseChange` | 券相位变化后（如 available → used / expired） | 相位切换时的副作用：埋点、提示、动效 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### HistoryPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `records` | `{ at: number; action: string }[]` | `coupon.history` | 记录列表，at 为 epoch ms |
| `max` | `number` | `3` | 最多展示条数 |
| `format` | `(at: number) => string` | `YYYY.MM.DD` | 时间格式化 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，券面头部槽位 | 面额、券名、标签等券面主视觉 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ProgressPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `total` | `number` | `coupon.total` | 发放总量 |
| `claimed` | `number` | `coupon.claimed` | 已领取数 |
| `stock` | `number` | `-` | 剩余库存（宿主侧权威值）；≤ 0 与 claimed ≥ total 取并集判售罄 |
| `urgentPct` | `number` | `20` | 剩余 ≤ N% 标记紧迫 |
| `showRemaining` | `boolean` | `true` | 展示「仅剩 N 张」替代百分比 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，券面头部槽位 | 面额、券名、标签等券面主视觉 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### QuotaPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `quota` | `number` | `coupon.quota` | 每人限领张数 |
| `purchasedCount` | `number` | `order.purchasedCount ?? 0` | 当前用户已领张数 |
| `onExceed` | `(quota: number) => void` | `-` | 超限回调（入参为生效的限领张数） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 券组件挂载完成、插件注册后执行一次 | 初始化副作用，可返回清理函数 |
| `onPropsChange` | 宿主 props 变化后（回传 prev / next 两份） | 按新旧 props 差分决定是否重算内部状态，避免无差别刷新 |
| `renderHeader` | 每次渲染，券面头部槽位 | 面额、券名、标签等券面主视觉 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### RemindPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | `开抢提醒` | 未提醒文案 |
| `remindedText` | `string` | `已设提醒 ✓` | 已提醒文案 |
| `onRemind` | `(on: boolean) => void` | `-` | 提醒开关回调 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染，券面底部槽位 | 有效期、使用门槛、领取 / 使用按钮 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### RuleExpandPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `collapsedCount` | `number` | `1` | 折叠态显示的规则条数 |
| `expandText` | `string` | `展开` | 展开按钮文案 |
| `collapseText` | `string` | `收起` | 收起按钮文案 |
| `showCount` | `boolean` | `true` | 按钮是否带剩余条数（「展开 (3 项)」） |
| `title` | `string` | `使用规则` | 区域标题；传空字符串隐藏 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，券面头部槽位 | 面额、券名、标签等券面主视觉 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `toggleRules` | `ctx.toggleRules(): void` | 展开 / 收起规则面板（写入内部 UI 状态） |

### SharePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | `分享好友` | 按钮文案 |
| `onShare` | `() => void \| Promise<void>` | `-` | 分享回调（必配才渲染） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染，券面底部槽位 | 有效期、使用门槛、领取 / 使用按钮 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### StackPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | `可叠加` | 可叠加角标文案 |
| `notStackableText` | `string` | `不可叠加` | 不可叠加角标文案 |
| `showWhenNotStackable` | `boolean` | `false` | stackable === false 时是否渲染灰标 |
| `always` | `boolean` | `false` | 不看数据字段强制渲染可叠加角标 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，券面头部槽位 | 面额、券名、标签等券面主视觉 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ValidityPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `now` | `() => number` | `Date.now` | 当前时钟，可注入固定值用于测试/演示 |
| `urgentDays` | `number` | `3` | 紧迫阈值：剩余 ≤ N 天显示「仅剩 X 天」强调角标 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `onMount` | 券组件挂载完成、插件注册后执行一次 | 初始化副作用，可返回清理函数 |
| `onUnmount` | 组件卸载前执行一次 | 释放监听、定时器与观察器；与 onMount 成对出现，避免泄漏 |
| `onPropsChange` | 宿主 props 变化后（回传 prev / next 两份） | 按新旧 props 差分决定是否重算内部状态，避免无差别刷新 |
| `onPhaseChange` | 券相位变化后（如 available → used / expired） | 相位切换时的副作用：埋点、提示、动效 |
| `renderHeader` | 每次渲染，券面头部槽位 | 面额、券名、标签等券面主视觉 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
