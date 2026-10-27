# 08 · vane-waterfall 实施清单（阶段 / 任务 / 验收门）

> 用法：每完成一项打勾；**每个阶段末尾有验收门，不过门不进下一阶段**。
> 关联：事实基线与决策项见 `tasks/07-vane-waterfall-迁移分析.md`；样板范式见 `tasks/02-实施清单.md`（P1 lazy-image）
> 前置状态：`旧仓库/vane-waterfall` 只读快照（未跟踪进主仓，自带 `.git`），**不可运行、不可重建**（`tsc -b` exit=2）

---

## 阶段总览

| 阶段 | 目标 | 主要产出 | 依赖 | 相对量 |
| --- | --- | --- | --- | --- |
| **W0** | 决策拍板 + 基线固化 | D1–D4 结论、6 个行为快照单测 | — | S |
| **W1** | 包骨架 + Core 迁入 | `packages/vane-waterfall/` 可构建、Core 语义等价 | W0 | M |
| **W2** | 插件系统替换 | 自建系统（1600 行）删除，改 `vane-plugin-core` | W1 | M |
| **W3** | 27 插件分批迁入 | A 14 / B 11 / C 2 + 27 份 `doc.json` + 3 配方 | W2 | L |
| **W4** | demo 重建 | 插件工坊 + 场景库（约 12 场景） | W3 | L |
| **W5** | 文档 / README / 发布 | docs 四件套、changeset、`2.0.0` | W4 | S |

> 量级口径：S ≈ 半天内、M ≈ 1–2 个专注时段、L ≈ 需要分批推进（不做日历承诺，只看文件数与风险）。

---

## 基线（W0.5 固化，后续阶段以此为准）

| 指标 | 旧仓实测 | 复现命令 |
| --- | --- | --- |
| 可运行性 | **不可运行**：35/40 demo 页 `import from "vane-waterfall"`，`dist/` 不存在、`node_modules/vane-waterfall` 自链接不存在 | — |
| 可构建性 | **不可构建**：`tsc -b` **exit=2**，66 个类型错误（38 找不到 `vane-waterfall` + 28 隐式 any） | `cd 旧仓库/vane-waterfall && npx tsc -b` |
| 源码规模 | `.ts/.tsx` **8394 行 / 79 文件**：core 836、自建插件系统 1600、27 插件 1582、demo 4025、壳与入口 ~200、`src/index.ts` 41 | `find src -name "*.ts*" \| xargs wc -l` |
| 插件数 | **27**（A 14 / B 11 / C 2） | `ls src/components/WaterfallPlugin/custom-plugins` |
| 钩子面 | 声明 **48**，实际有调用点 **17**，死钩子 **31** | 见 07 · 4.5 |
| 测试 | **0 个** | — |
| 插件文档 | **0 个** `doc.json` | — |
| 类型逃逸 | `as any` / `@ts-ignore` 共 **32 处** | `grep -rn "as any\|@ts-ignore" src` |
| npm 已发布 | `vane-waterfall@1.0.5`（历史产物，当前源码复现不出来） | `npm view vane-waterfall version` |
| 布局基准 | `test/fixtures/layout-snapshots.json`，8 组快照（三种列分配 / gap+padding / totalHeight / 尺寸变化 / scrollToItem / 空数据） | `node .workbuddy/scratch/wf-baseline/gen-snapshots.mjs` |

> 新增一条实测结论：旧 `calculateLayout` 里 `if (itemHeight === 0) continue` 意味着**未测量的项不占位**，
> 而虚拟化场景下未渲染的项永远测不到高度 → 总高严重偏小。下沉虚拟化（D2-A）必须改成「未测量按
> `estimateHeight` 兜底」，这条差异在 W1.2 的 `layout.ts` 里以 `estimateHeight` 参数体现。

---

## W0 · 决策拍板与基线固化

- [x] **W0.1 拍板 D1**（布局钩子）：**D1-A 接线**
  - [x] D1-A：Core 补 `calculateColumns` / `calculateColumnWidth` / `calculateItemPosition` 三个执行点（推荐）
  - [ ] ~~D1-B：不接线，删除 `PinItemPlugin`~~
