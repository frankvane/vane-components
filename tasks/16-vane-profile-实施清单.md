# 16 · vane-profile 实施清单（阶段 / 任务 / 验收门）

> 用法：每完成一项打勾；**每个阶段末尾有验收门，不过门不进下一阶段**。
> 关联：设计决策与内核映射见 `tasks/15-vane-profile-分析.md`；家族范式见 `tasks/12`（vane-card）、`tasks/08`（vane-waterfall）
> 前置状态：vane-profile **尚未创建**（从 `packages/templates/plugin-component` 模板 `pnpm new` 生成）；内核 `vane-plugin-core@0.1.0` 已发布、API 见 `packages/plugin-core/src`

---

## 阶段总览

| 阶段 | 目标 | 主要产出 | 依赖 | 相对量 |
| --- | --- | --- | --- | --- |
| **P0** | 决策拍板（锁定 B1–B6） | 本文档 + `tasks/15` 结论 | — | S |
| **P1** | 包骨架 + 依赖 | `packages/vane-profile/` 可构建、依赖正确 | P0 | S |
| **P2** | Core + 领域槽 + 上下文扩展 | `ProfileCore` + `withPlugins` + `renderProfileSlot` | P1 | M |
| **P3** | 5 个插件分批迁入 | BannerSlot / StatRow / TabSync / VerifyBadge / FollowEcho + 5 份 `doc.json` | P2 | L |
| **P4** | demo（主页组合场景） | 工坊 + 场景 + 逐项 | P3 | M |
| **P5** | 文档 / README / 体积 / 发布 | docs 四件套、changeset、`0.1.0` | P4 | S |

> 量级口径：S ≈ 半天内、M ≈ 1–2 个专注时段、L ≈ 需要分批推进。vane-profile 是新建包（无迁移），比 vane-card 的 C 系列轻。

---

## 基线（P0 固化，后续阶段以此为准）

| 指标 | 规划/预期 | 复现/确认命令 |
| --- | --- | --- |
| 包定位 | 个人主页引擎（第 4 批社交组） | 见 `next-batch-components-plan.html` 第 4 批 |
| 首发插件 | 5 个：BannerSlot / StatRow / TabSync / VerifyBadge / FollowEcho | `tasks/15` 第四章 |
| 内核版本 | `vane-plugin-core@0.1.0`（peer 外部化） | `packages/plugin-core/package.json` |
| 体积预算 | 根入口 ≤ 3.5KB gzip | 规划原文 + ADR-6（子路径按需） |
| SOP 命中 | 4/5（缺 SOP-4 满命中） | `tasks/15` 第五章 |
| 红线 | 0 命中 | `tasks/15` 第五章 |
| 复用 vane-card | **否**（B1-A 自研） | `tasks/15` 第二章 |

> 与 vane-card 的关键差异：vane-profile 是**从零新建**，没有"旧仓可复现产物"这一层，所以不需要 C0 的行为快照；内核 API 已稳定，直接消费。

---

## P0 · 决策拍板（已随"按推荐来"锁定）

- [x] **P0.1 锁定 B1**：独立包 + 自研 Banner/StatRow，peer `react`/`react-dom`/`vane-plugin-core`（外部化），**推翻规划"复用 vane-card Banner/Stats"**
- [x] **P0.2 锁定 B2**：自研 StatRow/FollowEcho；家族级去重作为独立 P 级建议（不阻塞）
- [x] **P0.3 锁定 B3**：Core 三段式薄壳 + 包内 `renderProfileSlot` 领域槽（仿 D3-A）
- [x] **P0.4 锁定 B4**：BannerSlot/StatRow/VerifyBadge/FollowEcho → 领域槽渲染；TabSync → 领域事件钩子 + `extendContext` 注入 `activeTab`/`setActiveTab`
- [x] **P0.5 锁定 B5**：根入口 ≤3.5KB（规划初稿 2.5KB 偏乐观，据实上调，理由见 `package.json` 的 `vane.sizeBudgetNote`）；ADR-6 严格（根不桶导出插件）；子路径 `vane-profile/custom-plugins/<Name>`
- [x] **P0.6 锁定 B6**：SOP 4/5（缺 SOP-4 满命中）；红线 0；验收口径见 `tasks/15` 第九章

**验收门 P0**：`tasks/15` 与本文档结论一致；B1–B6 全部落纸。

---

## P1 · 包骨架 + 依赖

### P1.1 脚手架

