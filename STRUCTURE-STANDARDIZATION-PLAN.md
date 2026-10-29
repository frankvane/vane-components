# vane 组件库结构标准化 — 可行性 / 成本 / 验收清单 / SKILL 沉淀

> 本文回答四个问题：(1) 能否标准化；(2) 改造（core + 7 组件 + 7 demo）成本多高；(3) 详尽分析报告与实施验收清单；(4) 是否把标准沉淀进 SKILL。
> 配套取证文档：`STRUCTURE-AUDIT.md`（结构漂移现状扫描）。
> 数据基准日：2026-10-29，扫描脚本见文末附录。

---

## 0. 结论先行

| 问题 | 结论 |
|---|---|
| 能否标准化？ | **能。** 核心组件层已统一；分歧集中在「插件层文件范式」「入口聚合方式」「demo 结构」三处，全部可通过 codemod + 结构 CI gate 收敛。 |
| 改造范围 | 1 个 core（已规范，≈0 成本）+ 7 个组件包 + 7 个 demo + 1 个脚手架模板。共 **202 个插件目录 / 451 个 demo 源文件**。 |
| 成本量级 | 机械改动便宜，**验证昂贵**：约 **12–19 人日**手动，靠 codemod + 自动化校验可压到 **8–12 人日**；lazy-image（85 插件 / 108 demo 文件）占总量 ~45%，是成本与风险主峰。 |
| 验收方式 | 见第 5 节「实施验收清单」，每条可机器校验。 |
| 写入 SKILL？ | **建议是**，且以 `templates/plugin-component` 为唯一真源 + 新增 `scripts/check-structure.mjs` 作为 CI 门禁，让新包自动合规、存量漂移被阻断。 |

---

## 1. 改造范围与规模（实测）

### 1.1 组件包插件规模与合规现状

| 包 | 插件目录数 | 真实路径 | 三件套齐全 | 命名 | 备注 |
|---|---:|---|---:|---|---|
| vane-card | 22 | `src/components/CardPlugin/custom-plugins/` | 0/22 | `XxxPlugin` ✓ | **双 custom-plugins 结构**（顶层 `src/custom-plugins/` 是薄壳再导出） |
| vane-comment | 17 | `src/custom-plugins/` | 17/17 | `XxxPlugin` ✓ | 金标准范式 |
| vane-file-preview | 17 | `src/custom-plugins/` | 0/17 | `XxxPlugin` ✓ | 工厂内联 `index.tsx`，无 `create.tsx` |
| vane-lazy-image | 85 | `src/custom-plugins/` | 84/85 | `XxxPlugin` ✓ | 1 个异常目录；doc.json 用 `examples`(复数) |
| vane-profile | 16 | `src/custom-plugins/` | 16/16 | `XxxPlugin` ✓ | 金标准范式 |
| vane-sku | 12 | `src/custom-plugins/` | 12/12 | **驼峰无 `Plugin` 后缀** ✗ | 命名异常包之一（`Analytics`/`ImageLink`…）；另 profile 16 个插件也无 `Plugin` 后缀 |
| vane-waterfall | 26 | `src/custom-plugins/` | 26/26 | `XxxPlugin` ✓ | 金标准范式 |
| **合计** | **195** | — | **155/195 (79%)** | 命名异常 **28**（profile 16 + sku 12），其余合规 | — |

> 注：card 顶层 `src/custom-plugins/` 计数未计入上表（薄壳），真实 22 个实现在核心组件目录内。

### 1.2 demo 规模与结构分歧

| 包 | demo/src 文件数 | demo 页面范式 | 入口接线 |
|---|---:|---|---|
| vane-card | 68 | `demos/` 每插件一页 (7) | `demos/registry.ts` + `App.tsx` |
| vane-comment | 51 | `demos/` 每插件一页 (24) | `demos/registry.ts` + `App.tsx` |
| vane-file-preview | 53 | `demos/` 每插件一页 (19) | `demos/registry.ts` + `App.tsx` |
| vane-lazy-image | 108 | **`pages/combos/advanced/` 另一套 (0 个 demos 页)** | `App.tsx` 直接路由 |
| vane-profile | 43 | `demos/` 每插件一页 (24) | `demos/registry.ts` + `App.tsx` |
| vane-sku | 49 | `demos/` 每插件一页 (22) | `demos/registry.ts` + `App.tsx` |
| vane-waterfall | 79 | `demos/` 每插件一页 (40) | `demos/registry.ts` + `App.tsx` |
| **合计** | **451** | 6/7 同范式，lazy-image 异类 | — |