- [x] **W0.2 拍板 D2**（VirtualWaterfall）：**D2-A 下沉 Core**
  - [x] D2-A：下沉 Core 选项 `virtualize`（推荐）／ ~~D2-B：独立组件~~ ／ ~~D2-C：不迁~~
- [x] **W0.3 拍板 D4**（demo 形态）：**D4-B 工坊 + 场景库**
- [x] **W0.4** 确认 D3 钩子收口清单（20 个），结论已写入 07 · 5.5；28 个不迁钩子写进 `docs/guide/decisions.md` 的 ADR（W5.3 落地）
- [x] **W0.5** 固化基线：见上方「基线」小节
- [x] **W0.6** 写 8 个「行为快照」单测基准（旧仓无法执行，改为把 `calculateLayout` 逐行转写成纯函数后取证）
  - [x] 列分配：`shortest` / `balanced` / `sequential` 三种模式下 10 项的 `itemPositions` 快照
  - [x] `gap` + `padding` 参与布局（左右留白不吞列宽）
  - [x] 初始布局后 `totalHeight` == 最高列高 + `padding.bottom`（旧版含末尾 `rowGap`，如实记录）
  - [x] 项高度变化（ResizeObserver）后触发重排
  - [x] `scrollToItem(index, {block:"start"|"center"|"end"})` 的 scrollTop
  - [x] `items` 置空后 `totalHeight` 归零、无残影
  - 产物：`packages/vane-waterfall/test/fixtures/layout-snapshots.json`（生成脚本 `.workbuddy/scratch/wf-baseline/gen-snapshots.mjs`）

**验收门 W0**：✅ D1/D2/D3/D4 结论已写入 07 · 5.5；✅ 8 组快照落盘可复现。

---

## W1 · 包骨架 + Core 迁入

### W1.1 骨架与依赖

- [ ] `packages/vane-waterfall/` 目录（复制 `packages/templates/plugin-component` 骨架，与 lazy-image 同构）
- [ ] `package.json`：
  - [ ] `peerDependencies`: `vane-plugin-core: workspace:*`、`react >=16.8`、`react-dom >=16.8`
  - [ ] `dependencies`: 空（**删掉 `localforage`**，全库 0 引用）
  - [ ] `devDependencies`: `@vane/{build-config,eslint-config,tsconfig,vitest-config}`、react 18、vite 5、vitest 2、`vane-lazy-image@workspace:*`（仅 demo 用）
  - [ ] `vane.sizeBudgetKb: 25`、`vane.coreSizeBudgetKb: 12`
  - [ ] `files: ["dist"]`、`sideEffects: false`、`scripts` 对齐 lazy-image（`dev/build/build:demo/typecheck/test/lint/sync:exports`）
- [ ] `tsconfig.json` / `tsconfig.lib.json` / `vite.config.ts`（lib 模式 + dts）/ `vitest.config.ts` / `eslint.config.js`

### W1.2 Core 迁入

- [ ] `src/components/WaterfallPlugin/WaterfallCore.tsx` 从旧仓迁入（836 行），改动仅限：
  - [ ] import 路径（`../plugins/types` → 本地 `./plugins/types`）
  - [ ] 移除对旧 `WaterfallPluginContext` 的耦合（Core 只依赖 `ItemPosition` / `LayoutInfo` / `ViewportInfo` 三个纯类型）
  - [ ] `containerRefExternal` / `itemRefsExternal` 双通道保留（`withPlugins` 靠它拿容器与项 DOM）
  - [ ] 清理路径核对（不新造改动，只补断言）：容器级 observer 在 `useEffect` 清理里 disconnect（L640），**项级** observer 依赖 ref 回调传 `null` 时 disconnect（L788–L795），整树卸载时 React 会以 `null` 回调 → 需在 W1.4 加一条断言锁住，避免后续改动悄悄漏掉
- [ ] 若 D1-A：在 `calculateLayout` 内插入三个执行点（`calculateColumns` → `calculateColumnWidth` → 逐项 `calculateItemPosition`），返回值优先于 props
- [ ] 若 D2-A：新增 `src/components/WaterfallPlugin/virtualize.ts`，Core 只渲染命中范围 + overscan，`totalHeight` 仍由完整布局算出