- [ ] `pnpm new vane-profile`（复制 `packages/templates/plugin-component` 骨架）
- [ ] 确认 `package.json`：
  - [ ] `name: "vane-profile"`、`version: "0.1.0"`、`type: "module"`
  - [ ] `peerDependencies`: `vane-plugin-core: workspace:*`、`react >=16.8`、`react-dom >=16.8`
  - [ ] `dependencies`: 空（**不引 vane-card**）
  - [ ] `devDependencies`: `@vane/{build-config,eslint-config,tsconfig,vitest-config}`、react 18、vite 5、vitest 2、`vane-plugin-core@workspace:*`（dev 用）
  - [ ] `vane.sizeBudgetKb: 3.5`（如需细分再加 `coreSizeBudgetKb`）
  - [ ] `files: ["dist"]`、`sideEffects: false`、`scripts` 对齐（`dev/build/build:demo/typecheck/test/lint/sync:exports`）
- [ ] `tsconfig.json` / `tsconfig.lib.json` / `vite.config.ts`（lib 模式 + dts）/ `vitest.config.ts` / `eslint.config.js`
- [ ] 关掉 lib 模式 `publicDir`（`publicDir: false`），避免演示资产进包（C6 用 `npm pack` 复核）

### P1.2 依赖与体积闸门预检

- [ ] `pnpm install` 后确认 `vane-plugin-core` 是 peer（不在 `dependencies` / `node_modules` 顶层误装）
- [ ] 跑一次空骨架 `pnpm build` + `pnpm test`，确认模板链路通

**验收门 P1**：`build` 产出 `dist` 且 `exports` 有效；`typecheck` 0 错；`test` 模板自带用例通过；依赖声明正确（core 在 peer + dev，不在 dependencies）。

---

## P2 · Core + 领域槽 + 上下文扩展

### P2.1 类型与上下文

- [ ] `src/plugins/types.ts`：从 `vane-plugin-core` 派生
  - [ ] `ProfilePluginContext = PluginContext & { activeTab, setActiveTab, stats, followState, verified, banner }`
  - [ ] 5 个插件的 hooks 类型（含领域钩子 `onTabChange` 经索引签名）
- [ ] `src/components/ProfilePlugin/withPlugins.tsx`：
  - [ ] `usePluginRuntime({ plugins, props, containerRef, extendContext })`
  - [ ] `extendContext` 注入 `activeTab`/`setActiveTab`/`stats`/`followState`/`verified`/`banner`（**用 `useCallback` 稳定**，避免每次渲染重建 context）
  - [ ] Core 回调 → 钩子链：`onMount`/`onUnmount`/`onPropsChange`
  - [ ] 渲染：`composeSlots`（内核三段兜底）+ 包内领域槽
  - [ ] `transformProps` 链式（TabSync 可改写 props 注入 `activeTab`）

### P2.2 领域槽（仿 D3-A）

- [ ] 新增 `src/plugins/slots.tsx`：`renderProfileSlot(plugins, context, slotName)`
  - [ ] `slotName` 取值：`renderBannerArea` / `renderStatRow` / `renderTabBar` / `renderBadgeArea` / `renderFollowArea`
  - [ ] 复用内核排序（`config.order` 升序 → `priority` 降序）+ 逐插件 `PluginErrorBoundary`
  - [ ] **内核 `SlotHookName` 不动**（保持通用）

### P2.3 ProfileCore 布局壳

- [ ] `src/components/ProfileCore.tsx`（forwardRef）：
  - [ ] 三段式：`Banner 区`（顶部 `renderBannerArea`）→ `StatRow 区`（`renderStatRow`）→ `Tab 栏 + 内容容器`（`renderTabBar` + `children`）
  - [ ] `containerRefExternal` 双通道（withPlugins 靠它拿容器）
  - [ ] `onMount`/`onUnmount` 透传内核钩子

### P2.4 单测（第一批）

- [ ] `test/core-render.test.ts`：三段式顺序（Banner 在 StatRow 之上、内容区之下）、空插件时三段不渲染
- [ ] `test/context.test.ts`：`extendContext` 注入的 `activeTab`/`setActiveTab`/`stats` 可被插件读到；`forceUpdate` 契约
- [ ] `test/slots.test.ts`：领域槽按 order/priority 排序、单插件抛错只丢自己那段（错误边界）

**验收门 P2**：`build` 通过；`typecheck` 0 错；`test` ≥8 通过；三段式顺序与错误边界有断言；`extendContext` 字段可消费。