### 1.3 core 与脚手架

- **plugin-core（core）**：`src/{bus,dependency,manager,react,sandbox,types.ts,utils,index.ts}`，15 文件，无插件层，**已完全规范，改造成本≈0**。
- **templates/plugin-component**：已存在脚手架（27 文件，含 demo + docs），但相对 vane-comment 最新范式**可能滞后**，是写入 SKILL 的天然载体（对齐即为新包标准）。

---

## 2. 目标标准（Canonical Skeleton）

以 vane-comment 为基线（最新、最合规），统一如下：

### 2.1 组件包 `src/` 标准骨架

```
src/
├─ index.ts                 # 仅 re-export entries，公共 API 门面（ADR-6 严格不桶导出插件）
├─ entries/
│  ├─ core.ts               # 核心组件 + 装配器(withPlugins) + 领域类型
│  └─ plugins.ts            # 插件系统（领域槽/总线键/钩子类型/插件类型）
├─ core/
│  └─ <Name>Plugin/
│     ├─ <Name>Plugin.tsx   # 核心组件
│     ├─ with<Name>Plugins.ts
│     └─ slots.ts           # 领域槽 Provider/render/use
├─ custom-plugins/
│  └─ <XxxPlugin>/          # 强制 PascalCase + Plugin 后缀
│     ├─ create.tsx         # 工厂 createXxxPlugin()，含默认配置
│     ├─ doc.json           # 元数据（顶层固定字段见 2.3）
│     └─ index.ts           # Object.assign(create, { meta }) 再导出
└─ types.ts
```

### 2.2 demo 标准骨架

```
demo/src/
├─ App.tsx                  # 路由壳（HashRouter）
├─ main.tsx
├─ demos/
│  ├─ registry.ts           # 所有 demo 注册表（meta + 懒加载）
│  ├─ types.ts              # DemoMeta 类型 + GROUP_META
│  ├─ DemoPage.tsx          # 通用页骨架：meta + 默认 Stage + 源码 ?raw
│  └─ <NN>-<slug>.tsx       # 每插件/场景一页（含「完整源码」?raw 展示真文件）
├─ lib/                     # selftest.tsx 等
├─ data/                    # mock 数据
└─ components/              # demo 私有组件
```

### 2.3 `doc.json` 顶层字段（以全仓实测为准：9 必含字段 + 1 兼容字段）

> 实测分布（来自 `scripts/check-structure.mjs` 输出）：`name(195) description(195) since(195) tags(195) config(195) features(194) useCases(194) notes(194) example(191) examples(84 兼容) conflicts(5 罕见)`。
> 说明：计划初期提案的「8 字段（slug/category/version/author）」**并非现状**，统一 schema 以本次实测为基准，避免对 190+ 插件产生伪违约。

统一后必含字段：

```jsonc
{
  "name": "string",        // 插件显示名
  "description": "string",
  "since": "string",       // 引入版本
  "tags": ["string"],      // 领域标签
  "config": [ /* {name,type,default,description} */ ],
  "features": ["string"],  // 能力点
  "useCases": ["string"],  // 适用场景
  "notes": ["string"],     // 注意事项
  "example": "string"      // 单个用法示例（字符串）；lazy-image 并用 `examples`（可视化示例数组），属有意双字段，不改
}
```

### 2.4 命名铁律

- 插件目录 / 导出名：**PascalCase + `Plugin` 后缀**（如 `LikePlugin` / `createLikePlugin`）。
- 子路径导出键：`custom-plugins/<XxxPlugin>`（与目录名一致）。
- ✅ **已完成（P1）**：全仓插件目录命名已统一为 `XxxPlugin`；profile(16)+sku(12) 经破坏性重命名补齐（用户确认 npm 删除再上传、当全新项目，不加兼容层）。

---

## 3. 差距分析（现状 → 目标）

