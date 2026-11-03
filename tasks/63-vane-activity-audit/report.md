# vane-activity 组件分析报告

> 审计对象：`packages/vane-activity`（营销活动容器 + 插件系统）
> 审计范围：核心渲染、HOC 装配层、领域槽/独占逻辑、19 个官方插件、测试与文档
> 方法：静态代码走查 + 安全清单（security-best-practices）+ React 性能清单（vercel-react-best-practices）+ 门禁实跑
> 约束：**只审计，不改源码**

## 一、结论摘要

核心功能整体可用，**未发现 P0 级阻断问题**：

- `ActivityCore` 的 6 个领域槽 + 浮层、插件排序、独占去重、单插件错误隔离均按设计工作；19 个官方插件都能装配。
- 安全基线干净：全包**没有** `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `new Function` / 外链 `<a>` / `window.open` / `localStorage` / `fetch`（全量 grep 0 命中），所有活动文案均走 JSX 转义。
- 门禁全绿：typecheck 通过、lint **0 error / 87 warning**、test **14/14**、build 成功。

但核心装配层存在 **7 个 P1**，主要影响业务正确性与扩展契约：

| 编号 | 问题 | 一句话影响 |
| --- | --- | --- |
| P1-1 | `transformData` 管线未接线 | 自定义插件的数据归一化钩子静默失效 |
| P1-2 | `claim()` 无状态/去重守卫，且读闭包快照 | 可领已锁/未知奖励；连续领取可能丢一次 |
| P1-3 | 抽奖结果与剩余次数由客户端决定 | 刷新即重置次数，`onDraw` 可重放/篡改 |
| P1-4 | `ClaimToast` 多批领取时旧 toast 不再自动消失 | 连领后提示条永久停留 |
| P1-5 | `data.tasks` 缺失导致核心渲染直接崩溃 | 异常接口数据打挂整块活动 |
| P1-6 | `RuleModal` 无 Esc / 焦点陷阱 / 滚动锁 | 键盘用户被遮罩困住，`aria-modal` 名不副实 |
| P1-7 | `extendContext` 依赖 `[props]`，上下文每次渲染重建 | 内核浅比较优化被抵消，全部槽位重渲染 |

另有 **15 项 P2**（详见第五节），集中在不可信数据的边界校验、定时器/动画收尾、长列表渲染与少量 ARIA 细节。

> 结论：**「核心渲染」没有问题，问题集中在「核心装配契约 + 业务权威性」**。若面向生产，建议至少修完 P1-1 ~ P1-5 再上线。

> **修复进展（2026-11-03）**：P1-1 ~ P1-5 已按 [spec.md](spec.md) / [tasks.md](tasks.md) 落地，并补 7 条回归测试。修复后门禁：typecheck 通过、lint 0 error / 87 warning、test **21/21**、build 成功、`node scripts/check-packages.mjs` 全绿。本报告其余章节保留审计时的原始结论；P1-6、P1-7 与 P2 仍未处理。

## 二、架构与数据流

```text
ActivityCore (forwardRef)
  ├─ useActivitySlot × 7 ──► renderActivitySlot(orderedPlugins, context, slot)
  │     ├─ WeakMap 缓存「插件数组 → 各槽插件列表」
  │     ├─ 单插件 try/catch + PluginErrorBoundary
  │     └─ 排序：config.order 升序 → priority 降序
  └─ 布局：header → progress → tasks → rewards → rules → footer → overlay

withPlugins(HOC)
  ├─ resolveExclusivePlugins() ──► 同槽 exclusive 只留 priority 最高者
  ├─ usePluginRuntime(props, { plugins, extendContext })
  │     ├─ stableProps / stableData（浅比较，避免 context 每渲染重建）
  │     └─ context = useMemo(..., [stableProps, stableData, state, bus, extendContext])
  ├─ extendContext ──► tasks / progress / rewards(状态) / claimedIds / claim()
  └─ ActivitySlotProvider ──► orderedPlugins + context 下发 ActivityCore
