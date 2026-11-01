# vane-sign-in 修复实施验收清单

- 对应评审报告：`tasks/42-vane-sign-in-核心功能评审.html`（P0-1 / P1-1~P1-4 / P2-1~P2-9，修复顺序 T01~T09）
- 实施范围：**只改 `packages/vane-sign-in/`**；未修改 `packages/plugin-core`、其它包、根配置与 `tasks/42` 报告；未执行任何 git 命令。
- 结论：**14 / 14 项全部修复**（1 项 P0 + 4 项 P1 + 9 项 P2）；无「阻塞：需 plugin-core 支持」的跳过项。
- 公开 API：无破坏性默认值变更；新增字段 / 参数 / 配置项均为可选、向后兼容（兼容性说明见第 4 节）。

## 1. 概述

### 1.1 改动文件列表（全部位于 `packages/vane-sign-in/`）

新增（源码）：

| 文件 | 用途 |
| --- | --- |
| `src/utils/date.ts` | DayKey（`yyyy-mm-dd` 业务日键）工具：`toDayKey / formatDayKey / todayKey / addDays / diffDays / compareDayKeys / isDayKey` |
| `src/utils/callback.ts` | `invokeCallback`（同步 / Promise 失败统一归一）+ `resolveErrorMessage` |
| `src/utils/normalize.ts` | `normalizeSignInData`：字段缺失 / 类型漂移统一兜底 |
| `src/components/SignInPlugin/plugins/clock.tsx` | Core 内 1s 时钟 Provider + `useSignInNow()` + `visibilitychange / focus` 校正 |

修改（源码）：

| 文件 | 关联项 |
| --- | --- |
| `src/components/SignInPlugin/plugins/types.ts` | P1-1 / P1-2 |
| `src/components/SignInPlugin/plugins/slots.tsx` | P2-1 / P2-2 |
| `src/components/SignInPlugin/withPlugins.tsx` | P2-2 / P2-3 / P2-4 / P2-8 |
| `src/components/SignInPlugin/SignInCore.tsx` | P1-3 |
| `src/custom-plugins/TodayCheckInPlugin/create.tsx` | P0-1 / P1-1 / P1-3 |
| `src/custom-plugins/RewardClaimPlugin/create.tsx` | P0-1 |
| `src/custom-plugins/MakeupSlotPlugin/create.tsx` | P1-1 / P1-4 / P2-6 |
| `src/custom-plugins/RemindPlugin/create.tsx` | P1-1 / P2-5 |
| `src/custom-plugins/CountdownPlugin/create.tsx` | P1-3 / P2-9 |
| `src/custom-plugins/RewardHistoryPlugin/create.tsx` | P1-2 |
| `src/custom-plugins/RewardPreviewPlugin/create.tsx` | P2-9 |
| `src/custom-plugins/RuleExpandPlugin/create.tsx` | P2-5 / P2-9 |
| `src/custom-plugins/CalendarStripPlugin/create.tsx` | P2-7 / P2-9 |
| `src/custom-plugins/CalendarGridPlugin/create.tsx` | P2-9 |
| `src/custom-plugins/SharePlugin/create.tsx`、`InvitePlugin/create.tsx` | P1-1 |
| `src/custom-plugins/tokens.ts` | P2-7 / P2-9（新增 `DAY_STATUS_TEXT`） |
| `src/index.ts`、`src/entries/core.ts` | 公开导出日期工具 / 归一函数 / 新增类型 |
| `src/custom-plugins/TodayCheckInPlugin/doc.json`、`MakeupSlotPlugin/doc.json`、`RewardClaimPlugin/doc.json` | 新增配置项文档同步 |

新增 / 修改测试（`test/`）：`helpers.tsx`、`date.test.ts`、`checkin-pending.test.tsx`、`makeup.test.tsx`、`cross-day.test.tsx`、`slots-perf.test.tsx`、`normalize-display.test.tsx`（原有 `signin.test.ts` / `slot-dup.test.tsx` / `selftest.dom.test.tsx` 未改，全部继续通过）。

### 1.2 修复策略摘要

1. **在途锁**：点击即置 `pending`（`ref` 同帧去重 + `state` 禁用按钮），失败回滚并渲染 `role="alert"` 可见错误；成功不做乐观写入，以消费方回写的 `data` 为准。
2. **时区口径**：所有“日”的判定与展示统一走 DayKey；展示层不再使用 `toLocaleDateString`；天数运算走 UTC 日序数，免疫 DST；`businessTimeZone / todayKey / nextResetAt` 的可选契约写入 `types.ts`。
3. **跨天闭环**：Core 内 1s 时钟只驱动 `useSignInNow()` 消费者；`nextResetAt` 跨过或 `todayKey` 变化后 CTA 自动解除禁用；回到前台校正时钟并调用 `callbacks.refresh`。
4. **补签**：显式选「不晚于业务日的 `canMakeup` 格中日期最早者」，未来日期排除；「配额耗尽」与「无可补目标」分别提示；补签同样具备在途锁与失败回滚。
5. **性能 / 契约**：槽位分组与产物 memo 化、`key` 改为插件名、删除渲染期 `ref` 写入、`transformData` 真正执行、配置项 `defaultOn / defaultOpen` 接上、数据统一归一。

