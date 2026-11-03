# vane-activity 审计整改任务清单

> 来源：[report.md](file:///E:/react-plugin-component/tasks/63-vane-activity-audit/report.md) · 规格：[spec.md](file:///E:/react-plugin-component/tasks/63-vane-activity-audit/spec.md)
> 状态：**P1 与 P2 全部完成**（P1-1 ~ P1-7、P2-1 ~ P2-17 已落地；新增 13 条回归用例，5 个测试文件 / 34 条用例全绿；lint 0 warning、act 告警 0）

## P1

- [x] **T1 修复畸形数据崩溃（P1-5）** ✅
  - 文件：`src/components/ActivityPlugin/ActivityCore.tsx`、`src/components/ActivityPlugin/withPlugins.tsx`
  - 实现：`ActivityCore` 用 `Array.isArray(activity?.tasks)` 兜底；HOC 新增 `normalizeActivityData`，把 `tasks/rewards/rules` 收敛为安全值再派生。
  - 验收：`data={{} as any}` / `tasks: null` 不抛错，走空态。

- [x] **T2 修复 `claim` 守卫与快照（P1-2）** ✅
  - 文件：`src/components/ActivityPlugin/withPlugins.tsx`、`types.ts`、`README.md`、`docs/components/vane-activity/api.md`、`plugins.md`
  - 实现：按派生 `rewards` 校验（未知 / locked / claimed 忽略并告警）；`claimedIdsRef` 同 tick 串行累积；`inFlightRef` 防重入，宿主回写后解除；同步受控回写契约文档。
  - 验收：locked/未知/已领取不回调；同 tick 连续领取不丢 id；受控未回写不重复回调。

- [x] **T3 修复 `ClaimToast` 多批计时（P1-4）** ✅
  - 文件：`src/custom-plugins/ClaimToastPlugin/create.tsx`
  - 实现：每条 toast 独立 `timer`，仅卸载统一清理；被 `max` 挤出的条目同步清计时。
  - 验收：两批领取后第一批按时消失。

- [x] **T4 接线 `transformData`（P1-1）** ✅
  - 文件：`src/components/ActivityPlugin/withPlugins.tsx`
  - 实现：`useMemo` 调用 `runtime.transformData`，结果先归一化，再用于派生与 `enhancedProps.data`。
  - 验收：带 `transformData` 的测试插件能过滤任务。

- [x] **T5 抽奖权威性（P1-3）** ✅
  - 文件：`src/custom-plugins/JackpotPlugin/create.tsx`、`doc.json`、`docs/components/vane-activity/plugins.md`
  - 实现：可选 `drawResult`（同步/异步）与受控 `remainingTimes`；失败文案并恢复按钮；`onDraw` 仅通知；静态样式提模块级以压回体积预算。
  - 验收：受控结果与停格一致；未传时行为不变。

- [x] **T6 `RuleModal` 键盘语义（P1-6）** ✅
  - 文件：`src/custom-plugins/RuleModalPlugin/create.tsx`、`test/audit-p2.dom.test.tsx`
  - 内容：Esc 关闭、初始焦点落在关闭按钮、Tab 焦点环、背景滚动锁、关闭后焦点还原（触发按钮已卸载则退回先前焦点）。
  - 验收：Esc 关闭后弹窗消失、`body.overflow` 复原、焦点回到触发按钮。

- [x] **T7 稳定 context（P1-7）** ✅
  - 文件：`src/components/ActivityPlugin/withPlugins.tsx`
  - 内容：`propsRef` + 依赖收敛 + 派生 `useMemo` + `claim` `useCallback`。
  - 验收：无关 prop 变化不增加插件 render 次数。

## P2

- [x] **T8 数据边界与数量上限（P2-1/2/5/10）** ✅
  - 文件：`domain.ts`、`CheckinCalendarPlugin`、`ShareBoostPlugin`、`ConfettiPlugin`、`TaskListPlugin`、`TaskTabsPlugin`、`MilestoneBarPlugin`、`CouponStackPlugin`、`LeaderboardPlugin`、`JackpotPlugin`
  - 内容：权重有限性校验、阈值/进度 clamp、数量上限、文本兜底；`Leaderboard` 脏条目归一化。
  - 验收：`test/audit-p2.dom.test.tsx` 覆盖 NaN 权重、越界阈值、脏榜单与非数组榜单。

- [x] **T9 定时器与动画收尾（P2-6/7/8）** ✅
  - 文件：`CountdownTimerPlugin`、`JackpotPlugin`、`ConfettiPlugin`
  - 内容：倒计时到 0 停表；抽奖每轮清 timers；彩纸单轮 + `prefers-reduced-motion` 关闭。
  - 验收：过期倒计时显示「已结束」；减动效下不渲染彩纸。

- [x] **T10 渲染与无障碍细节（P2-3/4/9/11/12/13/14/16）** ✅
  - 文件：`ActivityCore.tsx`、`LeaderboardPlugin`、`ActivityHeaderPlugin`、`TaskTabsPlugin`、`RedeemCodePlugin`、`CountdownTimerPlugin`
  - 内容：规则槽独立于 `hasTasks`；浮层交互注释；榜单 memo；key 去重；tab 语义 + 方向键；兑换码异步支持与 pending；ref/回调收敛；SSR 首屏。
  - 验收：空任务活动仍渲染规则；tabs 方向键/End 选中并聚焦；兑换码等待期禁用、resolve/抛错文案正确。

- [x] **T11 测试与文档** ✅
  - 文件：`test/audit-p2.dom.test.tsx`、`test/core-fixes.dom.test.tsx`、`test/plugins.dom.test.tsx`、`test/selftest.dom.test.tsx`、`demo/src/lib/selftest.tsx`、`README.md`、`docs/components/vane-activity/*`
  - 内容：为 P1-6 与 P2 补 13 条回归；测试与 demo 自测统一走 `act`，`act(...)` 告警清零；Redeem/Jackpot 文档同步。
  - 验收：5 个测试文件 / 34 条用例全绿；lint 0 warning。

- [x] **T12 体积预算** ✅
  - 文件：`package.json`
  - 内容：审计修复带来的合法增量使 ShareBoost/Leaderboard/TaskTabs/Jackpot 与全量并集贴近原预算，按实测 +0.2~0.3KB / 38→40KB 调整并写明原因；其余 15 个插件基线不变。

## 门禁

```bash
pnpm --filter vane-activity typecheck
pnpm --filter vane-activity lint
pnpm --filter vane-activity test
pnpm --filter vane-activity build
```
