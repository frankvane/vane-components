# vane-activity 审计整改规格（待批准）

> 状态：**待批准**。当前仅完成审计，未修改任何源码。
> 依据：[report.md](file:///E:/react-plugin-component/tasks/63-vane-activity-audit/report.md)

## 1. 目标与非目标

**目标**

1. 消除 7 个 P1：`transformData` 未接线、`claim` 无守卫、抽奖客户端权威、`ClaimToast` 计时失效、畸形数据崩溃、`RuleModal` 键盘语义、context 每渲染重建。
2. 按批处理 17 个 P2 中低风险项（数量上限、定时器收尾、列表渲染、ARIA 细节、文档矛盾）。
3. 为每个修复补回归测试，保持现有 14 条测试全绿。

**非目标**

- 不重写 `ActivityCore` 布局或 19 个插件的视觉。
- 不改变现有必填 props 的语义；新增能力以**可选 props / 可选钩子**形式加入，保持向后兼容。
- 不引入后端、网络请求或持久化（本包仍为纯 UI 组件）。

## 2. 关键决策

### D1 数据管线（P1-1）

- 在 `withPlugins` 内用 `useMemo` 调用 `runtime.transformData(transformedProps.data, runtime.context)`，依赖 `[runtime, transformedProps.data]`。
- 转换结果同时供 `extendContext` 派生与 `enhancedProps.data` 使用；不再直接把 `runtime.context.data` 下发。
- 兼容性：现有插件都未声明 `transformData`，行为不变。

### D2 领取守卫（P1-2）

- `claim(rewardId)` 先按派生 `rewards` 校验：不存在 / `locked` / 已 `claimed` → 忽略并 `warn`（可加可选 `onClaimError`）。
- 非受控改为函数式 `setState`，并用 `claimingRef` 防同 tick 重入；受控模式维护 in-flight 集合。
- 受控契约保持：宿主未回写时 `claimedIds` 不变，但同一 id 在请求中不可再次触发。

### D3 抽奖权威性（P1-3）

- 新增可选受控入口：`drawResult`（服务端决定中奖格）或 `onDraw` 返回 `Promise<{ index, remaining }>`；pending 期间禁用按钮。
- 未提供受控入口时保留当前 `Math.random` 行为，但文档/`doc.json` 明确标注「仅演示，不可作为发奖依据」；修正工厂注释与文档矛盾（P2-15）。
- 次数以外部回写为准；组件不自行递减（或保留内部模式并明确标注非权威）。

### D4 Toast 计时（P1-4）

- 每条 toast 独立 timer（`Map<key, timerId>`）或 item 携带 `expiresAt`；effect cleanup 仅在卸载时清理全部，不在下一批领取时取消上一批。
- 保留 `max` 条数上限。

### D5 数据边界（P1-5 / P2-5 / P2-10）

- 在 `ActivityCore` 入口归一化：`tasks/rewards/leaderboard/announcements` 均 `Array.isArray(...) ? ... : []`。
- 数据驱动的数量 clamp：`days ≤ 31`、`total ≤ 100`、`confetti count ≤ 200`。
- 文本字段统一 `String(value ?? "")` 后再 `slice`。

### D6 模态框（P1-6）

- 打开时焦点移到弹窗；`Escape` 关闭；关闭后焦点还原触发按钮；`body.overflow` 锁定。
- 保留现有 `role="dialog"` + `aria-modal="true"`。

### D7 上下文稳定性（P1-7）

- `propsRef` 保存最新 props；`extendContext` 依赖收敛为 `[props.claimedRewardIds, props.onClaim]`。
- 派生 `tasks/progress/rewards/rewardMap` 拆为独立 `useMemo`；`claim` 用 `useCallback` 稳定。

## 3. 验收标准

- [ ] `withPlugins` 装配带 `transformData` 的测试插件后，数据确实被转换。
- [ ] `claim` 对 `locked` / 未知 / 已领取 id 不触发 `onClaim`；同 tick 连续领取不丢 id。
- [ ] 抽奖受控入口下，停格与服务端结果一致；pending 不可重复点击。
- [ ] 两批领取后，第一批 toast 到时自动消失。
- [ ] `data={}` / `tasks: null` 渲染空态而非抛错。
- [ ] `RuleModal` 支持 Esc 关闭与焦点还原。
- [ ] 宿主仅改无关 prop 时，插件 render 次数不增加。
- [ ] 现有 14 条测试保持通过，并为上述每项新增回归用例。
- [ ] `typecheck` / `lint`（0 error） / `test` / `build` 全绿。

## 4. 验证方式

```bash
pnpm --filter vane-activity typecheck
pnpm --filter vane-activity lint
pnpm --filter vane-activity test
pnpm --filter vane-activity build
```

## 5. 风险与兼容性

| 变更 | 风险 | 缓解 |
| --- | --- | --- |
| `claim` 增加守卫 | 受控宿主若依赖「先 UI 后服务端拒绝」的旧行为，可能少一次回调 | 只拦截明显非法状态；可加开关或 `onClaimError` 记录 |
| 抽奖新增受控入口 | 新增 API 面积 | 全部可选；不传时行为不变 |
| 数据归一化 | 把原来的崩溃变成空态 | 符合预期；不改变合法数据行为 |
| context 依赖收敛 | 宿主传入新的 `claimedRewardIds` 数组引用才会更新 | 保持数组引用契约；文档注明请勿原地 mutate |

## 6. 执行顺序（批准后）

1. P1-5 数据归一化 + P1-4 toast + P1-2 claim（低风险、直接业务收益）。
2. P1-1 transformData + P1-7 context 稳定（装配层）。
3. P1-3 抽奖受控入口 + 文档修正。
4. P1-6 模态框无障碍。
5. P2 分批（数量上限 → 定时器/动画 → 列表/ARIA/文案）。
6. 全量门禁 + 报告状态回填。