---

## P3 · 5 个插件

> 统一动作（每个插件）：写 `create.ts`（工厂返回 `{ name, hooks }`）+ `doc.json`（name/description/since/tags/config/example/useCases）+ `index.ts` 挂 `.meta` + 桶文件按分组注释。

### P3.1 BannerSlot（渲染 · 头图区）

- [ ] `renderBannerArea`：封面图 / 渐变背景 / 头像浮层位（children 或 `banner` context 注入）
- [ ] `doc.json`：config 含 `height` / `cover` / `gradient`
- [ ] 单测：装 BannerSlot → `renderBannerArea` 输出在顶部；无配置时不渲染

### P3.2 StatRow（渲染 · 数据行）

- [ ] `renderStatRow`：指标项（关注/粉丝/获赞/作品），`stats: StatItem[]` 来自 context
- [ ] `doc.json`：config 含 `items`（默认四项）、`layout`（横排/纵排）
- [ ] 单测：4 项指标渲染、空数组时不渲染、顺序正确

### P3.3 TabSync（事件/状态 · 内容区联动 · 关键）

- [ ] 注册领域钩子 `onTabChange`（经索引签名）
- [ ] 由 `extendContext` 的 `setActiveTab` 驱动：TabSync 渲染页签栏（`renderTabBar`），点击 → `setActiveTab(id)` → context 更新 → children 内容区（调用方）消费 `activeTab` 重渲染
- [ ] **不渲染固定位置**，是事件/状态驱动（SOP-4 部分命中的根源，见 `tasks/15` 4.2/5.1）
- [ ] 单测：点击页签 → `activeTab` 变化 → 模拟 children 消费 `activeTab` 重渲染（断言内容区输出随 `activeTab` 变）

### P3.4 VerifyBadge（渲染 · 认证徽标）

- [ ] `renderBadgeArea`（默认）或可选 `renderOverlay`（绝对定位浮在头图右上角）；`verified`/`badgeType` 来自 context
- [ ] `doc.json`：config 含 `type`（personal/institution）、`showLabel`
- [ ] 单测：未认证不渲染；机构标 vs 个人标文案/样式区分

### P3.5 FollowEcho（渲染 + 状态 · 关注回显）

- [ ] `renderFollowArea`：`followState: 'none'|'following'|'mutual'` 来自 context；`onPropsChange` 同步外部关注态
- [ ] `doc.json`：config 含 `showMutualBadge`
- [ ] 单测：三态文案/样式；props 变化经 `onPropsChange` 反映到渲染

### P3.6 桶文件 + 文档生成

- [ ] `custom-plugins/index.ts`：5 个导出，按"布局 / 数据 / 交互"注释分组
- [ ] `docs:plugins` 生成 5 行目录（确认生成器扫 `src/custom-plugins/<Name>/doc.json`，如路径不符参考 vane-card C3.4 的修复经验）

**验收门 P3**：`doc.json` **5/5**；桶文件 5 导出无遗漏；`docs:plugins` 生成 5 行；`typecheck` 0 错；`test` ≥20 通过（5×表驱动 + 领域槽 + TabSync 联动）；**TabSync 切换 activeTab 后内容区重渲染有断言**。

---

## P4 · demo（主页组合场景）

### P4.1 骨架

- [ ] `demo/vite.config.ts`：包名 alias（`vane-profile` / `/plugins/*` / `/style.css` → `src`），base `./`，端口 **3304**（避开 card 3301 等）
- [ ] HashRouter + 视角：`#/` 总览、`#/plugins` 工坊、`#/scenarios` 场景、`#/demos/:slug` 逐项
- [ ] 视觉沿用家族"深色编辑部 / 规格板"版式

### P4.2 插件工坊（`#/plugins`）

- [ ] `import.meta.glob("/src/custom-plugins/*/doc.json")` 驱动 5 组勾选
- [ ] 勾选即实时装配（`useProfile`，按插件名集合记忆组件类型）

### P4.3 场景库（`#/scenarios`，主页组合）

- [ ] 个人主页完整场景：Banner + StatRow + Tab（动态/作品/关于）+ VerifyBadge + FollowEcho 组合
- [ ] 一卡两栏 + 通栏代码（`?raw` 读同一 `.tsx`）

### P4.4 逐项示例（`#/demos/:slug`，5 页）

- [ ] 5 个插件页（每页 `meta` + 装配函数，骨架由 `DemoPage` 提供）

### P4.5 体检闸门（替代截图）