### W1.3 领域类型

- [ ] `src/components/WaterfallPlugin/plugins/types.ts` 重写：
  - [ ] `WaterfallPluginContext<T>` = `PluginContext<WaterfallCoreProps<T>, WaterfallData>` & 领域字段（items / layout / itemPositions / viewport / visibleRange / isLayouting / isLoading / hasMore / error / networkInfo / sharedData / relayout / scrollTo* / measureItem）
  - [ ] `WaterfallPluginHooks` 按 D3 **只留 20 个**（其余删除，不保留注释掉的死代码）
  - [ ] `WaterfallPlugin<T>` / `PluginCreator` 从 `vane-plugin-core` 派生（`Plugin<TProps> & { hooks: WaterfallPluginHooks<T> }`）

### W1.4 单测（第一批）

- [ ] `test/core-layout.test.ts`：把 W0.6 的 6 个快照断言搬进来（happy-dom）
- [ ] `test/core-resize.test.ts`：ResizeObserver 触发重排（mock RO）
- [ ] `test/core-ref.test.ts`：`relayout` / `scrollToItem` / `measureItem` / `getLayoutInfo` 契约

**验收门 W1**：`build` 产出 `dist` 且 `exports` 有效；`typecheck` 0 错；`test` ≥9 通过；`core` gzip ≤ 12KB；旧仓 6 个行为快照在新 Core 上全绿（等价性成立）。

---

## W2 · 插件系统替换（删 1600 行，接内核）

- [ ] **W2.1 删除** `src/components/WaterfallPlugin/plugins/{PluginBus.ts,PluginManager.ts}`（保留并重写 `types.ts` / `withPlugins.tsx`）
- [ ] **W2.2 重写 `plugins/withPlugins.tsx`**（参照 lazy-image 同名文件）：
  - [ ] `usePluginRuntime({ plugins, props, containerRef, extendContext })`
  - [ ] `extendContext` 注入：`items` / `layout`（快照）/ `itemPositions` / `viewport` / `visibleRange` / 各状态位 / `itemRefs` / `getItemRef` / `sharedData: base.shared` / `networkInfo` / `scrollTo*` / `relayout` / `measureItem`
  - [ ] 把 Core 的 props 回调（onMount / onUnmount / onBeforeLayout / onLayout / onLayoutComplete / onItemMount / onItemUnmount / onItemEnter·LeaveViewport / onScroll / onResize / onReachBottom / onItemClick）桥接成 `executeHook` 调用
  - [ ] **渲染插槽**：`renderOverlay` 走 `composeSlots`，且**必须落在滚动容器内部**（单测锁）
  - [ ] **item 包装管道**：`transformProps` 里把 `props.renderItem` 逐层包裹，替代旧 `renderItemWrapper`
  - [ ] `enableDebug` → Core `debug`
- [ ] **W2.3** 确认 `priority` **不做反转适配**（与旧版同向），删掉任何 `1000 - x` 残留
- [ ] **W2.4** 给数据类 4 个插件定序（写进各自 `doc.json` 的 notes）：`Filter 40 > Sort 30 > Search 20 > Pagination 10`
- [ ] **W2.5** 单测（第二批）：
  - [ ] `transformProps` 按 priority 链式生效，且数据类组合结果与「Filter→Sort→Search→Pagination」一致
  - [ ] 钩子返回 `false` 中断链；返回其他值短路
  - [ ] `onMount` 返回的函数在 `clear()`（卸载）时**被执行一次**
  - [ ] `renderOverlay` 输出在 `container.contains()` 之内
  - [ ] 单个插件抛错不影响其他插件（内核沙箱 / ErrorBoundary）

**验收门 W2**：旧 `plugins/PluginBus.ts` / `PluginManager.ts` 已删；`typecheck` 0 错；`test` ≥16 通过；07 文档 4.1–4.7 的每一条差异都有对应断言或说明。

---

## W3 · 27 个插件分批迁入

