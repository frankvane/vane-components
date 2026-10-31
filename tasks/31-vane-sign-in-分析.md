# 31 · vane-sign-in 分析

> 按 vane-package-builder 标准流程（P1→P2→P3）。user 已授权阶段性提交，不逐项询问。
> 用户原始需求：vane-sign-in 组件；连签状态 / 日历条 / 奖励预告 / 补签；各平台运营位通用；至少 15 个插件。
> 命名四件套（必做）：StreakState / CalendarStrip / RewardPreview / MakeupSlot。

## 1. 目标与边界

- 做一个**插件式 React 每日签到**组件：数据驱动渲染「连签状态 / 日历条 / 奖励预告 / 补签」四类核心能力，其余可变行为（积分、等级、分享、提醒、邀请、规则、记录等）全交插件。
- **各平台运营位通用**：不绑定某一业务（电商/内容/游戏/会员），通过插件装配区分场景。核心只做「渲染 + 转发生命周期」，可变 UI 全在插件。
- 冻结线：对外导出符号（Core / `withPlugins` / 类型 / 子路径插件）、`package.json` exports、README 首屏、demo 外壳四件套——改法走 sync，不动手写产物。

## 2. 领域模型（SignInData）

```ts
type DayStatus = 'signed' | 'today' | 'missed' | 'future' | 'reward';
interface RewardInfo { day: number; kind: 'points'|'coupon'|'gift'|'badge'; value?: number; label: string; claimed?: boolean; }
interface DayCell { date: string; day: number; status: DayStatus; reward?: RewardInfo; canMakeup?: boolean; }
interface MakeupInfo { available: number; used: number; max: number; }
interface LevelInfo { name: string; current: number; next: number; progress: number; }
interface ClaimRecord { id: string; day: number; label: string; at: number; }
interface SignInData {
  todaySigned: boolean;
  streak: number; maxStreak: number; totalDays: number; points: number;
  calendar: DayCell[]; rewards: RewardInfo[];
  makeup: MakeupInfo;
  nextResetAt?: number;
  level?: LevelInfo;
  rules?: string[];
  history?: ClaimRecord[];
}
```

**领域语义**（对应 SKILL「缺货/禁用」类边界，签到域等价物）：
- `todaySigned` 驱动 TodayCheckIn 的禁用态（已签→按钮置灰「今日已签」）。
- `canMakeup` 驱动 MakeupSlot 的可补签入口；`makeup.available<=0` 时按钮置灰「补签次数已用完」（禁用豁免 ≥3）。
- `reward.claimed` 驱动 RewardClaim 的「已领取」终态，不覆盖未领取。
- `status:'future'` 的日期格不可点（非交互态）。

## 3. 入口划分（ADR-6：根不桶导出插件）

- `.` = `index.ts`：聚合 `SignInCore` + `withSignInPlugins` + 契约类型。
- `./entries/core` = `entries/core.ts`：只要内核（Core + withPlugins），无插件。
- `./entries/plugins` = `entries/plugins.ts`：插件全家桶（便于一次性引入）。
- `./custom-plugins/<Name>Plugin`：每个插件独立子路径（构建与 sync-exports 共用 discover-entries）。

## 4. 插件清单与插槽（17 个，≥15）

| # | 插件 | 槽位 | 职责 |
|---|------|------|------|
| 1 | StreakStatePlugin | header | 连签 N 天 / 最高 M 天（用户必做） |
| 2 | TodayCheckInPlugin | actions | 主 CTA：今日签到；已签置灰 |
| 3 | PointsBalancePlugin | header | 累计积分 |
| 4 | StatRowPlugin | header | 累计天数 / 累计积分 数据行 |
| 5 | LevelBadgePlugin | header | 会员等级徽标 + 进度 |
| 6 | CalendarStripPlugin | calendar | 横向日历条（用户必做） |
| 7 | CalendarGridPlugin | calendar | 月历网格（strip 的另一种形态） |
| 8 | RewardPreviewPlugin | rewards | 逐日奖励预告（用户必做） |
| 9 | RewardClaimPlugin | rewards | 当日奖励领取按钮 |
| 10 | MilestonePlugin | rewards | 距下一里程碑进度 |
| 11 | MakeupSlotPlugin | actions | 补签入口（用户必做），canMakeup 驱动 |
| 12 | CountdownPlugin | header | 距下次可签到倒计时 |
| 13 | SharePlugin | actions | 分享签到成就 |
| 14 | RemindPlugin | actions | 提醒开关 |
| 15 | RuleExpandPlugin | footer | 规则折叠展开 |
| 16 | RewardHistoryPlugin | footer | 领取记录 |
| 17 | InvitePlugin | actions | 邀请好友助力 |

插槽：`renderHeader` / `renderCalendar` / `renderRewards` / `renderActions` / `renderFooter` / `renderOverlay`（弹层：补签确认等）。
单槽多插件按 `config.order` 升序 → `priority` 降序；单插件抛错由 `PluginErrorBoundary` 隔离。priority 分区间：header 10–19 / calendar 20–29 / rewards 30–39 / actions 40–49 / footer 50–59。

## 5. 依赖派系

**peer 外部化派**（模板默认）：`vane-plugin-core` 放 `peerDependencies`（`workspace:*`），发布前临时改 `*`；根入口不含 core，体积小（参考 vane-profile ~3KB）。react/react-dom 仅 peer。

## 6. 体积预算

- 根入口 `sizeBudgetKb: 10`（core + withSignInPlugins + 共享类型 + 日期工具；peer 外部化保持精简）。
- 子路径各 `2KB`（含同目录 doc.json 元数据）。
- 超了要么真减（根不桶导出、插件走子路径），要么改口径 + `sizeBudgetNote`，不许静默调大。

## 7. demo 场景（demo.config.tsx + 17 单页）

- 电商签到台（full：连签+日历+奖励+补签+积分）
- 内容/社区签到（积分+分享+提醒）
- 游戏签到（等级+里程碑+邀请）
- 会员签到（等级+里程碑）
- 自定义工坊（17 插件开关）
- 每插件一页（NN-slug.tsx），源码 ?raw 同源展示。

## 8. 验收门禁

- P1：tsc 0 / eslint 0 / check-packages 绿（先 build 再 check）/ check-structure --strict 0。
- P2：build:demo 成功 / selftest PASS n/n / 对比度 0 处不达标。
- P3：docs 四件 + changeset + 双远端 HEAD 一致 + 用户确认发 npm + registry 可查。

## 9. 风险与约定

- 事件钩子改闭包状态必须 `context.forceUpdate()`；context 动态字段用 getter。
- 装配工厂 `withSignInPlugins(plugins)` 模块顶层调用；用例内按需重建。
- demo 去 StrictMode；自测用 dispatchEvent + tick。
- 样式全内联（tokens 收敛 `plugins/tokens.ts`）；有 background 必有 color；不用 opacity 压字。