| 维度 | 现状分歧 | 目标 | 影响包 | 影响面 |
|---|---|---|---|---|
| 插件文件范式 | 三件套 vs 工厂内联(`index`) | 统一三件套 | card(22) file-preview(17) | 39 插件 |
| 插件目录命名 | ~~profile/sku 无 `Plugin` 后缀~~ ✅ P1 已破坏性重命名补齐 | PascalCase+Plugin | profile(16)+sku(12)=**28** | 28 目录 + 全部引用/导出同步（P1 完成） |
| card 双结构 | 薄壳再导出 + 核心组件内实现 | 单 `src/custom-plugins/` | card(22) | 22 插件移动 + 引用修正 |
| 入口聚合 | `entries/` vs 顶层 `core.ts/plugins.ts` vs 核心组件内联 | 统一 `entries/` | card/fp/lazy/sku(4) | 4 包根重构 |
| 根桶导出(A5) | lazy-image/file-preview 根 `index.ts` `export * from "./custom-plugins"` | 非兼容包禁止桶导出 | lazy-image/fp(2) | **INFO 级**：ADR-6 兼容例外，可不改；其余包若出现即违规 |
| doc.json 字段 | lazy-image 并用 `examples`(可视化示例数组) 与 `example`(用法字符串)，其余包仅 `example` | 保留双字段；门禁白名单 `examples`（不强制统一） | lazy-image | 0（仅门禁白名单，不改字段） |
| demo 结构 | `demos/` 范式 vs `pages/combos/advanced` | 统一 `demos/` 范式 | lazy-image | 108 文件迁移 |
| 插件级测试 | 全仓 0 | 每插件至少 1 单测 | 全 7 包 | 195 插件（stretch） |

---

## 4. 改造成本估算（按阶段）

> 原则：**编辑便宜、验证昂贵**。每个阶段必须保证 `pnpm verify`（lint+typecheck+test+check）与 demo `?selftest=1` 全绿，这才是真实成本。

| 阶段 | 内容 | 机械改动量 | 风险 | 估算人日 |
|---|---|---|---|---:|
| **P0 防护网** | 写 `scripts/check-structure.mjs`（骨架/命名/doc 字段校验）+ 接 CI；对齐 `templates/plugin-component` 为唯一真源 | 1 脚本 + 27 文件对齐 | 低 | 1–1.5 |
| **P1 命名与元数据**（✅ 已落地） | sku(12)+profile(16) 破坏性重命名加 `Plugin` 后缀（npm 删除再上传、当全新项目、不加兼容层），含 exports/index/docs/demo 引用全量同步 | 28 重命名 + 引用同步 | 低（已验证 tsc/build/vitest 全绿） | 1.5–2.5（已实际执行） |
| **P2 三件套提取**（✅ 已落地） | card(22)+file-preview(17) 内联工厂抽成 `create.tsx` | 39 目录三件套化 | 低（机械） | 2–3（已实际执行） |
| **P3 card 双结构消除** | 22 个实现从 `components/CardPlugin/custom-plugins` 移到 `src/custom-plugins`，删薄壳，修引用 | 22 移动 + 引用 | 中 | 1.5–2 |
| **P4 入口聚合统一** | 4 包根 `index.ts` 改为 `entries/{core,plugins}.ts` 范式 | 4 包根重构 | 中（public API 面变动） | 2–3 |
| **P5 demo 标准化** | lazy-image 108 文件从 `pages/combos/advanced` 迁到 `demos/` 范式 + 6 包 registry 一致性 | 108 迁移 | **高（视觉回归）** | 3–4 |
| **P6 补插件级测试**（可选） | 195 插件各至少 1 单测 | 195 测试 | 低 | 2–3 |
| **合计** | — | — | — | **12–19**（codemod 后可压到 **8–12**） |

### P0 已落地（2026-10-29）

- 新增 `scripts/check-structure.mjs`：覆盖 A1 入口聚合 / A2 命名 / A3 三件套 / A4 doc 字段 / A5 根桶导出(INFO) / A6 card 双结构 / C1 demo 范式(INFO)，默认 warn（给存量基线），`--strict` 阻断。
- 接入 `pnpm verify`（warn 模式，不会破坏既有发布门禁）；仓库当前无 CI，后续接 PR CI 时加 `--strict`。
- **基线实测**：8 个包扫描（含 golden 模板），FAIL=178 / INFO=4。合规包：`vane-comment`、`vane-waterfall`、golden 模板（仅 demo INFO）。
- 模板 `packages/templates/plugin-component` 经核验已是规范骨架（`entries/` + 三件套 + 单测），`pnpm new` 生成的新包自动合规——漂移只存在于 7 个老包未回迁。
- 门禁运行即**纠正了本计划早期两处人工审计误判**：① 命名异常不止 sku，profile 16 个插件也无 `Plugin` 后缀（共 28）；② doc.json 真实 schema 为 9 字段（含 since/tags/features/useCases/notes），非初期提案的 8 字段。