> 统一动作（每批都要做）：换 import → 补 `doc.json`（name / description / since / tags / config / example / features / useCases / notes）→ `index.ts` 挂 `.meta` → 桶文件按 5 组注释。

### W3.1 A 级 14 个（纯管道，可脚本批量）

- [ ] 写 `scripts/migrate-waterfall-plugins.mjs`（参照 `scripts/migrate-plugins.mjs`）：路径改写 / `WaterfallPlugin` → 领域类型 / CRLF→LF
- [ ] layout 5：ResponsiveColumns、AutoColumn、Alignment、Gap、FixedHeight（若 D1-A 则改走布局钩子，否则保持 transformProps）
- [ ] perf 4：Throttle、DebounceLayout、ReducedMotion、Transition
- [ ] data 5：Filter、Sort、Search、Pagination、InfiniteScroll（**固定 priority**）
- [ ] 每个插件 `doc.json` 的 `config` 从源码类型 + 工厂默认值抽取，一句话描述人工校对

### W3.2 B 级 11 个（逐个，需改造）

- [ ] A11y、DragReorder（item 包装管道；DragReorder 补 `onReorder` 真回调，不再只记录 from/to）
- [ ] ClickAnalytics、HeatmapAnalytics、Grouping、StickyHeader（overlay 迁插槽；**默认 `showOverlay: false`**）
- [ ] Bookmark、StatePersistence、URLSync（SSR 安全 + 首帧注入只做一次）
- [ ] ScrollAnchor（复核 onMount 返回值是否被当清理函数）
- [ ] Recycle（若 D2-A 采纳虚拟化，doc.json 写明「与 virtualize 不要同开」）

### W3.3 C 级 2 个（按决策）

- [ ] PinItem：D1-A → 接入布局钩子并处理「置顶项是否计入列高」；D1-B → 删除目录
- [ ] VirtualWaterfall：D2-A → 逻辑搬进 `virtualize.ts` 后删除插件；D2-B → 拆到 `presets/virtualized`；D2-C → 删除

### W3.4 桶文件与配方

- [ ] `custom-plugins/index.ts`（27 个导出，按 layout / perf / data / interaction / ui 分组注释）
- [ ] `presets/photo-feed`（ResponsiveColumns + Gap + Transition + ReducedMotion + InfiniteScroll + A11y）
- [ ] `presets/product-feed`（AutoColumn + FixedHeight + Filter + Sort + Pagination + ClickAnalytics）
- [ ] `presets/dashboard`（Throttle + DebounceLayout + Recycle + StatePersistence + Bookmark）

### W3.5 单测（第三批）

- [ ] 每个插件：工厂返回 `{ name, hooks, meta }`、`doc.json` 可解析、`config` 默认值正确（27 × 1 断言，可表驱动）
- [ ] 3 个端到端：数据管线（Filter+Sort+Pagination）、布局（ResponsiveColumns+Gap）、交互（Grouping+StickyHeader overlay 位置）

**验收门 W3**：`doc.json` **27/27**；桶文件 27 导出、5 组无遗漏；`docs:plugins` 生成 27 行；`typecheck` 0 错；`test` ≥35 通过；完整入口 gzip ≤ 25KB；**27/27 插件在 demo 中至少被装配一次**（覆盖闸门，脚本化）。

---

## W4 · demo 重建（D4-B）— 已完成

- [x] **W4.1 骨架**：`demo/index.html`（内联 SVG favicon + 首屏底色内联防闪白）+ `demo/vite.config.ts`（`createDemoConfig`，root 为包根、base `./`）
  - [x] **包名 alias**：`vane-waterfall` / `/core` / `/plugins` / `/custom-plugins/*` 指回 `src`，让场景源码按**消费者视角**写 import，页面上可直接复制到真实项目
  - [x] tsconfig `paths` 同步（仅服务 demo，`src` 自身不 import 包名，不影响库构建与 d.ts）
  - [x] HashRouter + 三页（`/` 总览、`/plugins` 工坊、`/scenarios` 场景库）+ 页面级 `PageBoundary`（lazy 页抛错时把堆栈摊在页面上，而不是整页空白）
