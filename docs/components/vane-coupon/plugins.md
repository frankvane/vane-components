# 优惠券 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [AnalyticsPlugin](./AnalyticsPlugin) | 券埋点：coupon:mount / coupon:claim / coupon:error 三类事件，回调与总线 coupon:analytics 双通道，自身不渲染 UI。 | `onEvent` = - | 0.1.0 | coupon, analytics, event |
| [ChannelPlugin](./ChannelPlugin) | 渠道限定角标：按 coupon.channels / config.channels 渲染一组渠道小标（仅 APP / 仅新客…）。 | `channels` = coupon.channels | 0.1.0 | coupon, channel, badge, before |
| [ClaimStatePlugin](./ClaimStatePlugin) | 领取状态机：7 态相位流转（未开始/可领取/领取中/已领取/已使用/已抢空/已过期），点击触发异步领取，联动有效期与库存自动降级终态。 | `initialPhase` = -<br/>`claim` = -<br/>`stock` = -<br/>`onPhaseChange` = -<br/>`onClaimError` = -<br/>`texts` = - | 0.1.0 | coupon, claim, state-machine, footer |
| [CopyCodePlugin](./CopyCodePlugin) | 券码复制：claimed/used 相位展示券码与复制按钮（clipboard API + execCommand 兜底），结果写 state.codeCopied。 | `code` = coupon.code<br/>`label` = "券码"<br/>`onCopied` = - | 0.1.0 | coupon, code, clipboard, after |
| [CountdownPlugin](./CountdownPlugin) | 开抢倒计时：startAt 未到时渲染「距开抢 HH:MM:SS」，到点可自动开抢（autoStart）并触发 onFire。 | `startAt` = -<br/>`autoStart` = false<br/>`tickMs` = 1000<br/>`onCountdown` = -<br/>`onFire` = - | 0.1.0 | coupon, countdown, timer, before |
| [DetailLinkPlugin](./DetailLinkPlugin) | 完整规则链接：href 渲染 &lt;a&gt;、onDetail 渲染 &lt;button&gt;，落在规则区下方。 | `href` = -<br/>`text` = "查看完整规则"<br/>`onDetail` = - | 0.1.0 | coupon, link, after |
| [HistoryPlugin](./HistoryPlugin) | 领取记录：按 coupon.history / config.records 倒序渲染最近 N 条领取/使用记录。 | `records` = coupon.history<br/>`max` = 3<br/>`format` = YYYY.MM.DD | 0.1.0 | coupon, history, after |
| [ProgressPlugin](./ProgressPlugin) | 领取进度条：按 total/claimed 渲染已抢百分比进度条，剩余 ≤ N% 换紧迫色，接口轮询数据刷新即更新。 | `total` = coupon.total<br/>`claimed` = coupon.claimed<br/>`urgentPct` = 20<br/>`showRemaining` = true | 0.1.0 | coupon, progress, stock, after |
| [QuotaPlugin](./QuotaPlugin) | 每人限领：读 coupon.quota 与已领数渲染限领提示，超限写 state.quotaReached 供宿主门控领取按钮。 | `quota` = coupon.quota<br/>`purchasedCount` = 0<br/>`onExceed` = - | 0.1.0 | coupon, quota, limit, after |
| [RemindPlugin](./RemindPlugin) | 开抢提醒：idle 相位渲染提醒开关，开关态写内核 state.reminded，可被宿主复位。 | `text` = "开抢提醒"<br/>`remindedText` = "已设提醒 ✓"<br/>`onRemind` = - | 0.1.0 | coupon, remind, footer |
| [RuleExpandPlugin](./RuleExpandPlugin) | 规则展开/收起：使用规则按条数折叠（默认 1 条），展开态写内核 state，可被宿主复位；不用 line-clamp 避免纵向裁切。 | `collapsedCount` = 1<br/>`expandText` = "展开"<br/>`collapseText` = "收起"<br/>`showCount` = true<br/>`title` = "使用规则" | 0.1.0 | coupon, rules, expand, after |
| [SharePlugin](./SharePlugin) | 分享按钮：footer 槽渲染次按钮，分享能力由 onShare 回调提供；未配置 onShare 不渲染。 | `text` = "分享好友"<br/>`onShare` = - | 0.1.0 | coupon, share, footer |
| [StackPlugin](./StackPlugin) | 叠加态角标：按 coupon.stackable 渲染「可叠加」强调角标或「不可叠加」灰标，可强制展示；渲染在票面顶部角标区。 | `text` = "可叠加"<br/>`notStackableText` = "不可叠加"<br/>`showWhenNotStackable` = false<br/>`always` = false | 0.1.0 | coupon, stack, badge, before |
| [ValidityPlugin](./ValidityPlugin) | 有效期判定：绝对（validFrom/validTo）与相对（领取后 N 天）双模式，紧迫态（剩余 ≤ N 天）强调展示，过期结果写内核 state 供领取状态机联动。 | `now` = Date.now<br/>`urgentDays` = 3 | 0.1.0 | coupon, validity, date, after |
<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
