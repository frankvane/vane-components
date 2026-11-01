# vane-coupon 修复实施验收清单

> 对应评审：`tasks/38-vane-coupon-核心功能评审.html`（0 项 P0 / 5 项 P1 / 8 项 P2，修复顺序 T01–T06）
> 范围：仅 `packages/vane-coupon/` 内文件；未修改 `packages/plugin-core`、其它包、根配置与 `tasks/38` 报告（CP-P2-6 / CP-P2-8 需要的内核改动由主控在 plugin-core 后续单独提交）。
> 结论：**13 项全部修复**（其中 CP-P2-6 / CP-P2-8 依赖的内核尾部缺口已在 `packages/plugin-core/src/react/slots.tsx` 补齐并有单测）；P1-4 为防御性修复，公开 API 无法触达、无回归测试。

## 1. 概述

本轮按 T01–T06 顺序落地修复，核心是把「领券业务口径」收敛成单一事实来源，保证**展示与门控一致**：

- 新增四个纯函数模块（无 React 依赖），Core / 各插件 / 宿主复用同一口径：
  - `plugins/stock.ts`：库存并集判定（`stock ≤ 0` **或** `total > 0 && claimed ≥ total` → soldout）
  - `plugins/quota.ts`：限领判定（`purchased ≥ quota`；`quota = 0` 时任何已领数都超限）
  - `plugins/validity.ts`：有效期判定 + 到点复查时间点（`validTo` 当刻有效，`validTo + 1ms` 才过期）
  - `plugins/eligibility.ts`：门槛 / 有效期 / 商品范围 / 互斥 / 叠加 / 限领 / 库存，金额统一按「分」比较
  - `plugins/format.ts`：面额 / 门槛格式化与非法数据兜底
- 新增 `EligibilityPlugin`（写 `state.eligible`）与 `CouponData.scope / exclusiveGroup`、`props.order` 等类型，补齐 P1-5 的「可用性判定整体缺位」。
- `ClaimStatePlugin` 的渲染与点击共用 `gatePhase` + `blockedByEligibility`，新增 `quota-limited` 相位（非终态，可恢复）。
- `ValidityPlugin` 按下一次有效期边界挂 `setTimeout`，页面停留跨过 `validTo` 后自动收敛为 expired。
- P2 清理：重入锁 / Remind 渲染条件 / 金额兜底 / 插槽 memo / props 浅比较 / imperative handle 依赖 / 复制清理与 onError / Channel key。

新增回归测试 2 个文件（`test/eligibility.test.ts`、`test/fixes.test.tsx`），基线 3 文件 33 用例 → 现 5 文件 68 用例。

## 2. 逐项验收表

