---
"vane-coupon": minor
---

初始发布：插件式券展示与领取组件。

- `CouponCore`：票券本体（面额区 / 门槛 / 标题 + before/after/footer/overlay 四插槽）
- `ClaimStatePlugin`：7 态领取状态机（未开始/可领取/领取中/已领取/已使用/已抢空/已过期），联动有效期与库存自动降级终态
- `ValidityPlugin`：有效期绝对/相对双模式判定，紧迫态强调
- `RuleExpandPlugin`：使用规则按条数折叠展开
- `StackPlugin`：可叠加/不可叠加角标
- `ProgressPlugin`：抢购进度条（urgentPct 紧迫态 + 已抢完文案）
- `QuotaPlugin`：每人限领提示（超限写 state.quotaReached 并触发 onExceed）
- `CountdownPlugin`：开抢倒计时（startAt 驱动，autoStart 到点自动进入可领取）
- `ChannelPlugin`：渠道小标（coupon.channels 数据驱动 / config.channels 配置驱动）
- `SharePlugin`：分享按钮（footer 槽次按钮，onShare 回调带券数据）
- `RemindPlugin`：开抢提醒开关（仅 idle 相位渲染，aria-pressed）
- `CopyCodePlugin`：券码展示与复制（clipboard API + execCommand 兜底，1.6s 自动还原）
- `HistoryPlugin`：领取记录倒序切片（max 可配，默认 3 条）
- `AnalyticsPlugin`：行为埋点（coupon:mount/claim/error 双通道上报，无 UI）
- `DetailLinkPlugin`：详情入口（href 渲染链接 / onDetail 渲染按钮）
- demo：17 页逐项示例 + 浏览器内自测（41 断言）+ 源码语法高亮