- [x] **W4.2 插件工坊**（`#/plugins`）：
  - [x] `import.meta.glob("/src/custom-plugins/*/doc.json")` 驱动 5 组勾选；`priority` 用 `?raw` 从源码正则读，避免手抄
  - [x] 勾选即实时装配（`useMemo` 按勾选集合缓存组件类型，否则每勾一下就整块重挂载）+ 通栏生成可复制代码
  - [x] 冲突提示 4 条：AutoColumn↔ResponsiveColumns / Transition↔ReducedMotion / InfiniteScroll↔Pagination / Recycle↔virtualize
  - [x] 点插件名展开 doc.json：配置表 + 能做/适合/注意
- [x] **W4.3 场景库**（`#/scenarios`），一卡两栏 + 下方通栏代码：
  - [x] **13 个场景**（原计划 12，多一个是性能实验卡）：摄影错落流 / 三列图文（置顶）/ 商品筛排翻 / 视频等高网格 / 指标卡看板 / 书签墙拖拽 / 资讯搜索筛排 / 千项虚拟化 / 分组壁纸墙 / 竖屏短视频 / 任务看板 / 长文锚点 / 回收+防抖+热力
  - [x] **完整版源码**用 `?raw` 读同一个 `.tsx`（同源，杜绝文档漂移）
  - [x] **最小装配版**由 `meta.plugs` + `meta.props` 现场生成（`scenarios/minimal.ts`），不是另写一份
  - [x] `scripts/verify-scenarios.mjs` 闸门：id↔文件名、必填字段、plugs↔源码**双向**核对、插件名合法性、编号连续、侧栏计数一致、覆盖率提示
- [x] **W4.4 体检（替代 CDP 脚本）**：页面内 `#/scenarios → 体检全部`，`demo/src/lib/audit.ts` 对全部 `.vane-waterfall` 跑几何断言
  - [x] 断言：项越界 / 负坐标 / 零尺寸 / **两两重叠（含跨列）** / `scrollHeight` 是否盖得住内容底边
  - [x] 结果：**13 张卡 · 0 命中**（可复现：点一次按钮即可）

**验收门 W4**：`vite build --config demo/vite.config.ts` 通过（188 modules，1.5s）；13 个场景体检 **0 命中**；每卡有代码块 + 复制按钮（clipboard API 失败时退回 `execCommand`）。

**与计划的偏差（有意）**：
1. **不引 CDP 截图脚本**：截图解决不了「卡片叠在一起」这类问题，几何断言才解决；改成页面内体检，用户随时可复跑。
2. **未归档 `tasks/assets/wf-*.png`**：截图是过程证据，无法复跑；用「体检面板 + 本文件记录的数字」替代，更能反映真实状态。
3. **场景 13 个而非 12**：计划里的「后台：看板卡片流（Throttle + Recycle + virtualize）」与「移动端弱网（DebounceLayout + ReducedMotion）」合成不了（Recycle 与 virtualize 互斥），拆成「千项虚拟化」与「回收+防抖+热力」两张，插件覆盖因此到 26/26。


---

## W5 · 文档 / README / 体积 / 发布 — 已完成

- [x] **W5.1** `docs/components/vane-waterfall/` 四件套（替换「迁移中」占位）：
  - [x] `index.md`：卖点 + 安装 + 30 秒示例 + 导入体积表 + 插件速览 + 1.x 迁移差异表 + 演示站入口
  - [x] `api.md`：`WaterfallCoreProps`（数据/布局/性能/管线键/回调）+ `WaterfallCoreRef` 全方法 + 插件 context 全字段 + **20 个钩子分四类**（含返回值语义）
  - [x] `plugins.md`：5 组 × 26 插件，逐个给 priority、配置表、坑位说明，末尾「谁和谁不能一起装」速查
  - [x] `recipes.md`：3 个配方 + 三条组合经验（决策者唯一 / 渲染成本分档）+ 调参 SOP（6 步定位）
