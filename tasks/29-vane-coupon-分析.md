# vane-coupon 分析（tasks/29）

> 按 `tasks/27` / SKILL `vane-package-builder` P1-1 要求拍板。编号规则：分析=奇数（29）、实施清单=偶数（30）。
> 参照系：vane-sku（同形态：单卡 + 状态机 + 插件家族，core-装配-三槽结构一模一样）。

## 1. 定位

券展示与领取组件。业务核心是**状态机**而非静态卡片：一张券的生命周期
「未开始 → 可领取 → 领取中 → 已领取/失败 → 已使用 / 已抢空 / 已过期」横跨时间（有效期）、库存（限量）、用户动作（领取）三个维度，天然适合插件化拆分。

- npm 包：`vane-coupon`
- 核心组件目录：`src/components/CouponPlugin/`，核心 `CouponCore`，工厂 `createCouponCard(plugins)`
- UMD 名：`VaneCoupon`；CSS 变量前缀：`--vane-coupon-*`；class 前缀：`vc-`
- 4 个官方插件：ClaimState / Validity / RuleExpand / Stack（见 §4）

## 2. 拍板决策

| 决策点 | 结论 | 理由 |
|---|---|---|
| 入口划分 | 根 `.` = CouponCore + createCouponCard + 领域类型；`./entries/core` 最小核心；`./entries/plugins` 全家桶；4 插件各走子路径 | ADR-6/14，与 sku 完全一致 |
| 插件清单 | ClaimState / Validity / RuleExpand / Stack 共 4 个 | 用户指定 |
| core 依赖派系 | **模板默认 peer 外部化**（`vane-plugin-core` 进 peerDependencies） | 模板默认即此派；coupon 体积小，外置收益更大 |
| 体积预算 | `sizeBudgetKb: 8`（根入口 gzip，构建后实测再校准，超了写 note 不静默调） | 参照 sku 根入口 6.5KB 同构体量 |
| 插槽模型 | 沿用 sku 四槽：before（renderHeader before）/ overlay / after（renderHeader after）/ footer | 票券结构四段恰好映射：角标区 / 浮层 / 信息行区 / 操作区 |
| 样式 | `src/styles/tokens.css + components.css`（`vc-` 前缀），`sideEffects: ["**/*.css"]` | 票券缺口/虚线需要伪元素，内联样式做不了；走 createLibConfig 的 css-copy 自动产出 `dist/style.css` |
| demo 场景 | 7 页：00-quickstart / 01-claim-state / 02-validity / 03-rules / 04-stack / 05-combined / 06-limited | 每个插件独立页 + 合体页 + 限量页 |
| 测试环境 | happy-dom（模板默认），`fileParallelism:false` 由基座内置 | 不动 |

## 3. 领域语义

### 3.1 数据模型 `CouponData`

| 字段 | 类型 | 语义 |
|---|---|---|
| `id` | string | 稳定标识 |
| `title` | string | 券名称（右侧信息区主文案） |
| `amount` | number | 面额（元）；`amountType` 为 discount 时是折扣（如 8.5 折） |
| `amountType`? | `"cash" \| "discount"` | 默认 cash（¥ 前缀）；discount 显示 `X 折` |
| `threshold`? | number | 使用门槛（满 X 元可用），0/undefined = 无门槛 |
| `thresholdText`? | string | 自定义门槛文案，覆盖默认推导 |
| `rules`? | string[] | 使用规则条目（RuleExpand 渲染） |
| `validFrom`/`validTo`? | number | 绝对有效期（epoch ms） |
| `validDays`? | number | 相对有效期（领取后 N 天） |
| `total`?/`claimed`? | number | 发放总量 / 已领取（限量判定 + 余量展示） |
| `stackable`? | boolean | 是否可叠加（Stack 徽标数据源） |

### 3.2 领取状态机（ClaimStatePlugin）

```
idle(未开始) ──到开始时间/手动──▶ available(可领取) ──点击──▶ claiming(领取中)
   │                                 ▲   │成功            │失败(带回 reason)
   │                                 └───┴── failed 回退 ──┘
   │                                   │
   └─ 无库存 ──▶ soldout(已抢空)        ├──▶ claimed(已领取) ──核销──▶ used(已使用)
                                       └─ 过期判定 ──▶ expired(已过期)
```