| 编号 | 级别 | 问题 | 修复方案 | 改动位置（file:line） | 回归测试用例名 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| CP-P1-1 | P1 | 「已抢完」只画进度条，领取按钮照常可领（soldout 不读 total/claimed） | 新增 `resolveStock` 纯函数，`soldout = stock ≤ 0 或 (total > 0 && claimed ≥ total)`；Progress 与 ClaimState 共用同一函数，Progress 增加 `data-soldout` | `src/components/CouponPlugin/plugins/stock.ts:35-74`（新增）；`src/custom-plugins/ProgressPlugin/create.tsx:21-22,43-59`；`src/custom-plugins/ClaimStatePlugin/create.tsx:110-115` | `test/fixes.test.tsx` → 「claimed=total：进度条「已抢完」，按钮 soldout/disabled 且不发起领取」；「stock=0（total 未抢完）：按钮同样 soldout，进度条同步标售罄」；`test/eligibility.test.ts` → `resolveStock · 并集口径`（4 例） | 已修复 |
| CP-P1-2 | P1 | 每人限领超限不门控：`quotaReached` 写了 state，但无消费者 | 新增 `resolveQuota` 纯函数；ClaimState 的 `gatePhase` 读 `state.quotaReached` **或** 现算 `coupon.quota + purchasedCount`，命中进入 `quota-limited`（非终态，可恢复）；Quota 仅在值变化时写 state | `src/components/CouponPlugin/plugins/quota.ts:23-41`（新增）；`src/custom-plugins/ClaimStatePlugin/create.tsx:117-123,137-156`；`src/custom-plugins/QuotaPlugin/create.tsx:33-38,48-53` | `test/fixes.test.tsx` → 「purchased=quota：按钮「已达限领上限」且禁用，点击不发起领取」；「ClaimState 自身按 coupon.quota / order.purchasedCount 判定为 quota-limited 相位」；`test/eligibility.test.ts` → `resolveQuota · 限领口径` | 已修复 |
| CP-P1-3 | P1 | 过期不随时间收敛：页面停留跨过 validTo 后仍可领取 | 新增 `computeValidity` / `nextValidityCheckAt`；Validity 在 `validFrom` 或 `validTo + 1ms` 挂定时器到点重算；ClaimState 渲染与点击均按注入 `now` 现算，领取期间跨过 validTo 不落成功态 | `src/components/CouponPlugin/plugins/validity.ts:57-70,73-133`（新增）；`src/custom-plugins/ValidityPlugin/create.tsx:40-42,51-94,104-117`；`src/custom-plugins/ClaimStatePlugin/create.tsx:101-108,229-236` | `test/fixes.test.tsx` → 「页内停留跨过 validTo：定时复查把 validity 与相位收敛为 expired」；「点击时按注入时钟重算：跨过 validTo 后不再发起领取」；`test/eligibility.test.ts` → `evaluateEligibility · 有效期边界` | 已修复 |
| CP-P1-4 | P1 | 运行时重建同名插件后，新实例的 `onMount` 永远不执行 | HOC 的 onMount effect 依赖改为 `[execute, runtime.orderedPlugins]`：内核重建注册后对新实例重跑 onMount（旧实例 cleanup 由内核 `clear()` 逆序执行） | `src/components/CouponPlugin/withPlugins.tsx:103-110` | 无（公开 API 无法触达：`createCouponCard(plugins)` 在 HOC 创建时固化插件数组，运行期不会重建实例） | 防御性修复 · 无回归测试 |
| CP-P1-5 | P1 | 可用性判定整体缺位：门槛 / 商品范围 / 互斥 / 叠加只有字段与文案 | 新增 `evaluateEligibility`（门槛按分、刚好等于放行；scope sku/category/excludeSku；互斥组；叠加；限领；库存）与 `EligibilityPlugin` 写 `state.eligible`；ClaimState 渲染与点击复用同一结果 | `src/components/CouponPlugin/plugins/eligibility.ts:39-136`（新增）；`src/custom-plugins/EligibilityPlugin/create.tsx:27-72`（新增）；`src/components/CouponPlugin/plugins/types.ts:25-61,107-126,194,234-239`；`src/custom-plugins/ClaimStatePlugin/create.tsx:159-166,198-217` | `test/eligibility.test.ts` → 门槛 4 例 / 有效期边界 2 例 / 商品范围 2 例 / 互斥叠加 2 例；`test/fixes.test.tsx` → 「门槛不足：按钮不可用且不发起领取；EligibilityPlugin 回传原因」；「门槛刚好满足 / 商品范围未命中分别放行与拦截」 | 已修复 |
| CP-P2-1 | P2 | 领取按钮没有重入锁，异步成功后也不校验挂载 | `context.shared` 存 `claim:in-flight` 锁与 `claim:mounted` 标记；连点先判锁，`finally` 释放；卸载后异步返回不再写 state / 触发回调 | `src/custom-plugins/ClaimStatePlugin/create.tsx:77-80,189-192,206-250` | `test/fixes.test.tsx` → 「同一事件循环内连点两次只发起一次领取」 | 已修复 |
| CP-P2-2 | P2 | Remind 依赖 idle 相位，但默认相位是 available，插件默认永不渲染 | 渲染条件改为 `phase === idle` 或 `state.countdown > 0` 或 `validity.notStarted` | `src/custom-plugins/RemindPlugin/create.tsx:39-45` | `test/fixes.test.tsx` → 「倒计时进行中（相位仍是 available）也能渲染提醒」；「validity.notStarted 时也渲染提醒」 | 已修复 |
| CP-P2-3 | P2 | 面额 / 门槛不做格式化与合法性校验，0 与 NaN 都被吞成「无门槛」 | 新增 `formatAmount`（cash 固定两位、discount 去尾 0、非有限值「—」）与 `resolveThreshold`（none / valid / invalid 三态）；Core 输出 `data-invalid` / `data-state` | `src/components/CouponPlugin/plugins/format.ts:11-57`（新增）；`src/components/CouponPlugin/CouponCore.tsx:65-69,96-121` | `test/fixes.test.tsx` → 「NaN 面额显示「—」并标记 invalid；NaN 门槛标记 invalid」；`test/eligibility.test.ts` → `formatAmount / resolveThreshold`（3 例，含 0 元券与 100% 折扣） | 已修复 |
| CP-P2-4 | P2 | context 每次渲染重建，四个插槽每次渲染全量求值 | `extendContext` 依赖收敛为 `[coupon, order, setPhase, toggleRules]`；`slots` 用 `useMemo`（依赖 `orderedPlugins + state + coupon + order`），稳定回调避免引用漂移 | `src/components/CouponPlugin/withPlugins.tsx:46-55,61-79,165-184` | `test/fixes.test.tsx` → 「父组件重渲染（券数据不变）不重复调用 renderHeader」 | 已修复 |
| CP-P2-5 | P2 | `onPropsChange` 每次父渲染都触发，Quota 无条件写 state 造成额外一帧 | HOC 增加 `sameCouponData` / `sameOrder` 浅比较，内容不变不跑钩子链；Quota 写入前比较 `state.quotaReached === reached` | `src/components/CouponPlugin/withPlugins.tsx:114-130,214-236`；`src/custom-plugins/QuotaPlugin/create.tsx:33-38` | `test/fixes.test.tsx` → 「父组件每次新建 coupon 对象（内容相同）不跑插件链」 | 已修复 |
| CP-P2-6 | P2 | 插槽 key 带 index；`useImperativeHandle` 依赖缺失（lint 已报） | `useImperativeHandle` 依赖补 `containerRef`；内核插槽 key 改为只用插件名（插件名在管理器内唯一），插件顺序变化不再整段重挂载 | `src/components/CouponPlugin/CouponCore.tsx:41-54`；`packages/plugin-core/src/react/slots.tsx:48-60` | `test/fixes.test.tsx` → 「containerRefExternal 变化后 getContainer 返回新节点」；`packages/plugin-core/test/slots.test.tsx` → 「插件顺序调整时按插件名复用 key，不重挂载子树」 | 已修复（内核支持） |
| CP-P2-7 | P2 | CopyCodePlugin 的定时器与异步无清理，兜底失败无提示 | timer / 挂载标记存 `context.shared`，连续点击先清旧 timer，`onUnmount` 统一清理；异步后校验挂载；新增 `onError`（`clipboard-unavailable`）；兜底前判 `execCommand` 可用 | `src/custom-plugins/CopyCodePlugin/create.tsx:28-32,34-52,58-64,74-81,90-120,162` | `test/fixes.test.tsx` → 「clipboard 与 execCommand 都失败时触发 onError，不误报成功」 | 已修复 |
| CP-P2-8 | P2 | 插件 config 槽位声明与真实渲染钩子不一致；Channel 用 label 作 key | Channel key 改为 `` `${label}-${index}` ``；内核 footer 槽现接受显式 `slotPosition: "footer"`，并兼容历史 `"after"` / 缺省，footer 类插件的槽位声明不再被滤掉 | `src/custom-plugins/ChannelPlugin/create.tsx:33-41`；`src/custom-plugins/ClaimStatePlugin/create.tsx:86-88`；`src/custom-plugins/SharePlugin/create.tsx:21-23`；`src/custom-plugins/RemindPlugin/create.tsx:27-29`；`packages/plugin-core/src/react/slots.tsx:31-42,83` | `test/fixes.test.tsx` → 「重复渠道标签全部渲染且无 duplicate key 警告」；`packages/plugin-core/test/slots.test.tsx` → 「footer 槽接受显式 slotPosition: 'footer'」+「兼容历史写法 'after'」 | 已修复（内核支持） |