- [x] **W5.2** README：`node scripts/sync-readme.mjs` 生成（6.4KB），首屏为徽章 + 安装 + 30 秒上手；删掉旧 README 的「迁移中 / 作为工程示例运行」口径
- [x] **W5.3** `docs/guide/decisions.md` 补 **ADR-8/9/10**：钩子面收口 48→20、虚拟化归属 Core、priority 同向
- [x] **W5.4** `.changeset/vane-waterfall-200.md`（major）：8 条破坏性变更 + 6 条新增/修复
- [x] **W5.5** `npm pack --dry-run`：**225 files / 69.7KB**，非 dist 文件只有 `README.md` + `package.json`
- [x] **W5.6** 回归：`eslint` **0 error**（131 warning，均为 `no-explicit-any`，与 lazy-image 的 312 条同源）；`tsc --noEmit` **0 错**；`vitest` **5 files / 33 用例**；`check-packages` waterfall **10.5KB / 预算 14KB**；`vitepress build` **通过**（13.6s）

**验收门 W5**：`check-packages` 除既有 `vane-lazy-image` 26.9KB 超预算外全绿；`docs:build` 通过；README 由 docs 同步生成；pack 干净；changeset 就位。

**顺带修掉**：`StatePersistencePlugin` / `URLSyncPlugin` 里 3 处 `@ts-ignore` 改成一次性 `as unknown as Record<string, unknown>` 取值（lint 从 3 error → 0）。


---

## 验收门汇总

| 阶段 | 硬指标 |
| --- | --- |
| W0 | D1/D2/D4 结论落纸 + 6 个行为快照可复现 |
| W1 | build 通过 / typecheck 0 / test ≥9 / core ≤12KB gzip |
| W2 | 自建插件系统已删 / test ≥16 / 7 条差异有断言 |
| W3 | doc.json 27/27 / test ≥35 / 入口 ≤25KB / 27 插件覆盖 |
| W4 | demo build 通过 / 场景体检 0 命中 / 13 场景带两份源码 |
| W5 | check-packages + docs:build 全绿 / pack 干净 / changeset 就位 |

---

## 执行记录（W1–W4 实测，2026-10-26）

| 阶段 | 计划指标 | 实测 |
| --- | --- | --- |
| W1 | typecheck 0 / test ≥9 / core ≤12KB | typecheck **0 错**；等价性 8 组快照全绿（`test/core-layout.test.ts`）；`WaterfallCore` **4.68KB gzip** |
| W2 | 自建插件系统已删 / test ≥16 | `PluginBus.ts`、`PluginManager.ts` 未迁入（新包不含）；装配层含 7 条差异断言 |
| W3 | doc.json 27/27 / test ≥35 / 入口 ≤25KB | doc.json **26/26**；测试 **5 files / 33 用例**全绿；默认入口导入图 **10.47KB gzip**；`sync-exports` 生成 34 个子路径 |
| W4 | demo build 通过 / 体检 0 命中 / 两份源码 | build 通过（188 modules / 1.5s）；**13 卡 0 命中**；13 份 `?raw` 完整源码 + 13 份现场生成的最小装配 |

遗留：
- `check-packages` 报 `vane-lazy-image` 默认入口 26.9KB > 25KB（既有问题，与本次迁移无关，留待 lazy-image 单独处理）。
- 插件总数按 26 计（27 个目录中 `VirtualWaterfallPlugin` 逻辑下沉 Core 后删除；文档里提到"27"是迁移前的口径）。


---

## 不做清单（明确排除，避免范围蔓延）

- ❌ 不迁旧 `plugins/`（`PluginBus` / `PluginManager` / 自建 `withPlugins`）——1600 行全部由内核替代
- ❌ 不迁 28 个死钩子（`calculateVisibleRange` / `onLoadMore` / `filterItem` / `sortItems` / `searchItem` / `renderContainer` / `renderEmpty` / `renderLoadingMore` / `renderError` / `transformItem` …）
- ❌ 不迁 `renderContainer`（0 插件使用）
- ❌ 不保留 `localforage` 依赖（0 引用）
- ⚠️ ~~不复刻旧 35 个 demo 页（改为工坊 + 场景库）~~ —— **已修正，见文末「W6 补做」**：逐项视角不能丢，最终三视角并存（34 页逐项示例 + 工坊 + 13 场景）
- ❌ 不做 priority 反转适配（旧新版同向，照抄 lazy-image 会引入 bug）
- ❌ 不在本阶段动 `vane-card` / `vane-file-preview`（属 `tasks/02` 的 P2 其余两条）