## 2. 逐项验收表

| 编号 | 级别 | 问题 | 修复方案 | 改动位置（file:line） | 回归测试用例名 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| SI-P0-1 | P0 | 签到 / 领奖按钮没有在途锁，请求飞行期间可无限次点击（`disabled={todaySigned}`、onClick 不 await 不置 pending） | 点击即 `pendingRef=true` + `setPending(true)`，按钮 `disabled` / `aria-busy` / 文案切「签到中…」「领取中…」；失败回滚并展示可见错误；成功保持原状等宿主回写 | `TodayCheckInPlugin/create.tsx:58-90,100-131`；`RewardClaimPlugin/create.tsx:33-50,61-95`；`utils/callback.ts:17-31` | 「请求未返回时置 pending + 禁用，连点三次只发一次 sign」「领取请求在途时禁用按钮，连点只发一次 claim」「回调失败时回滚 pending 并展示可见错误，按钮可重试」「领取失败展示错误并回滚」 | 已修复 |
| SI-P1-1 | P1 | 回调无错误通道（Promise reject 无人接管）；Remind 乐观态永不回退 | `invokeCallback` 把同步 / 异步结果归一为 Promise；sign/claim/makeup/remind/share/invite 全走该入口；新增 `SignInError` 与 `data.lastError`，各插件支持 `errorText` 兜底；Remind 失败 `setOn(previous)` + 可见错误 | `utils/callback.ts:17-41`；`types.ts:74-78,114-131`；`RemindPlugin/create.tsx:31-51,82-91`；`SharePlugin/create.tsx:38`；`InvitePlugin/create.tsx:37` | 「remind reject 后开关回原态并展示错误」「宿主回写 data.lastError 时 CTA 直接展示可见反馈」「默认错误文案在回调返回非 Error 值时仍可见」「补签失败时回滚 pending 并展示可见错误」 | 已修复 |
| SI-P1-2 | P1 | 日期 / 时区契约为空：`DayCell.date` 无口径，`toLocaleDateString()` 与 UTC 日切线可能差一天，天数差直接 Date 相减受 DST 影响 | 新增 DayKey 工具并导出；`toDayKey` 用 `Intl.DateTimeFormat` + `formatToParts`（缓存 formatter），本地时区显式拼串；`addDays/diffDays/compareDayKeys` 走 UTC 日序数；`DayCell.date / todayKey / nextResetAt` 注释口径写入类型；History 展示改 `formatDayKey(at, businessTimeZone)` | `utils/date.ts:74-153`；`types.ts:35-48,90-108`；`RewardHistoryPlugin/create.tsx:9,56`；`index.ts:28-39`；`entries/core.ts:24-35` | `date.test.ts` 12 例：同刻三时区、东八区 UTC 跨日同业务日、本地 23:59/00:00、字符串 DayKey/epoch、非法值抛 RangeError、跨月、闰年、DST 日差、`addDays` 跨年/闰日、`compareDayKeys`；「businessTimeZone=UTC 显示 2026-10-31」「businessTimeZone=Asia/Shanghai 显示 2026-11-01」 | 已修复 |
| SI-P1-3 | P1 | 跨天边界不闭环：倒计时不 tick，跨夜按钮不复位，无前台恢复刷新 | Core 内新增 `SignInClockProvider`（1s `setInterval`）；`CountdownText` / `CheckInButton` / `MakeupSlot` 改用 `useSignInNow()`；CTA 以 `nextResetAt` 或 `todayKey` 判定过期；`visibilitychange / focus` 校正 now 并触发 `callbacks.refresh` | `plugins/clock.tsx:29-69`；`SignInCore.tsx:38-51,75-176`；`TodayCheckInPlugin/create.tsx:49-73`；`CountdownPlugin/create.tsx:22-37`；`types.ts:118-131` | 「跨过 nextResetAt 后，已签按钮自动解除禁用」「缺 nextResetAt 时用业务日键 todayKey 兜底判定跨日」「每秒刷新文案，过期后显示「现在可签到」」「focus / visibilitychange 各触发一次 callbacks.refresh」 | 已修复 |
| SI-P1-4 | P1 | 补签用 `calendar.find(canMakeup)`：依赖数组顺序，且完全不校验补签窗口（可能补未来日期） | 新增 `pickMakeupTarget`：过滤 `canMakeup && isDayKey(date) && date <= businessToday`，按日期升序取最早；`makeup(date, { day })` 携带天数便于服务端对账 | `MakeupSlotPlugin/create.tsx:38-67`；`types.ts:118-127` | 「乱序且含未来日期时，选「不晚于业务日、日期最早」的格」「只有未来日期时视为无可补签目标（不会被提前补掉）」 | 已修复 |
| SI-P2-1 | P2 | 领域槽 `key={index}`：插件排序变化时带内部状态的插件被重挂载、丢状态 | 槽位产物 key 改为 `signin-slot-${plugin.name}` | `plugins/slots.tsx:110` | 「key 与插件名绑定，重排后依然一一对应」（直接断言槽产物元素 key，旧实现为 `0/1`） | 已修复 |
| SI-P2-2 | P2 | Provider 的 `useMemo` 无效（value 每次新对象）；每次渲染做 5 次 filter + sort；context 身份不稳定导致父级空 setState 重跑全部插件钩子 | 插件按槽预分组 / 排序一次并 memo；Provider value memo 化；`extendContext` 依赖收敛到 `[props.data, callbacks]`；`slotContext` memo 化；槽产物按 `[分组, context, slot]` memo；空槽返回常量 | `plugins/slots.tsx:44-66,84-93,135-144`；`withPlugins.tsx:36,52,58-68,94-106` | 「父级无关 setState 不重跑 renderHeader」 | 已修复 |
| SI-P2-3 | P2 | 渲染期写 `ctxRef.current`（副作用发生在 render） | 删除 `ctxRef` 及渲染期赋值；渲染路径统一用 memo 化 `slotContext` | `withPlugins.tsx:94-106` | 无独立回归测试（结构性修复：无公开 API 可观测该写入；由 typecheck / 槽位既有测试覆盖） | 已修复 |
| SI-P2-4 | P2 | `transformData` 钩子只声明、运行时从不执行，插件契约是空的 | HOC 内先跑 `runtime.transformData(props.data)`，再 `normalizeSignInData`，渲染与插件读同一份结果 | `withPlugins.tsx:86-92,125-128` | 「插件 transformData 返回值参与渲染」（旧实现显示 7，修复后显示 42） | 已修复 |
| SI-P2-5 | P2 | `defaultOn / defaultOpen` 声明了却从未使用 | Remind 初值 `ctx.data.remindEnabled ?? defaultOn`；RuleExpand 用 `useState(defaultOpen)` | `RemindPlugin/create.tsx:31-32,114`；`RuleExpandPlugin/create.tsx:23,81` | 「defaultOn 作为初始值；data.remindEnabled 优先」「defaultOpen 生效，按钮 aria-expanded / aria-controls 正确」「defaultOpen=false 时初始折叠，点击展开」 | 已修复 |
| SI-P2-6 | P2 | 补签文案两态混用：无目标但仍有配额时仍显示「次数已用完」 | 文案三态：`exhaustedText`（配额耗尽）/ `noTargetText`（无可补目标）/ `buttonText ?? 补签 · 剩N次` | `MakeupSlotPlugin/create.tsx:57-67,151-156` | 「配额耗尽 → 专属文案」「配额还在但无可补目标 → 另一条文案」 | 已修复 |
| SI-P2-7 | P2 | 日历色板两份且已漂移 | CalendarStrip 删除本地 `COLORS/GLYPH`，与 Grid 共用 `DAY_COLORS / DAY_GLYPH / GOLD` | `CalendarStripPlugin/create.tsx:9-14,49,75,86`；`CalendarGridPlugin/create.tsx:8,42` | 「Strip 与 Grid 同一状态取同一份 tokens 配色（P2-7 不漂移）」 | 已修复 |
| SI-P2-8 | P2 | 缺字段防御不一致：补签整段静默消失、连签显示 `undefined` | 新增 `normalizeSignInData`：数字/文本/布尔/数组/日期键逐项兜底，集合字段恒存在；HOC 内执行一次 | `utils/normalize.ts:140-181`；`withPlugins.tsx:86-92` | 「空/缺字段入参生成完整安全数据」「非法时区 / 非法日期键被丢弃，合法值保留」「日历格 / 奖励 / 规则逐项兜底」「缺失字段的真实渲染不出现 undefined / NaN」 | 已修复 |
| SI-P2-9 | P2 | 展示与 a11y：奖励预告未排序、倒计时不换天单位、日历格无 aria、规则按钮无 aria-expanded | 预告先按 day 升序再截断；倒计时 `days>0` 用「n天m小时」、过期显示「现在可签到」；日历格 `role="img"` + 状态 `aria-label/title`；规则按钮 `aria-expanded/aria-controls` + `useId` | `RewardPreviewPlugin/create.tsx:34-36,50`；`CountdownPlugin/create.tsx:22-37`；`CalendarStripPlugin/create.tsx:51-57`；`CalendarGridPlugin/create.tsx:42-49`；`RuleExpandPlugin/create.tsx:23-31,46-58`；`tokens.ts:38-43` | 「乱序 rewards 仍先展示最近的天数」「跨多天时按「n天m小时」展示」「CalendarStrip 每格有 role=img 与状态 aria-label」「CalendarGrid 复用同一份状态文案」「defaultOpen 生效，按钮 aria-expanded / aria-controls 正确」「每秒刷新文案，过期后显示「现在可签到」」 | 已修复 |

