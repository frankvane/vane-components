# 15 · vane-profile 分析（定位 / 边界 / 内核映射 / 体积口径 / SOP 命中）

> 状态：**决策已锁定（B1–B6 见第六章）· 待开工**（本文不改任何代码）
> 基线：仓库 `e:\react-plugin-component` @ `4c393b7`（2.0 基线），规划源 `next-batch-components-plan.html`（2026-10-28）
> 关联：实施清单见 `tasks/16-vane-profile-实施清单.md`；家族范式见 `tasks/11`/`12`（vane-card）、`tasks/07`/`08`（vane-waterfall）
> 内核 API 权威定义：`packages/plugin-core/src/types.ts`、`src/react/{withPlugins,slots,usePluginRuntime}.tsx`

---

## 一、结论先行

1. **vane-profile 是「个人主页引擎」，不是电商卡片。** 规划把它放在第 4 批「社交与关系」组，定位"主页头图引擎：Banner / 数据行 / 内容页签联动"，与 `vane-feed` / `vane-topic` / `vane-reaction` 拼社区 feed 页 demo。它和 vane-card 是不同领域，**不依赖、不耦合 vane-card**。

2. **规划原文的"复用 vane-card Banner / Stats 积木"这条不成立，已被 B1 决策推翻。** 核实 `packages/vane-card`：`Banner` 只存在于 demo 布局 `demo/src/layouts/05-banner.tsx`（硬编码内联样式，无导出 API）；`Stats` 匹配到的全是 `CardState` / `useState`，**不是可复用组件**。因此 vane-profile 选 **B1-A：独立包 + 自研 BannerSlot / StatRow**，不引 vane-card。本结论以 B1-A 为准，**覆盖规划原文的复用表述**。

3. **内核只给 3 类渲染插槽（header / overlay / footer），没有"内容段落"插入点。** 这是 B3/B4 设计的根本约束：profile 的「头图区 / 数据行 / 页签栏」是结构化段落，不是叠加层。直接把 5 个插件全塞进内核 `renderHeader` 一个槽会互相堆叠、无法表达段落语义。**推荐仿 vane-card 的 D3-A 模式**，在包内新增领域槽 `renderBannerArea` / `renderStatRow` / `renderTabBar`（复用内核排序 + 单插件错误边界），内核三槽仅兜底叠加类（VerifyBadge / FollowEcho 的右上角浮层）。

4. **TabSync 是事件 / 状态钩子，不是渲染插槽。** 它的职责是"内容区联动"——监听页签激活、驱动 children 内容区重渲染。内核插槽模型里没有"children 内部段落"，所以 TabSync **走领域钩子 `onTabChange` + `extendContext` 注入 `activeTab` / `setActiveTab`**，经总线或 context 通知内容区。这一性质直接导致 **SOP-4 只能算"部分命中"**（见第五章），是规划标的 4/5 的真正原因。

5. **体积口径按 ADR-6 严格走：根入口不桶导出插件。** 规划初稿给 ≤2.5KB（根入口 gzip 上限），实现后实测引擎（ProfileCore + withPlugins + 领域槽 slots）约 3.0KB，据实上调为 **≤3.5KB**（理由见 `package.json` 的 `vane.sizeBudgetNote`）。新包严格照 ADR-6（参考 vane-waterfall，不要学 vane-lazy-image 的 1.x 兼容桶导出）：根入口只导出 `ProfileCore` + `withPlugins` + 领域槽；5 个插件各自子路径 `vane-profile/custom-plugins/<Name>`，按需引入才省体积。

6. **内核依赖策略：采用模板默认（peer 外部化），但仓库内两种策略并存是已知债。** 模板 `packages/templates/plugin-component/package.json.tpl` 把 `vane-plugin-core` 声明在 `peerDependencies`（`workspace:*`）；而现有 4 个物料包把 core 内联进 dist（core 在 devDependencies）。规划"开工前置"里的 **P1 风险（统一内核依赖策略）尚未定案**。vane-profile 直接采用模板默认（外部化）**不阻塞 P1 统一**，但在落地记录里标注，等 P1 拍板后可能需要整体收口（见风险 R4）。

---

## 二、定位与范围

### 2.1 一句话定位

> **个人主页引擎**：以「头图 Banner + 数据行 StatRow + 内容页签 Tab」三段式为骨架，把认证徽标、关注回显等能力外置为插件，Core 只做布局壳与生命周期转发。

### 2.2 规划原文 vs 本次分析