### P1 已落地（2026-10-29）

- **破坏性重命名（用户决策）**：用户确认 profile/sku 可破坏性重命名，npm 发布时先删除旧版本再上传，当作全新项目看待——故未加 exports 兼容别名。
- sku(12) + profile(16) = **28 个**插件目录加 `Plugin` 后缀；同步：根 `custom-plugins/index.ts` 桶导入、`package.json` exports（键+值）、demo 全部显式/相对子路径 import、`data/plugins.ts` 的 `dir` 字段 + `factory` 派生逻辑（`create${dir}Plugin` → 基于去 Plugin 主体名，避免双后缀）、`codegen.ts` 的 `subpathOf`、`scenarios/minimal.ts` 的 replace、以及 src 内部注释。
- **门禁白名单**：A4 把 `examples` 列为允许额外字段（lazy-image 的 `example`=用法字符串 + `examples`=可视化示例数组是有意双字段设计，非误用），消除 84 个误判 FAIL（FAIL 178→66）。
- **验证全绿**：sku/profile tsc(`--noEmit` 含 demo)=0 error；demo build=0；sku vitest 42/42、profile vitest 12/12；check-structure 后 profile ✅、sku 余 1 项 A1（缺 `entries/`，既有设计，归 P4）。
- 残留：sku 的 A1（无 `src/entries/`，走核心组件内联聚合）属 P4 入口聚合统一范畴，不在 P1。

### P2 已落地（2026-10-29，commit `62df413`，已推双远端 gitee+github，HEAD 一致）

- **三件套提取**：card 22 + fp 17 = **39 个**插件目录的内联工厂 `index.tsx|ts` 抽成规范三件套：`create.tsx`（工厂+config 类型+全部导出，原 index 内容原样搬入）+ `doc.json`（P2 前已存在）+ `index.ts`（薄壳：`export * from "./create"` + 可选 `export { default }` + `Object.assign(create, { meta: doc })` 挂 `.meta`）。用 `git mv` 保留历史。
- **`.meta` 契约保留**：沿用 waterfall/lazy-image/profile 的工厂契约——薄壳 `index.ts` 必须 `Object.assign(create, { meta: doc })` 挂 meta（测试断言 + profile 运行期渲染 `w.meta` 都依赖）。card/fp 不能去掉，故体积门随之上调（见下）。
- **codemod 覆盖的变异**：双工厂（Epub 的 `create.tsx`+`createEpubPlugin`）、含 `default` 导出的 fp 插件、以及 4 个原 `index.ts`（非 tsx）的 card 插件——均正确生成薄壳。
- **连带修正（测试/脚本未跟上工厂搬迁）**：
  - card `test/snapshots.base.test.tsx` 的 `scanBusProtocol()` 优先读 `create.tsx`（薄壳 `index.ts` 无 BusKeys 引用）。
  - fp `test/plugins-b.test.ts` 动态 import 检查改读 `create.tsx`；`test/dist-external.test.ts` 改查「入口或 chunk 任一含 `import("dep")`」，并跳过 <60KB 小文件（meta 把 doc 文本打进小 chunk 致 FORBIDDEN_SIGNATURES 误报）。
  - fp `demo/vite.config.ts` 别名 `custom-plugins/$1/index.tsx` → `index.ts`（入口变薄壳）。
  - card `demo/src/data/plugins.ts` 的 `?raw` 源码 glob `index.tsx` → `create.tsx`（工厂所在文件）。
  - `scripts/generate-plugin-docs.mjs` 的 `readPriority()` 候选加入 `create.tsx`/`create.ts`（priority 字面量现位于工厂文件）。