```

关键文件：

- 核心渲染：[ActivityCore.tsx](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/ActivityCore.tsx)
- 领域装配：[withPlugins.tsx](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/withPlugins.tsx)
- 槽位解析：[slots.tsx](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/plugins/slots.tsx)
- 进度/奖励派生：[domain.ts](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/domain.ts)
- 独占去重：[exclusive.ts](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/exclusive.ts)
- 内核运行时：[usePluginRuntime.ts](file:///E:/react-plugin-component/packages/plugin-core/src/react/usePluginRuntime.ts)

设计上值得肯定的点：

- 槽位排序结果按插件数组引用缓存（[slots.tsx:53-76](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/plugins/slots.tsx#L53-L76)），不会每次渲染重排。
- 单插件渲染 `try/catch` + `PluginErrorBoundary`，一个插件炸不会拖垮整页（[slots.tsx:95-108](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/plugins/slots.tsx#L95-L108)）。
- 独占冲突在装配期一次性解决并 `console.warn`，避免运行期双渲染重影（[withPlugins.tsx:47-57](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/withPlugins.tsx#L47-L57)）。
- 内核明确用浅比较稳定 `props/data`（[usePluginRuntime.ts:153-181](file:///E:/react-plugin-component/packages/plugin-core/src/react/usePluginRuntime.ts#L153-L181)）。
- 文本框、按钮、`aria-live`（领取 toast / 兑换结果 / 抽奖结果）、`aria-expanded`（规则折叠）覆盖较好。
- 公告跑马灯处理了 `prefers-reduced-motion`（[AnnouncementPlugin/create.tsx:22](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/AnnouncementPlugin/create.tsx#L22)）。
- 抽奖/倒计时在卸载时清理定时器（[JackpotPlugin/create.tsx:69-75](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/JackpotPlugin/create.tsx#L69-L75)）。
- 插件全部走子路径，根入口不含插件；体积预算写在 `package.json`，构建产物最大单插件 chunk gzip 3.67 KB。

## 三、P0 问题

**无。**

对照 vane-resume 的 P0 类型逐项排查：

- 公开入口 `withPlugins` 指向的就是领域 HOC（[index.ts](file:///E:/react-plugin-component/packages/vane-activity/src/index.ts)），不存在「文档接入后领域槽全不生效」的错配。
- 不存在 URL/`href` 协议问题：本包根本没有任何链接、`src` 或导航。
- 不存在未转义的富文本：没有 `dangerouslySetInnerHTML` 等 DOM 注入 sink。

因此本次不设 P0；下列 P1 中最接近「上线阻断」的是 P1-1（扩展契约失效）与 P1-3（发奖权威性），按业务风险排序处理。

## 四、P1 问题

### P1-1 `transformData` 管线未接线（扩展契约失效）

**状态：待修复**

**证据**

- HOC 注释明确承诺「原始 data → transformData（如有）→ 透传」：[withPlugins.tsx:7](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/withPlugins.tsx#L7)。
- 实际只调用了 `runtime.transformProps(props)`：[withPlugins.tsx:115](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/withPlugins.tsx#L115)；下发给 Core 的 `data` 是**未经 transformData 的原始 context.data**：[withPlugins.tsx:128](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/withPlugins.tsx#L128)。
- 全包检索 `transformData` 仅命中注释/类型说明（3 处），无任何执行点；文档却把它列为通用钩子：[api.md:90](file:///E:/react-plugin-component/docs/components/vane-activity/api.md#L90)、[types.ts:194](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/plugins/types.ts#L194)。
- 独占去重还特意说明被挤出插件的 `transformData` 链一并失效（[exclusive.ts:10](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/exclusive.ts#L10)），说明该钩子被当作真实能力设计。

**影响**

插件作者按文档写 `transformData`（过滤已下线任务、补默认值、归一化状态）时**不会执行**，且没有任何告警；数据看起来「没生效」，排查成本高。官方 19 个插件恰好都没用该钩子，所以现有 demo/测试发现不了。

**修复建议**

- 在 `useMemo` 中对 `transformedProps.data` 调用 `runtime.transformData`，把结果同时用于 `extendContext` 的派生输入与 `enhancedProps.data`；依赖 `[runtime, transformedProps.data]`。
- 补一条测试：装配一个 `transformData: (d) => ({...d, tasks: d.tasks.slice(1)})` 的测试插件，断言 DOM 少一行任务。

### P1-2 `claim()` 无守卫且读取快照（业务一致性 / 可绕过 UI）

**状态：待修复**

**证据**

- 受控/非受控分支与 `claim` 实现在 [withPlugins.tsx:69-88](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/withPlugins.tsx#L69-L88)。
- `claimedIds` 取自当前闭包快照（受控读 props，非受控读 `base.state`）；`claim` 用 `uniqueIds([...claimedIds, rewardId])` 后整体 `setState`。
- 没有任何「奖励存在 / 处于 claimable / 未领取」校验，也没有 in-flight 去重。
- 官方 UI 靠按钮 `disabled` 兜底（[RewardClaimPlugin/create.tsx](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/RewardClaimPlugin/create.tsx)、[CouponStackPlugin/create.tsx](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/CouponStackPlugin/create.tsx)），但 `context.claim` 对所有插件公开。

**影响**

- 自定义插件（或直接调用 `useActivityContext().claim()`）可以对 `locked`、已领取甚至不存在的 id 触发 `onClaim`；宿主若以 `onClaim` 作为发奖入口，会多领/错领。
- 非受控模式下同一 tick 连续领取 A、B，两次都基于同一快照，后一次覆盖前一次（丢一次领取）。
- 受控模式依赖宿主回写；README 的示例 `onClaim={(id) => api.claim(id)}` 并不回写状态（[README.md:44-53](file:///E:/react-plugin-component/packages/vane-activity/README.md#L44-L53)），demo 同样只打日志，按钮会一直可点，重复 `onClaim`。

**修复建议**

- `claim` 内先用派生 `rewardMap` 校验：不存在 / `locked` / `claimed` 直接忽略并 `warn`（或回调 `onClaimError`）。
- 非受控改函数式更新：`base.setState((prev) => ({ claimedIds: uniqueIds([...(prev.claimedIds ?? []), id]) }))`；同时用 `claimingRef` 防同 tick 重入。
- 受控模式可维护一个「请求中」集合，避免宿主回写前的重复点击；文档/demo 明确「受控必须回写，否则每次点击都会回调」。
- 测试：未知 id、locked、已领取、连续两次调用、受控不回写。

### P1-3 抽奖结果与次数由客户端决定（发奖可作弊）

**状态：待修复**

**证据**

- 中奖格为 `Math.floor(Math.random() * cells.length)`（[JackpotPlugin/create.tsx:85](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/JackpotPlugin/create.tsx#L85)）。
- 剩余次数来自 `useState(times)`（[JackpotPlugin/create.tsx:60](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/JackpotPlugin/create.tsx#L60)），组件内部扣减；刷新页面即恢复。
- 动画后只回调 `onDraw(prize, winner)`（[JackpotPlugin/create.tsx:101](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/JackpotPlugin/create.tsx#L101)）。
- 文档说「次数已由插件扣减，无需回写」（[plugins.md:199](file:///E:/react-plugin-component/docs/components/vane-activity/plugins.md#L199)），但工厂注释又说「传 onDraw 则由业务侧扣次数」（[JackpotPlugin/create.tsx:223](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/JackpotPlugin/create.tsx#L223)）——两处互相矛盾。
- `doc.json` 只提示加权概率可用 `onDraw` 二次判定（[JackpotPlugin/doc.json:66](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/JackpotPlugin/doc.json#L66)），未提示结果可篡改。

**影响**

抽奖是营销活动中最直接的利益点。当前实现里中奖结果、剩余次数全在客户端：改 JS、重放 `onDraw`、刷新重置次数都能绕过。若宿主按 `onDraw` 直接发奖，属于典型的 **frontend-only authorization**（REACT-AUTHZ-001）。

**修复建议**

- 文档明确「本插件只是抽奖 UI，不作为发奖依据」；生产必须服务端出结果。
- 增加受控入口：`drawResult` / `onDraw` 返回 Promise（服务端返回中奖格与剩余次数），期间禁用按钮；失败回滚。
- 剩余次数从 `data`/props 传入，不在组件内自增自减；或回调后由宿主回写。
- 测试：服务端结果与动画停格一致、失败态、次数 0 禁用。

### P1-4 `ClaimToast` 多批领取时旧 toast 不再自动消失

**状态：待修复**

**证据**

- 每批领取在 effect 内建一个 `setTimeout`，cleanup 里 `clearTimeout`（[ClaimToastPlugin/create.tsx:113-116](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/ClaimToastPlugin/create.tsx#L113-L116)）。
- effect 依赖 `[idsKey, durationMs, max]`（[ClaimToastPlugin/create.tsx:119](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/ClaimToastPlugin/create.tsx#L119)）。
- 第二次领取导致 `idsKey` 变化 → React 先执行上一轮 cleanup，**取消第一批的计时器**，再执行新 effect；新计时器只删除第二批自己的 keys（`setItems` 过滤逻辑）。
- `slice(-max)` 只在新增时把最老的挤出（[ClaimToastPlugin/create.tsx:109](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/ClaimToastPlugin/create.tsx#L109)）。

**影响**

连续领取（间隔小于 `durationMs`）时，前一条「已领取：xx」**永远不会自动消失**，直到被后续第 4 条挤出。与 README「自动消失」的承诺不符（[README.md:124](file:///E:/react-plugin-component/packages/vane-activity/README.md#L124)）。

**修复建议**

- 每条 toast 各自持有一个 timer（`Map<key, timerId>`），或给 item 加 `expiresAt` 用一个常驻 interval 清理；effect cleanup 仅在组件卸载时清全部。
- 用假定时器补测试：两批领取 → 第一批到期后应消失、第二批仍在。

### P1-5 `data.tasks` 缺失会让核心渲染崩溃

**状态：待修复**

**证据**

- 核心直接读 `activity.tasks.length`（[ActivityCore.tsx:72](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/ActivityCore.tsx#L72)）。
- `ActivityCore` 外部没有 `PluginErrorBoundary` 包裹（错误边界只包插件槽位，[slots.tsx:95-108](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/plugins/slots.tsx#L95-L108)）。
- 插件内部的畸形条目（如 `LeaderboardPlugin` 的 `entry.name.slice` [create.tsx:86](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/LeaderboardPlugin/create.tsx#L86)）会被槽位 `try/catch` 吞掉，但核心这一次不会。

**影响**

`ActivityData` 是前端类型契约，真实数据来自接口/JSON/低代码配置。缺 `tasks`、`tasks: null` 或 `data: {}` 时直接 `TypeError`，整个活动子树白屏；且不会命中任何插件的错误隔离。

**修复建议**

- 在 HOC/core 边界归一化：`const tasks = Array.isArray(activity?.tasks) ? activity.tasks : []`，其它数组字段同理；空数据走 `emptyText`。
- 可选：在 `withPlugins` 外层再套一层 `PluginErrorBoundary` 作为最后防线。
- 测试：`data={{} as any}`、`tasks: null`、`tasks: []` 三种输入都应渲染空态而非抛错。

### P1-6 `RuleModal` 缺少模态框键盘语义

**状态：待修复**

**证据**

- 弹层有 `role="dialog"` / `aria-modal="true"`（[RuleModalPlugin/create.tsx:62-63](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/RuleModalPlugin/create.tsx#L62-L63)），但文件内没有 `onKeyDown` / `Escape` / 焦点管理 / 背景滚动锁；只有遮罩点击关闭（[create.tsx:65](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/RuleModalPlugin/create.tsx#L65)）。

**影响**

`aria-modal="true"` 告诉辅助技术「背景不可交互」，实际仍可 Tab 到背景按钮；没有 Esc 关闭、关闭后焦点不回到触发按钮。键盘/读屏用户容易「进得去、出不来」。这是营销活动规则页的高频入口，建议按 P1 处理。

**修复建议**

- 打开时把焦点移到弹窗内第一个可聚焦元素（或关闭按钮），关闭后还原到触发按钮。
- `onKeyDown` 处理 `Escape`；`useEffect` 锁定 `body.overflow`。
- 可选：改用原生 `<dialog>`（需处理 polyfill/样式）。

### P1-7 `extendContext` 依赖 `[props]`，context 每渲染必重建

**状态：待修复**

**证据**

- `extendContext` 是 `useCallback(..., [props])`（[withPlugins.tsx:66-91](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/withPlugins.tsx#L66-L91)）。`props` 是 forwardRef 渲染参数，**每次渲染都是新对象**（即使字段值不变）。
- 内核 `context` 的 `useMemo` 依赖包含 `extendContext`（[usePluginRuntime.ts:181](file:///E:/react-plugin-component/packages/plugin-core/src/react/usePluginRuntime.ts#L181)），并在注释里明确要求领域包传稳定函数（[usePluginRuntime.ts:62-64](file:///E:/react-plugin-component/packages/plugin-core/src/react/usePluginRuntime.ts#L62-L64)）。

**影响**

宿主任何无关 state 变化都会重建 `tasks/rewards/rewardMap/claim` 与整个 `context` → `ActivitySlotProvider` value 变化 → 7 个槽位全部重跑 render。内核为 `props/data` 做的浅比较稳定化被这一处抵消；`rewardMap`、`rewards` 等派生也只在这一处计算，属于重复劳动。

**修复建议**

- 用 `propsRef` 保存最新 props，`extendContext` 依赖收敛为 `[props.claimedRewardIds, props.onClaim]`（必要时配合 `useLatest`）。
- 把派生计算拆成独立的 `useMemo`（依赖 `data.tasks`、`data.rewards`、`claimedIds`），`extendContext` 只做组装。
- 回归测试：宿主仅改变无关 prop（如 `className`）时，插件 render 次数不应增加（可用计数器插件断言）。

## 五、P2 问题

| 编号 | 问题 | 证据 | 影响与建议 |
| --- | --- | --- | --- |
| P2-1 | 权重未校验有限性，阈值未收敛 | [domain.ts:19-27](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/domain.ts#L19-L27)、[domain.ts:37](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/domain.ts#L37) | `weight: NaN/Infinity/负数` 会让 `progress` 变 NaN 或 >1；`threshold` 越界则永久锁定/永远可领。建议过滤非有限权重、clamp 阈值到 [0,1] |
| P2-2 | 展示进度未 clamp | [TaskList:60](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/TaskListPlugin/create.tsx#L60)、[TaskTabs:131](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/TaskTabsPlugin/create.tsx#L131)、[Milestone:78](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/MilestoneBarPlugin/create.tsx#L78)、[Coupon:49](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/CouponStackPlugin/create.tsx#L49) | `progress > 1` 时条宽/节点超过 100%，节点跑出轨道；建议统一 `clamp01` |
| P2-3 | 无任务时规则槽被整体隐藏 | [ActivityCore.tsx:122-135](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/ActivityCore.tsx#L122-L135) | `rules` 在 `hasTasks` 分支内；活动空任务但需要展示规则时不可见，与 README 布局描述不一致 |
| P2-4 | 浮层容器 `pointer-events: none` | [ActivityCore.tsx:149](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/ActivityCore.tsx#L149) | 现有 3 个浮层插件都无交互，暂时无害；但未来可交互浮层必须自行覆盖 `pointerEvents`，建议在插件契约/d.ts 注释说明 |
| P2-5 | 数据驱动的数量无上限 | [Checkin:86](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/CheckinCalendarPlugin/create.tsx#L86)、[ShareBoost:87](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/ShareBoostPlugin/create.tsx#L87)、[Confetti:44](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/ConfettiPlugin/create.tsx#L44) | `days/total/count` 来自不可信数据，超大值会生成海量 DOM（低端机卡死 / 内存压力）。建议 clamp（如 days ≤ 31、total ≤ 100、count ≤ 200） |
| P2-6 | 倒计时到 0 后 interval 仍在跑 | [CountdownTimer:44-47](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/CountdownTimerPlugin/create.tsx#L44-L47) | 每秒 `setLeft(0)`（值相同不重渲染）但定时器常驻；建议 `left===0` 时 clear |
| P2-7 | 抽奖结束不清 timers 数组 | [Jackpot:96](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/JackpotPlugin/create.tsx#L96)、[Jackpot:69-75](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/JackpotPlugin/create.tsx#L69-L75) | 每次抽奖残留约 20 个已完成的 timer id，仅在卸载清空；建议每轮结束置空 |
| P2-8 | 彩纸无限动画且未适配减动效 | [Confetti:63](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/ConfettiPlugin/create.tsx#L63)、[Confetti:79](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/ConfettiPlugin/create.tsx#L79) | `infinite` 常驻合成层，低端机耗电；建议一轮即止或支持 `prefers-reduced-motion` |
| P2-9 | 榜单每次渲染全量排序并复制 | [Leaderboard:148](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/LeaderboardPlugin/create.tsx#L148) | 大榜单 O(n log n) 每渲染；建议在渲染函数外 `useMemo`/缓存，且用 `toSorted` 避免改原数组 |
| P2-10 | 榜单/头像缺少畸形条目兜底 | [Leaderboard:86](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/LeaderboardPlugin/create.tsx#L86)、[ShareBoost:87](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/ShareBoostPlugin/create.tsx#L87) | `name` 缺失时 `slice` 抛错，整段 footer 被槽位 try/catch 吞掉（静默消失）；建议 `String(name ?? "?").slice(0,1)` |
| P2-11 | 头部标签重复 key | [ActivityHeaderPlugin](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/ActivityHeaderPlugin/create.tsx) | `tags.map(tag => <span key={tag}>`，重复标签触发 React key 警告；建议 `key={`${tag}-${i}`}` |
| P2-12 | Tabs 缺少完整 tab 语义 | [TaskTabsPlugin](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/TaskTabsPlugin/create.tsx) | 有 `role=tablist/tab`，但无 `aria-controls`、无面板 `role=tabpanel`、无方向键切换；建议补齐或降级为按钮组 |
| P2-13 | `RedeemCode` 无法处理异步校验 | [RedeemCode:59-64](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/RedeemCodePlugin/create.tsx#L59-L64) | 类型只允许同步 `boolean \| void`；JS 用户传 async 函数时 Promise 为真值 → 无效码也提示成功。建议支持 `Promise<boolean>` 并加 pending/禁用 |
| P2-14 | 命令式 ref 与挂载回调闭包过期 | [ActivityCore:49-69](file:///E:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/ActivityCore.tsx#L49-L69) | `useImperativeHandle` 只依赖 `forceUpdate` 却读取可能变化的 `containerRef`；`onMount/onUnmount` effect 空依赖，切换回调后仍用首次闭包 |
| P2-15 | 文档/实现互相矛盾（抽奖次数） | [Jackpot:223](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/JackpotPlugin/create.tsx#L223)、[plugins.md:199](file:///E:/react-plugin-component/docs/components/vane-activity/plugins.md#L199) | 工厂注释说「业务侧扣次数」，组件实现与文档说「插件扣次数」；统一措辞，避免接入方重复扣减 |
| P2-16 | SSR/水合首屏时间不一致 | [Countdown:42](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/CountdownTimerPlugin/create.tsx#L42) | `useState(() => remainingMs(end))` 依赖 `Date.now()`，服务端与客户端渲染文本可能不同；如需 SSR，建议客户端挂载后再显示秒级倒计时 |
| P2-17 | 质量门 warning 偏多 | lint 实跑 | 0 error / 87 warning（`no-explicit-any`、`react-refresh/only-export-components`）；测试有 `act(...)` 警告，建议后续收敛 |

## 六、安全审查清单

对照 `security-best-practices` 的 React 前端规范（REACT-*）：

| 检查项 | 结论 | 证据 |
| --- | --- | --- |
| XSS：`dangerouslySetInnerHTML` / `__html` | ✅ 通过 | 全包 grep 0 命中；所有文案走 JSX 插值 |
| DOM XSS sink：`innerHTML` / `outerHTML` / `document.write` / `DOMParser` | ✅ 通过 | grep 0 命中 |
| 动态执行：`eval` / `new Function` / 字符串定时器 | ✅ 通过 | grep 0 命中 |
| URL 注入：`href` / `src` / `window.open` / `location` | ✅ 不适用 | 组件没有任何链接、图片外链或导航 |
| 敏感存储：`localStorage` / `sessionStorage` / cookie / token | ✅ 通过 | grep 0 命中；兑换码仅在内存 state |
| 网络请求 / 数据外泄 | ✅ 通过 | 组件不发任何请求，交给宿主回调 |
| 第三方脚本 / supply chain | ✅ 通过 | 无第三方运行时脚本；依赖走 workspace + lockfile |
| 客户端权威状态（REACT-AUTHZ-001） | ❌ 风险 | 抽奖结果/次数、签到 `done`、助力 `used`、领取状态都由客户端持有；只能作为 UX，不能作为发奖依据（P1-3、P1-2） |
| 不可信数据边界 | ❌ 风险 | `tasks` 缺失崩溃（P1-5）、`days/total/count` 无上限（P2-5）、`name` 缺失抛错（P2-10） |
| CSP 兼容 | ⚠️ 注意 | 全包使用内联 `style`，公告/彩纸还注入 `<style>`（[Announcement:69](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/AnnouncementPlugin/create.tsx#L69)、[Confetti:79](file:///E:/react-plugin-component/packages/vane-activity/src/custom-plugins/ConfettiPlugin/create.tsx#L79)），宿主 CSP 需 `style-src 'unsafe-inline'`；这不是 XSS，但应在文档说明 |
| 回调异常 | ⚠️ 注意 | `onClaim/onTaskAction/onCheckin/onRedeem/onDraw` 未包 `try/catch`；事件处理器抛错不会被错误边界捕获，会冒泡到全局 |
| 模态框可访问性 | ❌ 缺陷 | `RuleModal` 无 Esc/焦点陷阱（P1-6） |
| 秘密/凭据 | ✅ 通过 | 包内无密钥、token 或环境变量 |

## 七、React 性能清单

对照 `vercel-react-best-practices`：

| 规则 | 结论 | 说明 |
| --- | --- | --- |
| `rerender-dependencies` / 稳定回调 | ❌ P1-7 | `extendContext` 依赖 `[props]`，context 每渲染重建 |
| `rerender-functional-setstate` | ⚠️ P1-2 / P2-14 | `claim` 读快照后整体覆盖；应改函数式更新 |
| `advanced-use-latest` | ⚠️ P2-14 | 回调/ref 用 ref 保存最新值，避免空依赖 effect 用旧闭包 |
| `js-set-map-lookups` | ⚠️ P2 | `claimedIds.includes` 在 `deriveRewards` 中是 O(n×m)，奖励多时建议 `Set` |
| `js-min-max-loop` / 长列表 | ⚠️ P2-9 | 榜单每渲染全量 `sort` + `slice`；建议 memo |
| `rerender-derived-state-no-effect` | ✅ | `progress/rewards` 在渲染期派生，未用 effect 同步 |
| `rendering-hoist-jsx` | ⚠️ | 公告 `KEYFRAMES` 已提升；彩纸 `<style>` 字符串仍在渲染函数内，建议模块级常量 |
| `rendering-content-visibility` | ⚠️ | 长规则正文（`ActivityRule.content`）无上限，长列表/长文可考虑 `content-visibility` |
| `client-event-listeners` / 定时器 | ⚠️ P2-6/7 | 倒计时到 0 不停；抽奖 timers 不清；均在卸载时兜底 |
| 渲染隔离 | ✅ | 单插件 `try/catch` + `PluginErrorBoundary`，互不拖累 |
| 槽位排序缓存 | ✅ | WeakMap 按插件数组缓存，未重复排序 |
| Bundle（`bundle-barrel-imports`） | ✅ | 根入口不含插件；子路径按需；构建最大单插件 gzip 3.67 KB |
| 动画性能 | ⚠️ P2-8 | CSS 动画本身在合成层，但彩纸 `infinite` 常驻；公告有减动效，彩纸没有 |

## 八、测试缺口

现状：3 个测试文件、14 条用例全通过（`exclusive.test.ts` 8 条、`plugins.dom.test.tsx` 5 条、`selftest.dom.test.tsx` 1 条）。

未覆盖、且本次 P1 对应的缺口：

- `transformData` 是否执行（P1-1）——**完全无测试**。
- `claim` 未知/锁定/已领取/同 tick 连点/受控不回写（P1-2）。
- 抽奖服务端结果、次数耗尽、失败回滚（P1-3）。
- `ClaimToast` 多批领取的自动消失（P1-4，建议 `vi.useFakeTimers`）。
- 畸形数据：`data={}`、`tasks: null`、`rewards: null`、重复 id、缺 `name`（P1-5/P2-10）。
- `RuleModal` 键盘（Esc、Tab 循环、焦点还原）（P1-6）。
- 进度/阈值边界：`weight: NaN/-1`、`progress: 1.5/-0.2`、`threshold: 1.2`（P2-1/2）。
- `days/total/count` 上限（P2-5）。
- 倒计时到 0 停止、抽奖 timers 清理（P2-6/7）。
- `onUnmount` / 插件 `onMount` 钩子是否执行。
- 每个插件至少一条渲染冒烟（目前仅 demo/selftest 覆盖部分）。
- 测试卫生：`selftest` 出现 `An update to Root inside a test was not wrapped in act(...)` 警告。

## 九、验证记录

环境：Windows / Node + pnpm workspace / React 18.3.1 / Vitest 2 + happy-dom。命令均在仓库根执行。

| 命令 | 结果 | 关键输出 |
| --- | --- | --- |
| `pnpm --filter vane-activity typecheck` | ✅ 通过（exit 0） | `tsc --noEmit -p tsconfig.json` 无输出 |
| `pnpm --filter vane-activity lint` | ✅ 0 error / 87 warning | `✖ 87 problems (0 errors, 87 warnings)` |
| `pnpm --filter vane-activity test` | ✅ 14/14 | `Test Files 3 passed (3)` / `Tests 14 passed (14)` / `Duration 17.21s` |
| `pnpm --filter vane-activity build` | ✅ 成功（exit 0） | `✓ built in 16.50s`；`Declaration files built in 13836ms` |

构建产物抽样（gzip）：最大插件 chunk 3.67 KB（`create-Bf-6zZ2j.js`，对应抽奖类），共享 `slots` chunk 3.85 KB；与 `package.json` 的 3/3.5/4 KB 子路径预算相符，根入口未纳入本次构建报告。

### 修复后复验（P1-1 ~ P1-5）

| 命令 | 结果 | 关键输出 |
| --- | --- | --- |
| `pnpm --filter vane-activity typecheck` | ✅ 通过（exit 0） | `tsc --noEmit -p tsconfig.json` 无错误 |
| `pnpm --filter vane-activity lint` | ✅ 0 error / 87 warning | `✖ 87 problems (0 errors, 87 warnings)` |
| `pnpm --filter vane-activity test` | ✅ 21/21 | `Test Files 4 passed (4)` / `Tests 21 passed (21)` |
| `pnpm --filter vane-activity build` | ✅ 成功（exit 0） | `✓ built in 2.20s`；`Declaration files built in 1797ms` |
| `node scripts/check-packages.mjs` | ✅ 全绿 | Jackpot 子路径闭包 gzip 4.0KB / 预算 4KB；其余子路径与入口均未超预算 |

新增回归：`test/core-fixes.dom.test.tsx` 7 条，覆盖 `transformData` 实际生效、`claim` 未知/锁定/重复点击/同 tick 多奖励、抽奖采用服务端结果与失败恢复、`ClaimToast` 两批独立消失、畸形 `data` 空态不崩。

## 十、结论

1. **核心渲染与插件总线没有结构性问题**：槽位、排序、独占、错误隔离、空态、浮层都按设计工作，现有 14 条测试与 demo 可复现。
2. **真正需要优先处理的是「契约」而非「渲染」**：`transformData` 没接线（P1-1）、`claim` 无守卫（P1-2）、抽奖客户端权威（P1-3）、`ClaimToast` 计时失效（P1-4）、畸形数据崩溃（P1-5）。
3. 安全面最值得写进接入文档的一条：**所有活动状态（领取/签到/助力/抽奖次数）都只是 UI 状态，服务端必须重新校验与发奖**。
4. P2 以健壮性/性能/无障碍为主，可在 P1 之后按批处理；其中 P2-5（数量上限）与 P2-10（畸形条目）属于低成本高收益。

建议修复顺序：**P1-5 → P1-2 → P1-4 → P1-1 → P1-3 → P1-7 → P1-6**，再按批处理 P2 与补测试。本轮仅产出审计结论，未修改任何源码。
</content>
</invoke>
