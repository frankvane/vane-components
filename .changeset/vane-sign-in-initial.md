---
"vane-sign-in": minor
---

初始发布：插件式 React 每日签到组件（17 插件）。

- `SignInCore`：五段式壳（header / calendar / rewards / actions / footer），只做渲染 + 生命周期转发；领域槽复用内核排序（order 升序 → priority 降序）与错误边界
- 头部区 5 插件：连签状态 / 积分余额 / 数据行 / 等级徽章 / 次签倒计时
- 日历区 3 插件：横向日历条 / 月历网格 / 补签入口
- 奖励区 3 插件：逐日奖励预告 / 奖励领取 / 里程碑进度
- 操作区 4 插件：今日签到 / 分享成就 / 签到提醒 / 邀请好友
- 底部区 2 插件：活动规则折叠 / 领取记录
- 装配：`withSignInPlugins(SignInCore, [...])`；插件子路径 `vane-sign-in/custom-plugins/<Name>Plugin`
- 领域 HOC children 只兜 renderOverlay（不走内核 composeSlots，杜绝领域钩子双渲染重影，回归测试 test/slot-dup.test.tsx）
- 配色遵循 ADR-13（强调色 #cf4407，正文 ≥4.5 / 禁用 ≥3 / UI ≥3）
- demo：18 单页 + 插件工坊 + 5 场景示例 + 浏览器内自测（SELFTEST OK 16/16）