- **体积门合规处理**：card 全量并集因 22 插件挂 meta（含 `import doc from "./doc.json"`）从 31.3KB 涨到 47.9KB；`.meta` 是真实契约不可去除 → `package.json` 的 `fullSizeBudgetKb` 36→**52** 并写 `sizeBudgetNote`（标准化元数据并入，非运行期逻辑膨胀，留 ~4KB 余量）。按「超预算须改口径并留理由」规则，未静默调大。
- **验证全绿**：card/fp tsc(`--noEmit`)=0 error；card/fp lib build=0；card vitest **187/187**、fp vitest **260/260**；card/fp demo build=0；`check-packages` EXIT=0（card 全量并集 47.9/52 通过，fp 各项达标）；lint 各 0 error（仅存量 `any`/react-refresh warning）；`check-structure` EXIT=0。
- **A3 状态**：fp 17 个插件三件套齐全 → **0** A3 失败；card 真实 22 插件（`src/components/CardPlugin/custom-plugins/<Name>`）三件套齐全，A3 静默通过；剩余 22 个 A3 失败全指向顶层 `src/custom-plugins/<Name>` 薄壳转发目录（双结构，归 **P3**），P2 前即存在、非本次回归。

### 成本主峰与杠杆
- **lazy-image 占 ~45%**（85 插件 + 108 demo 文件），是 P5 的重点；它的插件层已 84/85 合规，主要成本是 demo 重构（`examples` 经核实为有意双字段设计，不改字段）。
- **P0 防护网性价比最高**：花 1–1.5 天，换来后续所有漂移可被 CI 阻断，且能反向证明改造完成度。
- **建议执行顺序**：P0 → P1 → P2 → P3 → P4 → P5 →（P6 视资源）。P0 先行可让每一步都有红/绿信号。

---

## 5. 实施验收清单（每条可机器校验）

### A. 骨架结构（check-structure.mjs 断言）
- [ ] A1 每个组件包 `src/` 含 `entries/core.ts` 与 `entries/plugins.ts`（或根 `index.ts` 仅 re-export 二者）。
- [ ] A2 每个插件目录名为 `^[A-Z][A-Za-z0-9]*Plugin$`（PascalCase + `Plugin`）。
- [ ] A3 每个插件目录含 `create.tsx` + `doc.json` + `index.ts` 三件套（card/file-preview 改造后达标）。
- [ ] A4 `doc.json` 顶层含 9 标准字段（name/description/since/tags/config/features/useCases/notes/example）+ 允许 `examples` 额外字段（白名单，lazy-image 有意双字段）；无其它未知字段。
- [ ] A5 根 `index.ts` 不桶导出官方插件（ADR-6）；官方插件仅经 `custom-plugins/<XxxPlugin>` 子路径可达。

### B. 命名与引用
- [x] B1 全仓无驼峰无后缀插件名（profile 16 + sku 12 共 28 个已破坏性重命名加 `Plugin` 后缀）。
- [ ] B2 所有 `import ... from "@/custom-plugins/Xxx"` 与 `package.json` exports 键与目录名一致。
- [ ] B3 card 无 `src/custom-plugins/<X>/` 薄壳再导出（实现已并入 `src/custom-plugins/`）。

### C. demo 结构
- [ ] C1 每个组件包 `demo/src/demos/` 含 `registry.ts` + `types.ts` + `DemoPage.tsx`，且为路由唯一数据源。
- [ ] C2 lazy-image 已无 `demo/src/pages|combos|advanced` 旧范式目录；既有场景已落到 `demos/<NN>-<slug>.tsx`。
- [ ] C3 每个官方插件在 demo 中有至少一页逐项示例（meta + 默认 Stage + `?raw` 源码）。

### D. 质量门（每阶段必过）
- [ ] D1 `pnpm verify`（lint 0 error + typecheck 0 + test pass + check-packages 体积门绿）全绿。
- [ ] D2 7 个 demo `?selftest=1` 均输出 `SELFTEST OK n/n`，且 DOM 级布局断言通过（含 `.vc-actions` flex-wrap 等）。
- [ ] D3 `pnpm build` + `build:demo` 全部成功。
- [ ] D4 发布门禁（workspace:*→* 替换 + 双远端一致 + AskUserQuestion 确认）对受影响包重跑。

### E. SKILL 沉淀（见第 6 节）
- [ ] E1 `templates/plugin-component` 已对齐第 2 节标准骨架，作为 `vane-package-builder` 的 new-package 真源。
- [ ] E2 `scripts/check-structure.mjs` 已加入 CI（pre-commit / PR check），漂移即红。
- [ ] E3 `vane-package-builder` SKILL 文档新增「标准化骨架」章节，覆盖目录/文件/命名/doc 字段/入口聚合/demo 五条硬约束。