## 3. 验证记录（真实执行）

| # | 命令 | 实际结果 |
| --- | --- | --- |
| 1 | `pnpm --filter vane-sign-in test` | **通过**：9 个测试文件 / **53 个用例全部通过**（`Test Files 9 passed (9)`、`Tests 53 passed (53)`，约 15.5s）。原 6 用例保留通过，新增 47 例。 |
| 2 | `pnpm --filter vane-sign-in typecheck` | **通过**：`tsc --noEmit -p tsconfig.json`，退出码 0，无输出。 |
| 3 | `pnpm --filter vane-sign-in lint` | **通过**：退出码 0，`0 errors, 86 warnings`。warning 为仓库既有规则噪声（`no-explicit-any`、demo 的 `react-refresh/only-export-components`、既有 `useImperativeHandle` 依赖提示），无新增 error。 |
| 4 | `pnpm --filter vane-sign-in build` | **通过**：85 modules transformed，declaration files 生成成功，`built in 3.94s`，退出码 0。 |

补充：

- 测试环境为 `happy-dom`；`selftest.dom.test.tsx`（真实挂载 + 真实点击）继续通过，签到主流程 / 补签入口 / 奖励领取断言未被本次改动破坏。
- lint / test 中的 `act(...)` 告警来自原有 demo 自测（非本次新增测试），不影响结果。

