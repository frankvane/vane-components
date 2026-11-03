# 每日签到 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [CalendarGridPlugin](#calendargridplugin) | 月历网格：以 7 列网格形态呈现整轮签到进度，日历区渲染。 | `columns` = 7 | 0.1.0 | calendar, grid, calendar-slot |
| [CalendarStripPlugin](#calendarstripplugin) | 日历条：横向滚动的逐日格，展示已签/今日/漏签/未来/奖励五态，带奖励格金点提示。 | `showRewardDot` = true | 0.1.0 | calendar, strip, status |
| [CountdownPlugin](#countdownplugin) | 次签倒计时：依据 nextResetAt 展示距下次可签到剩余时间，头部区渲染。 | - | 0.1.0 | countdown, header, timer |
| [InvitePlugin](#inviteplugin) | 邀请好友助力：触发邀请回调的按钮，操作区渲染，常用于拉新运营位。 | `text` = 邀请好友助力 | 0.1.0 | invite, actions, growth |
| [LevelBadgePlugin](#levelbadgeplugin) | 会员等级徽标：展示等级名与进度条，头部区渲染；无等级数据时静默跳过。 | - | 0.1.0 | level, header, badge |
| [MakeupSlotPlugin](#makeupslotplugin) | 补签位：找到可补签的漏签格并提供补签入口，补签次数用尽后置灰禁用。 | `buttonText` = undefined<br/>`exhaustedText` = 补签次数已用完<br/>`noTargetText` = 暂无可补签<br/>`errorText` = 补签失败，请重试 | 0.1.0 | makeup, actions, recovery |
| [MilestonePlugin](#milestoneplugin) | 里程碑进度：展示距下一未达奖励还差几天与进度条，奖励区渲染。 | - | 0.1.0 | milestone, rewards, progress |
| [PointsBalancePlugin](#pointsbalanceplugin) | 累计积分：展示当前累计积分总额，头部区渲染。 | - | 0.1.0 | points, header, balance |
| [RemindPlugin](#remindplugin) | 签到提醒开关：本地维护开关态并回调下发，操作区渲染。 | `defaultOn` = false | 0.1.0 | remind, actions, toggle |
| [RewardClaimPlugin](#rewardclaimplugin) | 当日奖励领取：提供已达天数待领奖励的领取按钮，奖励区渲染。 | `pendingText` = 领取中…<br/>`errorText` = 领取失败，请重试 | 0.1.0 | reward, claim, rewards-slot |
| [RewardHistoryPlugin](#rewardhistoryplugin) | 领取记录：展示历史领取记录列表，底部区渲染；无记录时显示终态文案。 | `limit` = 5 | 0.1.0 | history, footer, record |
| [RewardPreviewPlugin](#rewardpreviewplugin) | 奖励预告：从当前连签天数起，逐日展示后续可领奖励（积分 / 券 / 礼包 / 徽章）。 | `limit` = 5 | 0.1.0 | reward, preview, rewards |
| [RuleExpandPlugin](#ruleexpandplugin) | 规则折叠展开：将活动规则折叠为可展开列表，底部区渲染；无规则时静默跳过。 | `defaultOpen` = false | 0.1.0 | rule, footer, collapse |
| [SharePlugin](#shareplugin) | 分享成就：触发分享回调的无状态按钮，操作区渲染。 | `text` = 分享成就 | 0.1.0 | share, actions, social |
| [StatRowPlugin](#statrowplugin) | 数据行：一行展示累计天数与累计积分，头部区渲染。 | - | 0.1.0 | stat, header, summary |
| [StreakStatePlugin](#streakstateplugin) | 连签状态：展示当前连签天数与历史最高连签，头部区渲染。 | `showMax` = true | 0.1.0 | streak, header, status |
| [TodayCheckInPlugin](#todaycheckinplugin) | 今日签到：主 CTA，已签置灰、未签高亮，点击经回调下发签到动作。 | `signedText` = 今日已签 ✓<br/>`unsignedText` = 立即签到<br/>`pendingText` = 签到中…<br/>`errorText` = 签到失败，请重试 | 0.1.0 | checkin, actions, cta |

## 插件能力明细

### CalendarGridPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `columns` | `number` | `7` | 网格每周列数 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCalendar` | 每次渲染，日历区槽位 | 日历条 / 月历网格 / 漏签标记 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CalendarStripPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showRewardDot` | `boolean` | `true` | 是否在带奖励的格右上角显示金点 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCalendar` | 每次渲染，日历区槽位 | 日历条 / 月历网格 / 漏签标记 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CountdownPlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，头部区槽位 | 连签天数、积分、等级、倒计时 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### InvitePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | `邀请好友助力` | 按钮文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderActions` | 每次渲染，操作区槽位 | 签到 CTA、补签、分享、提醒、邀请 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### LevelBadgePlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，头部区槽位 | 连签天数、积分、等级、倒计时 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### MakeupSlotPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `buttonText` | `string` | `undefined` | 自定义按钮文案（仅有可补目标且还有配额时生效） |
| `exhaustedText` | `string` | `补签次数已用完` | 补签配额耗尽时的文案 |
| `noTargetText` | `string` | `暂无可补签` | 配额还在但没有可补目标（漏签格都在窗口外）时的文案 |
| `errorText` | `string` | `补签失败，请重试` | 回调失败时的兜底文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderActions` | 每次渲染，操作区槽位 | 签到 CTA、补签、分享、提醒、邀请 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### MilestonePlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderRewards` | 每次渲染，奖励区槽位 | 逐日奖励预告、领取态、里程碑奖励 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PointsBalancePlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，头部区槽位 | 连签天数、积分、等级、倒计时 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### RemindPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `defaultOn` | `boolean` | `false` | 初始是否开启提醒 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderActions` | 每次渲染，操作区槽位 | 签到 CTA、补签、分享、提醒、邀请 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### RewardClaimPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pendingText` | `string` | `领取中…` | 请求在途时的按钮文案；期间按钮禁用，防重复领取 |
| `errorText` | `string` | `领取失败，请重试` | 回调失败时的兜底文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderRewards` | 每次渲染，奖励区槽位 | 逐日奖励预告、领取态、里程碑奖励 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### RewardHistoryPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `limit` | `number` | `5` | 最多展示几条记录 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染，底部区槽位 | 规则展开、领取记录入口 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### RewardPreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `limit` | `number` | `5` | 最多展示的奖励预告条数 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderRewards` | 每次渲染，奖励区槽位 | 逐日奖励预告、领取态、里程碑奖励 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### RuleExpandPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `defaultOpen` | `boolean` | `false` | 初始是否展开 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染，底部区槽位 | 规则展开、领取记录入口 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### SharePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | `分享成就` | 按钮文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderActions` | 每次渲染，操作区槽位 | 签到 CTA、补签、分享、提醒、邀请 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### StatRowPlugin

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，头部区槽位 | 连签天数、积分、等级、倒计时 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### StreakStatePlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showMax` | `boolean` | `true` | 是否展示历史最高连签天数 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderHeader` | 每次渲染，头部区槽位 | 连签天数、积分、等级、倒计时 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### TodayCheckInPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `signedText` | `string` | `今日已签 ✓` | 已签到时的按钮文案 |
| `unsignedText` | `string` | `立即签到` | 未签到时的按钮文案 |
| `pendingText` | `string` | `签到中…` | 请求在途（尚未返回）时的按钮文案；期间按钮禁用，防重复签到 |
| `errorText` | `string` | `签到失败，请重试` | 回调失败时的兜底文案（错误对象自带 message 时优先显示 message） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderActions` | 每次渲染，操作区槽位 | 签到 CTA、补签、分享、提醒、邀请 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