---

## 依赖与并行

```
W0（决策）
  └─ W1（骨架 + Core）──┬─ W1.4 快照等价性闸门
                        └─ W2（插件系统替换）
                              └─ W3（27 插件）──┬─ W3.4 桶文件/配方
                                                └─ W4（demo：依赖桶文件与 doc.json）
                                                      └─ W5（文档/发布）
```

- W3.1（A 级 14 个）与 W3.4 的 presets 可并行；W3.2 建议在 W2 验收通过后再动，避免「钩子面还没定就改插件」。
- W4.3 场景库可与 W3.2 交叉进行（场景只依赖已迁好的插件）。
- 每个阶段结束都跑一次 `pnpm verify`（根目录），把回归锁在阶段内。

---

## W6 补做（2026-10-26，计划外）：逐插件示例 34 页

W4 当初把旧仓 35 个 demo 页整体砍掉，只留「工坊（勾选组合）+ 场景库（组合版式）」。实测下来这个取舍有漏洞：**组合视角强了，单点视角没了** —— 想单独看「FixedHeight 的 itemHeight 从 120 调到 260 会怎样」「Ref 的 13 个方法各自返回什么」时，工坊里只能勾一个插件共用同一块预览，参数没法逐个拖，也没有对应源码。

于是按旧仓清单（基础功能 / 高级功能 / 插件功能三组）补回逐项示例，并做了三点升级：

1. **数据驱动而非 34 份样板**：每页只写 `meta`（含 plugs / props / controls / note）+ 一个装配函数，页面骨架、控件、日志、代码块全部由 `demos/DemoPage.tsx` + `stages/feed.tsx` 提供。26 个插件页平均 40 行。
2. **拖控件 = 改代码**：`meta.props` 与 `plugs[].cfg` 支持 `{{key}}` 占位，用控件当前值替换 —— 把间距拖到 24，下面的装配代码就变成 `columnGap: 24`。
3. **两道闸门**：`verify:scenarios` 扩展到示例（slug ↔ 文件名、plugs ↔ 源码双向、26 个插件必须每个都有一页）；新增 `scripts/audit-demos.mjs` 用真浏览器对 37 个页面做几何体检（8 个页面 × 34 页 + 3 个其它页 → 全 0 命中）。

页面清单：3 基础（基础示例 / 自定义列数 / 自定义间距）+ 3 高级 API（Ref 方法 / 生命周期事件 / 高级配置）+ 28 插件（26 插件 + 2 个虚拟化内核能力页）。

**过程中修掉的真 bug**

- `DemoPage` 用 `useState(() => initialCfg(meta))` 初始化控件值，但路由切换时同一组件类型被复用 → 从第 2 页起控件值还是上一页的（显示 `undefined`）。修法：`<DemoPage key={entry.meta.slug} />`。
- 侧栏跨组跳转时当前组不展开，导航看起来「跳丢了」。修法：`activeGroup` 变化时把该组展开。
- 把 `searchQuery` 这类高频输入写进「重建组件」的 key 里，会让每敲一个字整块瀑布流重挂载（输入框失焦、滚动归零）。修法：`pluginKeys` 显式排除，只让真正影响装配的键参与重建。

**验收**

| 项 | 结果 |
| --- | --- |
| `tsc --noEmit` | 0 错 |
| `eslint` | 0 error（172 warning，均为既有 `no-explicit-any` / `react-refresh`） |
| `vitest` | 5 files / 33 用例通过 |
| `verify:scenarios` | 13 场景 + **34 示例**；插件页覆盖 **26 / 26** |
| `audit:demos` | **37 页 · 0 命中**（越界 / 负坐标 / 零尺寸 / 两两重叠 / 总高不足） |
| `vite build`（demo） | 263 modules，`index` 128 KB gzip（含 34 页与源码字符串） |