## 4. 遗留问题与风险 / 未覆盖范围

### 4.1 兼容性与行为变化（均为非破坏性，但需知晓）

1. **归一化会丢弃未知字段**：`normalizeSignInData` 只保留 `SignInData` 声明的字段。若消费方在 `data` 上挂自定义字段并期望插件通过 `ctx.data` 读取，会读不到；需要扩展时应在 `SignInData` 增加声明字段。
2. **补签目标选择不再“取数组第一个”**：改为最早、且不晚于业务日的格子；依赖旧顺序行为的接入方会看到不同默认目标（属于预期修复）。
3. **`callbacks.makeup` 新增第二个可选参数 `{ day }`**：只传 `date` 的旧实现仍兼容。
4. **新增可选数据字段**：`businessTimeZone / todayKey / lastError / remindEnabled`；不传时行为与旧版一致（跨夜判定退化到 `nextResetAt` 缺失时不再自动复位，这是能力边界而非回归）。
5. **`slotContext.props` 是 memo 快照**：插件读取容器 props 的实时值应改用 `ctx.refs`（已在代码注释中标注）。
6. **RewardClaimPlugin 配置类型**：由 `Record<string, never>` 放宽为 `{ pendingText?, errorText? }`，仅扩宽、不收紧。

### 4.2 未覆盖 / 需外部协作

1. **服务端幂等**：客户端只做了在途锁与 UI 防重；真正的防重放仍必须由服务端按 `(userId, businessDay)` 唯一约束保证（仓库内无服务端代码，无法验证）。
2. **跨夜判定的权威性**：CTA 跨过 `nextResetAt / todayKey` 后会解锁，但真实“今天是否已签”仍以宿主回写的 `data.todaySigned` 为准；服务端时间与客户端时钟偏差需宿主用 `refresh` 兜底。
3. **真实浏览器几何 / SSR hydration**：本次测试均在 happy-dom；未做真实浏览器布局与 SSR 水合验证（DayKey 工具已消除 `toLocaleDateString` 的 SSR 差一天风险）。
4. **`nextResetAt` 缺失且 `todayKey` 缺失**：无法自动跨夜复位（契约上要求宿主至少提供其一）。
5. **P2-3 无独立回归测试**：该问题为渲染期副作用，公开 API 不可观测；通过删除 `ctxRef` 与既有槽位 / 归一化测试覆盖。
6. **未修改范围**：`packages/plugin-core`（无需改动即可完成全部修复）、其它包、根配置、`tasks/42` 报告。无「阻塞：需 plugin-core 支持」项。