- [ ] `scripts/audit-profile.mjs`（参照 `audit-cards.mjs`）：断言越界/负坐标/零尺寸/重叠/`scrollHeight` 盖不住底边
- [ ] 结果：所有路由 **0 命中**

**验收门 P4**：`build:demo` 通过；体检 **0 命中**；每卡有代码块 + 复制按钮；**5/5 插件装配过**；逐项示例 5 页可打开。

---

## P5 · 文档 / README / 体积 / 发布

- [ ] **P5.1** `docs/components/vane-profile/` 四件套：
  - [ ] `index.md`：卖点 + 安装 + 30 秒示例 + 导入体积表 + 插件速览 + 演示站入口
  - [ ] `api.md`：`ProfileCoreProps` / `ProfileCoreRef` / 插件 context 全字段 / 领域槽名表 / TabSync 联动说明
  - [ ] `plugins.md`：5 插件 + priority / 渲染位置 / 冲突说明
  - [ ] `recipes.md`：主页组合配方 + 组合经验（领域槽 vs 内核槽分工 / order 与 priority 分工）
- [ ] **P5.2** README：`node scripts/sync-readme.mjs` 生成，首屏为 `npm install vane-profile` + 30 秒上手
- [ ] **P5.3** `docs/guide/decisions.md` 补 ADR（profile 领域槽设计 / 不引 vane-card / ADR-6 子路径严格走）
- [ ] **P5.4** `.changeset/vane-profile-010.md`（minor）：首发特性清单
- [ ] **P5.5** `npm pack --dry-run`：只含 `dist` + `README.md` + `package.json`，无演示资产
- [ ] **P5.6** 回归：`eslint` 0 error、`tsc --noEmit` 0 错、`vitest` 通过、`check-packages` 体积线全绿、`vitepress build` 通过
- [ ] **P5.7** 发布 `vane-profile@0.1.0`（发布动作单独确认）

**验收门 P5**：`check-packages` 全绿（根 ≤3.5KB）；`docs:build` 通过；README 由 docs 同步生成；pack 干净；changeset 就位。

---

## 验收门汇总

| 阶段 | 硬指标 |
| --- | --- |
| P0 | B1–B6 全部落纸、与分析文档一致 |
| P1 | build 通过 / typecheck 0 / core 在 peer+dev 不在 dependencies |
| P2 | 三段式顺序 + 错误边界有断言 / context 字段可消费 / test ≥8 |
| P3 | doc.json 5/5 / docs:plugins 5 行 / test ≥20 / TabSync 联动有断言 |
| P4 | demo build 通过 / 体检 0 命中 / 5 插件装配过 / ≥5 页可打开 |
| P5 | check-packages + docs:build 全绿 / pack 干净 / changeset 就位 |

---

## 不做清单（明确排除，避免范围蔓延）

- ❌ 不引 `vane-card`（B1-A 自研 Banner/StatRow）
- ❌ 不把 5 个插件桶导出到根入口（ADR-6 严格：根只导 Core + withPlugins）
- ❌ 不做悬浮用户卡 / 关注状态机本体 / 动态流路由（分别属 user-card / follow / feed）
- ❌ 不在本包动"家族级 StatRow/FollowEcho 去重"（独立 P 级建议，等第 2 批后评估）
- ❌ 不在 P1–P3 阶段顺手做视觉重设计（样式抽取若做，独立提交，参照 vane-card C4.3）

---

## 依赖与并行

```
P0（决策）── P1（骨架）── P2（Core+领域槽）── P3（5 插件）── P4（demo）── P5（文档/发布）
```

- **P3 五个插件之间可分批推进**（无相互依赖，各自独立 `doc.json` + 单测）。
- **P4.2 工坊可与 P3 交叉**（场景只依赖已写好的插件）。
- 每个阶段结束都跑一次 `pnpm verify`（根目录），把回归锁在阶段内。

---

## 执行记录（P1 起逐阶段追加）

| 阶段 | 计划指标 | 实测 |
| --- | --- | --- |
| P0 | B1–B6 落纸 | ✅ 见 `tasks/15` + 本文档 |
| P1 | 包骨架 + 依赖 | ⏳ 待开工 |
| P2 | Core + 领域槽 + 上下文 | ⏳ |
| P3 | 5 插件 + doc.json | ⏳ |
| P4 | demo + 体检 0 命中 | ⏳ |
| P5 | 文档 + 发布 0.1.0 | ⏳ |