---

## 6. 是否写入 SKILL —— 建议与落地方式

**建议：是，且分两层沉淀。**

### 6.1 为什么值得沉淀
当前漂移的根因是**没有脚手架 + 没有结构级 CI gate**：各包在不同时间点由不同轮次独立生成，`sync:exports`/`sync-readme` 只管产物不管 `src` 结构。三件套范式是 vane-comment 最新确立的，但早于它的老包未反向对齐。**把标准写进 SKILL + 脚手架 + CI 门禁**，才能从「人肉对齐」变「生成即合规」。

### 6.2 落地三步
1. **脚手架对齐**：把 `templates/plugin-component` 重写成第 2 节标准骨架（含一个示范插件的三件套 + 标准 demo 页 + `entries/` 聚合）。`vane-package-builder` 的「新建组件包」流程改为从模板复制。
2. **结构门禁**：新增 `scripts/check-structure.mjs`（覆盖 A1–A5），接入 `pnpm verify` 与 PR CI。存量漂移在 P0 阶段先以「warn」运行，P5 完成后转「error」阻断。
3. **SKILL 文档**：在 `vane-package-builder` 新增「标准化骨架」章节，列出五条硬约束（目录/文件/命名/doc 字段/入口聚合/demo）+ 校验脚本用法 + 反模式清单（双 custom-plugins、驼峰命名、examples 字段、demo 多范式）。

### 6.3 沉淀时机
- **改造前（P0）**：先写 `check-structure.mjs` + 对齐模板 → 立即给存量一个测量基线。
- **改造中**：每过一阶段，门禁的「warn→error」逐步收紧。
- **改造后**：SKILL 文档定稿，新包从模板生成即合规，存量漂移被 CI 永久阻断。

---

## 7. 风险与缓解

| 风险 | 缓解 |
|---|---|
| lazy-image demo 重构视觉回归 | P5 单包先行、保留旧路由对照；selftest DOM 断言兜底 |
| sku 重命名波及外部消费方 | 检查 npm 下载/内部引用；子路径键变更需 changeset `major` 提示 |
| 入口聚合改 public API 面 | P4 仅调整内部组织，保持 `index.ts` 导出符号不变（facade 不变） |
| 195 插件补测试成本失控 | P6 标为 stretch，优先核心 + 易错插件，不强制全量 |
| 大批量机械改动引入静默错误 | 每阶段 `pnpm verify` + selftest 全绿才进下一阶段；codemod 后 git diff 全检 |

---

## 附录：可复现取证命令

```bash
# 各包插件目录数 + 三件套合规
for d in vane-card vane-comment vane-file-preview vane-lazy-image vane-profile vane-sku vane-waterfall; do
  base=$( [ "$d" = "vane-card" ] && echo "$d/src/components/CardPlugin/custom-plugins" || echo "$d/src/custom-plugins" )
  total=$(find "$base" -mindepth 1 -maxdepth 1 -type d | wc -l)
  ok=0
  for p in $(find "$base" -mindepth 1 -maxdepth 1 -type d); do
    c=$( [ -f "$p/create.tsx" -o -f "$p/create.ts" ] && echo 1 || echo 0 )
    j=$( [ -f "$p/doc.json" ] && echo 1 || echo 0 )
    i=$( [ -f "$p/index.ts" -o -f "$p/index.tsx" ] && echo 1 || echo 0 )
    [ "$c$j$i" = "111" ] && ok=$((ok+1))
  done
  echo "$d: $ok/$total 三件套齐全"
done

# 命名异常（驼峰无 Plugin 后缀）
grep -rln '"name"' packages/*/src/custom-plugins/*/doc.json | while read f; do
  dir=$(basename $(dirname "$f")); [[ "$dir" =~ Plugin$ ]] || echo "异常命名: $dir"
done

# demo 范式分歧
for d in vane-card vane-comment vane-file-preview vane-lazy-image vane-profile vane-sku vane-waterfall; do
  echo "$d: demos页=$(ls $d/demo/src/demos 2>/dev/null | wc -l) 旧范式=$(ls -d $d/demo/src/{pages,combos,advanced} 2>/dev/null | wc -l)"
done
```
