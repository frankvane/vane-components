# 每日签到 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [CalendarGridPlugin](./CalendarGridPlugin) | 月历网格：以 7 列网格形态呈现整轮签到进度，日历区渲染。 | `columns` = 7 | 0.1.0 | calendar, grid, calendar-slot |
| [CalendarStripPlugin](./CalendarStripPlugin) | 日历条：横向滚动的逐日格，展示已签/今日/漏签/未来/奖励五态，带奖励格金点提示。 | `showRewardDot` = true | 0.1.0 | calendar, strip, status |
| [CountdownPlugin](./CountdownPlugin) | 次签倒计时：依据 nextResetAt 展示距下次可签到剩余时间，头部区渲染。 | - | 0.1.0 | countdown, header, timer |
| [InvitePlugin](./InvitePlugin) | 邀请好友助力：触发邀请回调的按钮，操作区渲染，常用于拉新运营位。 | `text` = 邀请好友助力 | 0.1.0 | invite, actions, growth |
| [LevelBadgePlugin](./LevelBadgePlugin) | 会员等级徽标：展示等级名与进度条，头部区渲染；无等级数据时静默跳过。 | - | 0.1.0 | level, header, badge |
| [MakeupSlotPlugin](./MakeupSlotPlugin) | 补签位：找到可补签的漏签格并提供补签入口，补签次数用尽后置灰禁用。 | `buttonText` = undefined | 0.1.0 | makeup, actions, recovery |
| [MilestonePlugin](./MilestonePlugin) | 里程碑进度：展示距下一未达奖励还差几天与进度条，奖励区渲染。 | - | 0.1.0 | milestone, rewards, progress |
| [PointsBalancePlugin](./PointsBalancePlugin) | 累计积分：展示当前累计积分总额，头部区渲染。 | - | 0.1.0 | points, header, balance |
| [RemindPlugin](./RemindPlugin) | 签到提醒开关：本地维护开关态并回调下发，操作区渲染。 | `defaultOn` = false | 0.1.0 | remind, actions, toggle |
| [RewardClaimPlugin](./RewardClaimPlugin) | 当日奖励领取：提供已达天数待领奖励的领取按钮，奖励区渲染。 | - | 0.1.0 | reward, claim, rewards-slot |
| [RewardHistoryPlugin](./RewardHistoryPlugin) | 领取记录：展示历史领取记录列表，底部区渲染；无记录时显示终态文案。 | `limit` = 5 | 0.1.0 | history, footer, record |
| [RewardPreviewPlugin](./RewardPreviewPlugin) | 奖励预告：从当前连签天数起，逐日展示后续可领奖励（积分 / 券 / 礼包 / 徽章）。 | `limit` = 5 | 0.1.0 | reward, preview, rewards |
| [RuleExpandPlugin](./RuleExpandPlugin) | 规则折叠展开：将活动规则折叠为可展开列表，底部区渲染；无规则时静默跳过。 | `defaultOpen` = false | 0.1.0 | rule, footer, collapse |
| [SharePlugin](./SharePlugin) | 分享成就：触发分享回调的无状态按钮，操作区渲染。 | `text` = 分享成就 | 0.1.0 | share, actions, social |
| [StatRowPlugin](./StatRowPlugin) | 数据行：一行展示累计天数与累计积分，头部区渲染。 | - | 0.1.0 | stat, header, summary |
| [StreakStatePlugin](./StreakStatePlugin) | 连签状态：展示当前连签天数与历史最高连签，头部区渲染。 | `showMax` = true | 0.1.0 | streak, header, status |
| [TodayCheckInPlugin](./TodayCheckInPlugin) | 今日签到：主 CTA，已签置灰、未签高亮，点击经回调下发签到动作。 | `signedText` = 今日已签 ✓<br/>`unsignedText` = 立即签到 | 0.1.0 | checkin, actions, cta |
<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