- **相位枚举**：`idle / available / claiming / claimed / used / soldout / expired`（7 态；failed 不设独立态，领取失败回退 `available` 并经 `onClaimError` 上报，避免状态爆炸）。
- **终态**：`used / soldout / expired`；`claimed` 半终态（可核销为 used）。
- **推进入口**：① `initialPhase` 配置（受控初值）；② 点击按钮触发 `claim()` 异步回调；③ **联动降级**——事件钩子里按「有效期过期（读内核 state.validity）→ stock 余量为 0」自动压到 `expired` / `soldout`（终态优先级：expired/soldout > 一切非终态）。
- **API**：context 暴露 `phase`（getter 读实时）+ `setPhase(phase)`；跨插件/宿主经内核 state 通信，不直连插件闭包。
- 按钮文案按相位默认：未开始/开始领取、可领取/立即领取、领取中/领取中…、已领取/去使用、已使用/已使用、已抢空/已抢光、已过期/已过期。

### 3.3 有效期判定（ValidityPlugin）

- **三种模式**：绝对（validFrom~validTo）> 相对（validDays，从 `claimedAt`（默认领取时刻）起算）> 未声明（不渲染）。
- **产出**：`state.validity = { mode, valid, expired, remainingMs, text }`，text 为展示文案（`YYYY.MM.DD - YYYY.MM.DD` / `领取后 N 天内有效` / `剩 X 天` / `已过期`）。
- **紧迫态**：剩余 ≤ `urgentDays`（默认 3 天）用强调色显示「仅剩 X」，制造紧迫感。
- **时钟可注入**：`now?: () => number`（默认 `Date.now`），测试与 demo 可控。
- 与 ClaimState 的联动只经内核 state：ClaimState 在事件钩子读 `state.validity?.expired`。

### 3.4 规则展开（RuleExpandPlugin）

- 渲染 `rules[]`：折叠态显示前 `collapsedCount`（默认 1）条 + 「展开 (N 项)」；展开后全量 + 「收起」。
- 展开态写内核 state（`rulesExpanded`），`forceUpdate` 语义由 setState 天然满足。
- rules 为空渲染 null。默认截断**不用 line-clamp**（几何体检已证明 line-clamp 是纵向裁切重灾区），按条数截断。

### 3.5 叠加态（StackPlugin）

- `stackable === true`（数据驱动，可 `always` 强制）→ before 槽渲染「可叠加」角标；`showWhenNotStackable` 开启时 false 显示「不可叠加」灰标。
- 角标落在票面左上面区（before 槽），不遮挡面额。

## 4. 插件 × 插槽 × priority

渲染槽内排序 = `config.order` 升序 → `priority` 降序（内核「越大越先执行」同向，不反转）。

| 插件 | name | 槽 | priority | 职责 |
|---|---|---|---|---|
| StackPlugin | `stack` | before | 12 | 叠加角标 |
| RuleExpandPlugin | `rule-expand` | after | 21 | 规则展开/收起（先规则） |
| ValidityPlugin | `validity` | after | 23 | 有效期行 + 判定写 state（后渲染=更靠底） |
| ClaimStatePlugin | `claim-state` | footer | 32 | 领取按钮 + 状态机 |

事件钩子（onMount / onPropsChange / 领域钩子 `onPhaseChange`）负责写 state，渲染钩子纯读——不在渲染期 setState。

## 5. 核心本体（CouponCore 只画这些）

1. 票券容器（白底 + 圆角 + 自带内边距 16——comment 的教训：自带白底就自带内边距）
2. 左面额区：amount（¥ / X折）+ 门槛文案（thresholdText > 推导）
3. 右信息区：title（仅此一行是必须的）
4. 四槽注入点：before → 面额+标题 → after → footer → children
5. 根节点内联 `position:relative` + `color`（ADR-13 第 5 条：有背景必有字色）

核心 ≤150 行自检通过标准：除上述 5 项外零业务逻辑；phase/validity/rulesExpanded 全在内核 state。

## 6. 风险与预案

| 风险 | 预案 |
|---|---|
| 体积门 | 根入口只进 Core+工厂+类型（ADR-6），4 插件全子路径；先 build 再 check |
| 票券缺口伪元素对比度/几何 | 伪元素 `inset:-1px` 类问题已入 tasks/28 判读口径；体检按「1px 级别先怀疑伪元素」 |
| line-clamp 诱惑 | 规则截断按条数，不用 line-clamp |
| 时间敏感逻辑测不稳 | `now` 可注入；测试用固定 epoch |
| demo 侧被诱惑补样式 | 组件样式全部在 components.css；App.css 只动 `--accent` 四行 + 品牌 |