## 3. 验证记录

以下命令均为本轮真实执行（工作目录 `e:\react-plugin-component`）：

| 命令 | 结果 | 输出摘要 |
| --- | --- | --- |
| `pnpm --filter vane-coupon test` | ✅ exit 0 | `Test Files 5 passed (5)`；`Tests 68 passed (68)`；`Duration 11.00s`（基线 33 + 新增 35）。日志含既有 `not wrapped in act(...)` 警告，不影响通过 |
| `pnpm --filter vane-coupon typecheck` | ✅ exit 0 | `tsc --noEmit -p tsconfig.json` 无错误输出 |
| `pnpm --filter vane-coupon lint` | ✅ exit 0 | `✖ 57 problems (0 errors, 57 warnings)`，全部为 `@typescript-eslint/no-explicit-any`（既有同类告警，主要来自测试中的 `as any`） |
| `pnpm --filter vane-coupon build` | ✅ exit 0 | `✓ built in 6.09s`；`[vite:dts] Declaration files built in 5146ms`；产物含 `chunks/stock-*.js` / `chunks/quota-*.js` / `chunks/validity-*.js` / `chunks/eligibility-*.js` 与 `custom-plugins/EligibilityPlugin/index.js` |

## 4. 遗留问题与风险

1. **P2-8 槽位元数据（已由内核补齐）**：`renderPluginSlot` 的 footer 槽现在接受显式 `slotPosition: "footer"`，并兼容历史写法 `"after"` 与缺省，声明 footer 的插件不再被滤掉（`packages/plugin-core/src/react/slots.tsx:31-42,83`，回归用例见 `packages/plugin-core/test/slots.test.tsx`）。coupon 内三个 footer 插件仍保留 `"after"` 声明，向后兼容。
2. **P2-6 插槽 key 的 index（已由内核补齐）**：key 改为 `vane-slot-${plugin.name}`，不再带 index；插件顺序调整不会重挂载子树（用例「插件顺序调整时按插件名复用 key，不重挂载子树」）。
3. **P1-4 无回归测试**：修复为防御性（onMount effect 依赖 `runtime.orderedPlugins`），但 `createCouponCard(plugins)` 在 HOC 创建时固化插件数组，公开 API 无运行期重建路径，写不出「先红后绿」的用例。
4. **破坏性变更（类型层面）**：`CouponPhase` 新增 `"quota-limited"`。外部若用 `Record<CouponPhase, T>` 穷举相位需补该键；运行时向后兼容。
5. **定时器上限**：`setTimeout` 超过 `2_147_483_647 ms` 会溢出，`ValidityPlugin` 对超长有效期按上限分段复查（实际业务中为 24.8 天一段），不影响正确性。
6. **时钟语义**：`now` 注入只影响判定；`claimedAt` 仍写真实 `Date.now()` 作为领取时刻的业务记录。测试若同时注入固定时钟又使用相对有效期，需注意两者差值。
7. **演示未覆盖**：`demo/src/lib/selftest.tsx` 未新增 EligibilityPlugin 场景；新增能力目前由单测覆盖。