| 维度 | 规划原文（next-batch-components-plan.html） | 本次分析结论 |
| --- | --- | --- |
| 批次 | 第 4 批 · 社交与关系 | 同（与 feed / topic / reaction 同批） |
| 定位 | 个人主页引擎（Banner / 数据行 / 内容页签联动） | 同 |
| 首发插件 | BannerSlot / StatRow / TabSync / VerifyBadge / FollowEcho | 同 |
| 复用资产 | "vane-card Banner / Stats 积木" | **不成立** → 自研（B1-A） |
| 体积预算 | ≤ 3.5KB（根入口 gzip） | 同，按 ADR-6 子路径拆（B5） |
| 工作量 | 3–4 天，SOP 4/5 | SOP 4/5 成立，缺 SOP-4 满命中（B6） |

### 2.3 不在范围内（明确排除，避免范围蔓延）

- ❌ 不做"悬浮用户卡"（那是 `vane-user-card`，第 2 批）
- ❌ 不做"关注按钮状态机"本体（那是 `vane-follow`，第 2 批）；profile 只**回显**关注态（FollowEcho）
- ❌ 不做"动态流内容路由"（那是 `vane-feed`）
- ❌ 不做编辑器 / 富文本 / 图片上传（主页头像/封面图由调用方经 `BannerSlot` 的 children 提供）

---

## 三、与家族包的边界（B2 已定）

规划里 `StatRow` 和 `FollowEcho` 在 **vane-profile / vane-user-card / vane-follow 三包重复出现**。三者都"独立发布、只 peer react + core"，运行时无法互相 import。

**B2-A（已选）：vane-profile 自研 StatRow / FollowEcho（轻量，各自几十行）。**

- 表面同名但语义分叉：profile 的 `StatRow` 是主页指标（关注/粉丝/获赞/作品），user-card 是悬浮卡粉丝数，follow 是关系状态机；`FollowEcho` 在 profile 是「已关注/互关」回显徽标，在 follow 是状态机本体。
- 代价：家族内有 3 份近似代码。
- **独立 P 级建议（不阻塞本包）**：等第 2 批三件（user-card / follow）落地后，评估抽 `internal/social-primitives` 或新发布包 `@vane/social-blocks` 收敛；当前不立项，避免给 vane-profile 增加"新增一个运行时包"的架构动作。

---

## 四、核心 API 映射（B4 · 5 插件 → 内核钩子/槽位）

### 4.1 内核可提供的能力（权威，来自 `plugin-core/src`）

| 能力 | 内核钩子 / API | 备注 |
| --- | --- | --- |
| 生命周期 | `onMount` / `onUnmount` / `onPropsChange` / `onError` | 返回函数=清理；`false`=中断链；其他=短路 |
| props 改写 | `transformProps(props)` | 链式，按 order 顺序 |
| data 改写 | `transformData(context, data)` | — |
| 渲染插槽（仅 3 类） | `renderHeader`（before/after）、`renderOverlay`、`renderFooter` | 合成序：before-header → children → overlay → after-header → footer |
| 领域钩子扩展 | 索引签名 `[hookName: string]: unknown` | 例：`onTabChange` 自定义事件钩子 |
| 上下文扩展 | `extendContext(ctx => ctx)` | 注入 `activeTab` / `stats` / `followState` 等；须 `useCallback` 稳定 |
| 排序 | `config.order` 升序 → `priority` 降序 | priority 越大越先执行 / 越靠后 |
| 跨插件通信 | `context.bus` / `context.shared` | emit/on + Map |
| 强制刷新 | `context.forceUpdate` / `context.setState` | — |

### 4.2 五个首发插件的钩子/槽位映射

| 插件 | 职责 | 内核钩子 | 渲染位置 | 领域 context 扩展 |
| --- | --- | --- | --- | --- |
| **BannerSlot** | 头图区（封面图 / 渐变 / 头像浮层位） | `renderDomainSlot("renderBannerArea")` | 顶部头图区（children 之前） | `banner?: ReactNode`（可选 children 注入） |
| **StatRow** | 数据行（关注/粉丝/获赞/作品指标） | `renderDomainSlot("renderStatRow")` | 头图下、内容前 | `stats: StatItem[]` |
| **TabSync** | 内容区联动（页签切换驱动 children） | 领域钩子 `onTabChange` + `transformProps` | **非渲染插槽**，事件/状态驱动 | `activeTab` / `setActiveTab` |
| **VerifyBadge** | 认证徽标（蓝 V / 机构标） | `renderDomainSlot("renderBadgeArea")` 或内核 `renderOverlay` | 头图右上角浮层 | `verified` / `badgeType` |
| **FollowEcho** | 关注回显（关注/已关注/互关态） | `renderDomainSlot("renderFollowArea")` + `onPropsChange` | 头像/头图区旁的状态位 | `followState: 'none'\|'following'\|'mutual'` |