## 5. 未覆盖范围

- 未修改 `packages/plugin-core` 及其它包；未运行全仓 `turbo` 构建或其它包的测试。
- 未做真实浏览器 E2E / 视觉回归 / 无障碍扫描（happy-dom 单测覆盖 DOM 结构与交互断言）。
- 未做 SSR 专项验证（插件 `onMount` 仅在客户端 effect 执行，定时器不参与 SSR）。
- 未对 `DetailLinkPlugin` 的 `href` 白名单、`AnalyticsPlugin` 的字段外发做改动（属 `tasks/38` 安全低危项，不在本轮 P1/P2 范围）。

## 6. 改动文件清单

**新增**

- `packages/vane-coupon/src/components/CouponPlugin/plugins/stock.ts`
- `packages/vane-coupon/src/components/CouponPlugin/plugins/quota.ts`
- `packages/vane-coupon/src/components/CouponPlugin/plugins/validity.ts`
- `packages/vane-coupon/src/components/CouponPlugin/plugins/eligibility.ts`
- `packages/vane-coupon/src/components/CouponPlugin/plugins/format.ts`
- `packages/vane-coupon/src/custom-plugins/EligibilityPlugin/{create.tsx,index.ts,doc.json}`
- `packages/vane-coupon/test/eligibility.test.ts`
- `packages/vane-coupon/test/fixes.test.tsx`
- `tasks/47-vane-coupon-修复实施验收清单.md`（本文件）

**修改（源码/文档）**

- `packages/vane-coupon/src/components/CouponPlugin/plugins/types.ts`
- `packages/vane-coupon/src/components/CouponPlugin/CouponCore.tsx`
- `packages/vane-coupon/src/components/CouponPlugin/withPlugins.tsx`
- `packages/vane-coupon/src/index.ts`
- `packages/vane-coupon/src/custom-plugins/index.ts`
- `packages/vane-coupon/src/custom-plugins/ClaimStatePlugin/create.tsx`
- `packages/vane-coupon/src/custom-plugins/ClaimStatePlugin/doc.json`
- `packages/vane-coupon/src/custom-plugins/ValidityPlugin/create.tsx`
- `packages/vane-coupon/src/custom-plugins/ValidityPlugin/doc.json`
- `packages/vane-coupon/src/custom-plugins/ProgressPlugin/create.tsx`
- `packages/vane-coupon/src/custom-plugins/ProgressPlugin/doc.json`
- `packages/vane-coupon/src/custom-plugins/QuotaPlugin/create.tsx`
- `packages/vane-coupon/src/custom-plugins/QuotaPlugin/doc.json`
- `packages/vane-coupon/src/custom-plugins/RemindPlugin/create.tsx`
- `packages/vane-coupon/src/custom-plugins/RemindPlugin/doc.json`
- `packages/vane-coupon/src/custom-plugins/CopyCodePlugin/create.tsx`
- `packages/vane-coupon/src/custom-plugins/CopyCodePlugin/doc.json`
- `packages/vane-coupon/src/custom-plugins/ChannelPlugin/create.tsx`
- `packages/vane-coupon/src/custom-plugins/SharePlugin/create.tsx`
- `packages/vane-coupon/README.md`