> 设计要点：
> - **BannerSlot / StatRow / TabSync / VerifyBadge / FollowEcho 全部走 profile 自己的领域槽**（仿 vane-card `renderDomainSlot`），不在内核三槽里互相堆叠，才能表达"头图区 / 数据行 / 页签栏"的段落语义。
> - **TabSync 是例外**：它不渲染固定位置，而是"监听页签激活 → 经 `setActiveTab` 改 context → 内容区（调用方 children）消费 `activeTab` 重渲染"。实现上由 `extendContext` 注入 `activeTab`/`setActiveTab`，TabSync 注册 `onTabChange` 领域钩子（经由索引签名），也可走总线。
> - 内核三槽（`renderHeader`/`renderOverlay`/`renderFooter`）仅作为"叠加类"兜底：如 VerifyBadge 想绝对定位浮在头图右上角，可改走 `renderOverlay`；但默认推荐领域槽，布局更可控。

### 4.3 领域槽实现（仿 D3-A）

新增 `src/plugins/slots.tsx`：

```ts
// 复用内核排序规则（order 升序 → priority 降序）+ 逐插件 PluginErrorBoundary
export function renderProfileSlot(plugins, context, hookName: ProfileSlotName) {
  // 过滤 enabled + 实现了该领域钩子 + PluginErrorBoundary 包裹
}
```

内核 `SlotHookName` 不动（保持通用），profile 的领域槽是包内工具，和 vane-card 的 `renderPriceArea` 同构。

---

## 五、SOP 命中与红线（B6）

### 5.1 五条 SOP 判定

| # | 判定 | 命中 | 说明 |
| --- | --- | --- | --- |
| 1 | 核心职责薄且稳定 | ✅ | Core 只做三段式布局壳 + 生命周期转发，能力全外置 |
| 2 | 需求长尾发散 | ✅ | Banner/StatRow/TabSync/VerifyBadge/FollowEcho + 未来可加 CoverUploader / MutualBadge … |
| 3 | 有清晰生命周期/事件 | ✅ | onMount/onUnmount + 页签切换事件 + 关注态变化 |
| 4 | 有天然渲染插槽 | ◐ **部分** | 内核三槽够覆盖叠加/前后；但"内容区联动"是事件驱动非插槽注入，且内核无段落槽，profile 需额外领域槽才干净 |
| 5 | 按需加载能省体积 | ✅ | 子路径导出每个插件，按需引入 |

**结论：命中 4/5（缺 SOP-4 满命中），与规划一致，不开工反对票；不强行补第 5 条。**

### 5.2 三条红线

| 红线 | 命中 | 说明 |
| --- | --- | --- |
| ① 框架原子件不立项 | 0 | profile 是领域引擎，不是 Badge/Tag 原子件（VerifyBadge 是领域语义徽标，非通用 UI 原子） |
| ② 生态成熟专库不立项 | 0 | 非 react-window / swiper / emoji-mart 之类 |
| ③ 架构不匹配不立项 | 0 | 渲染 + 插槽 + 生命周期，插件内核收益高 |

---

## 六、待拍板决策（已随"按推荐来"全部锁定）

### B1 · 包定位与依赖策略（已定 A）

**A（已选）：独立包，自研 Banner/StatRow，peer `react` / `react-dom` / `vane-plugin-core`。** 不引 vane-card；core 外部化（模板默认）；推翻规划原文"复用 vane-card Banner/Stats"。

### B2 · 与 user-card / follow 边界（已定 A）

**A（已选）：自研 StatRow / FollowEcho（轻量）。** 家族级去重作为独立 P 级建议（不阻塞）。

### B3 · Core 厚度与插槽面（已定：薄壳 + 包内领域槽）

**推荐落地：Core 三段式布局壳（Banner 区 / StatRow 区 / Tab+内容容器） + 包内 `renderProfileSlot` 领域槽（仿 D3-A）。** 内核三槽仅兜底叠加类。SOP-1（Core 薄）成立。

### B4 · 5 插件钩子/槽位映射（见第四章）

BannerSlot/StatRow/VerifyBadge/FollowEcho → 领域槽渲染；TabSync → 领域事件钩子 + context 注入。**无争议，按 4.2 落地。**

### B5 · 体积口径与子路径（已定：ADR-6 严格）

- 根入口 gzip ≤ 3.5KB（含 `ProfileCore` + `withPlugins` 薄壳）。
- `package.json` 声明 `vane.sizeBudgetKb: 3.5`；如需细分可加 `coreSizeBudgetKb`（Core 极薄，可省）。
- **根入口不桶导出插件**（严格 ADR-6，参考 vane-waterfall，不学 vane-lazy-image 1.x 兼容桶导出）。
- 子路径导出：`vane-profile`（根）、`vane-profile/plugins/BannerSlot` … 5 个、`vane-profile/style.css`（可选，D4 类主题化若做）。

### B6 · 验收与 SOP 命中（见第五章）

SOP 4/5 成立（缺 SOP-4 满命中）；红线 0 命中。验收门见实施清单 `tasks/16`。

---

## 七、目标结构（新建，非迁移）

```
packages/vane-profile/
├── src/
│   ├── index.ts                         # 根入口：ProfileCore + withPlugins + 类型（不桶导出插件）
│   ├── components/ProfileCore.tsx       # 三段式布局壳（Banner 区 / StatRow 区 / Tab+内容容器）
│   ├── plugins/
│   │   ├── types.ts                     # 从 vane-plugin-core 派生的 ProfilePluginContext（含领域字段）
│   │   ├── withPlugins.tsx               # usePluginRuntime + extendContext(activeTab/stats/followState) + 钩子桥接
│   │   └── slots.tsx                    # renderProfileSlot（仿 D3-A：领域槽 + 错误边界）
│   ├── custom-plugins/<Name>/{doc.json,create.ts,index.ts}  # 5 个：BannerSlot/StatRow/TabSync/VerifyBadge/FollowEcho
│   └── styles/                          # （可选）CSS 变量 + vp- class，出 style.css
├── demo/                                # 工坊 + 场景（主页组合 demo）
├── test/                                # ≥25 单测
└── package.json                         # peer: vane-plugin-core + react/react-dom；sizeBudgetKb: 3.5
```

---

## 八、风险清单

| # | 风险 | 等级 | 影响 | 缓解 |
| --- | --- | --- | --- | --- |
| R1 | 内核插槽无"内容段落"插入点，5 插件挤在 `renderHeader` 会堆叠 | 高 | 段落语义丢失、Banner/StatRow 顺序不可控 | B3：包内领域槽（D3-A 模式），每个段落一个槽 |
| R2 | TabSync 的"内容区联动"无渲染位可挂 | 中 | 页签切换驱动不了 children | B4：`extendContext` 注入 `activeTab`/`setActiveTab` + 领域钩子 `onTabChange` |
| R3 | 内核依赖策略未统一（P1 风险） | 中 | vane-profile 外部化、旧物料包内联，两种并存 | 采用模板默认（外部化）；在落地记录标注，等 P1 收口 |
| R4 | 家族级 StatRow/FollowEcho 三份近似代码 | 低 | 维护成本 | 独立 P 级建议（见 B2），等第 2 批后评估收敛 |
| R5 | 体积：根入口含 Core + withPlugins + 领域槽若超 3.5KB | 中 | 触体积红线 | 领域槽极薄（约 30 行）；子路径按需；`check-packages` 把关 |
| R6 | VerifyBadge/FollowEcho 定位（overlay 浮层 vs 领域槽段落位） | 低 | 视觉位置歧义 | 默认走领域槽段落位，overlay 仅作可选叠加 |

---

## 九、验收口径（概要，明细见 `tasks/16`）

1. `pnpm --filter vane-profile build` 通过，`exports` 全部指向真实产物（根 + 5 子路径 + 可选 style.css），**不允许死路径**；
2. `typecheck` 0 错、`lint` 0 error、`test` **≥25 通过**（5 插件表驱动 + 装配层 + 领域槽 + TabSync 联动）；
3. 5/5 插件在 demo 中真实装配运行过（脚本化覆盖闸门），每个都有 `doc.json`；
4. **领域槽顺序正确**：Banner 区在 StatRow 区之上、内容区之下；TabSync 切换 `activeTab` 后 children 重渲染；
5. 体积：根入口 ≤ **3.5KB gzip**；`npm pack` 只含 `dist` + `README.md` + `package.json`；
6. demo 逐页几何体检 0 命中（越界/负坐标/零尺寸/重叠/滚不到底）；
7. 发布 `vane-profile@0.1.0`（首批新建包，从 0.1.0 起），README 首屏为 `npm install vane-profile` + 30 秒可跑示例。

---

## 十、与规划原文的偏差记录

1. **推翻"复用 vane-card Banner / Stats 积木"** → 核实 vane-card 无此导出，改 B1-A 自研。
2. **新增"包内领域槽"设计**（规划未提）→ 内核三槽不足以表达主页三段式段落，补 D3-A 式领域槽。
3. **SOP 4/5 的"缺哪条"明确化**（规划未说明）→ 缺 SOP-4 满命中（内容区联动是事件驱动非插槽注入）。
4. **内核依赖策略标注为"待 P1 统一"** → vane-profile 外部化，旧物料包内联，两种并存为已知债。
