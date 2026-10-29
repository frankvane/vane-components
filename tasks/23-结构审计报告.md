# vane-components 组件包结构标准化审计与统一提案

> 调查日期：2026-10-29  
> 范围：`packages/` 下 7 个发布包 —— vane-card / vane-comment / vane-file-preview / vane-lazy-image / vane-profile / vane-sku / vane-waterfall  
> 方法：基于源码目录扫描与抽样取证（命令可复现，见附录），非主观判断  
> 结论先行：**核心组件层高度统一，乱在"插件层"与"组织层"；三件套范式仅 3/7 包遵守（45/194 插件），其余 149 个插件（77%）不遵循。**

---

## 1. 背景与目标

我们宣称这是一套"标准化组件库"，但各包的 `src` 目录、文件组织、插件范式并不一致。这种不一致会带来真实成本：

- **复用成本高**：消费方导入路径不统一（`vane-card/plugins` vs `vane-comment/entries/plugins`）。
- **文档/工具失效**：`generate-plugin-docs`、`sync:exports` 等脚本依赖统一结构，结构漂移会导致生成物残缺或错位。
- **agent/协作不可预期**：任何新组件或新包都"看哪个包像就抄哪个"，而 7 个包彼此都不完全像。
- **新人上手门槛**：没有单一可参照的骨架。

本文梳理现状、定位问题、给出统一目标骨架与分阶段迁移路径，并建议一个 CI 结构校验脚本防止回流。

---

## 2. 现状盘点（数据驱动）

### 2.1 包级顶层结构对比

| 包                 | components/           | custom-plugins/ | entries/ | 顶层 core.ts | 顶层 plugins.ts | presets/ | 其他散落                                             |
| ----------------- | --------------------- | --------------- | -------- | ---------- | ------------- | -------- | ------------------------------------------------ |
| vane-card         | ✅ CardPlugin          | ✅ 薄壳层           | ❌        | ✅          | ✅             | ✅        | —                                                |
| vane-comment      | ✅ CommentPlugin       | ✅ 真实层           | ✅        | ❌          | ❌             | ✅        | —                                                |
| vane-file-preview | ✅ FilePreviewPlugin   | ✅ 真实层           | ❌        | ✅          | ✅             | ❌        | types/                                           |
| vane-lazy-image   | ✅ LazyLoadImagePlugin | ✅ 真实层           | ❌        | ✅          | ✅             | ✅        | hooks/ utils/ gallery/ advanced.ts monitoring.ts |
| vane-profile      | ✅ ProfilePlugin       | ✅ 真实层           | ✅        | ❌          | ❌             | ❌        | —                                                |
| vane-sku          | ✅ SkuPlugin           | ✅ 真实层           | ❌        | ❌          | ❌             | ❌        | —                                                |
| vane-waterfall    | ✅ WaterfallPlugin     | ✅ 真实层           | ✅        | ❌          | ❌             | ✅        | —                                                |



> ✅ = 存在；❌ = 不存在。

### 2.2 插件真实位置（最关键的差异）

- **6 个包**：`src/custom-plugins/<X>/` 即真实实现目录。
- **vane-card（独有）**：`src/custom-plugins/<X>/` 只是**薄壳再导出**（`export * from "../../components/CardPlugin/custom-plugins/<X>"`），真实实现住在 `src/components/CardPlugin/custom-plugins/<X>/`。即 card 有"双 custom-plugins"结构，其他 6 包 `components/**/custom-plugins` 目录数为 0。

### 2.3 插件内部文件范式对比（真实实现层）

| 包                 | 插件数     | create.tsx   | doc.json | index.ts(x)   | 范式                             |
| ----------------- | ------- | ------------ | -------- | ------------- | ------------------------------ |
| vane-comment      | 17      | 17 (100%)    | 17       | 17 (ts)       | **三件套** ✅ 金标准                  |
| vane-profile      | 16      | 16 (100%)    | 16       | 16 (ts)       | **三件套** ✅                      |
| vane-sku          | 12      | 12 (100%)    | 12       | 12 (ts)       | **三件套** ✅（但命名例外）               |
| vane-file-preview | 17      | 0            | 17       | 17 (tsx)      | doc.json + index.tsx（工厂内联 tsx） |
| vane-card         | 22      | 0            | 22       | 18 tsx + 4 ts | doc.json + index.tsx（工厂内联，双结构） |
| vane-lazy-image   | 84      | 44 (52%)     | 84       | 84 (ts)       | 混合：44 三件套 / 40 工厂内联 index.ts   |
| vane-waterfall    | 26      | 8 (31%)      | 26       | 26 (ts)       | 混合：8 三件套 / 18 工厂内联 index.ts    |
| **合计**            | **194** | **97 (50%)** | **194**  | —             | 仅 45 个（23%）严格三件套               |

> 金标准范式（comment 的 `LikePlugin`）：`create.tsx` 里定义 `createLikePlugin()` 工厂 + `export { doc }`；`index.ts` 里 `Object.assign(create, { meta: doc })` 后导出；`doc.json` 存元数据。三者职责分离、可被文档生成器与 IDE 直接消费。

### 2.4 入口聚合方式（三套并存）

| 方式                                   | 包                                | 消费方导入示例                                                                         |
| ------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------- |
| `entries/` 子目录（core.ts + plugins.ts） | comment / profile / waterfall    | `import { createX } from "vane-comment/entries/plugins"`                        |
| 顶层 `core.ts` + `plugins.ts`          | card / file-preview / lazy-image | `import { createX } from "vane-card/plugins"`                                   |
| 核心组件目录内直接导出（无独立 core/plugins 模块）     | sku                              | `import { createX } from "vane-sku/custom-plugins/X"`（主入口只导核心+装配+类型，ADR-6 显式导入） |

### 2.5 插件命名约定

| 约定                              | 包                                                                | 示例                                                  |
| ------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| PascalCase + `Plugin` 后缀（统一）    | card / comment / file-preview / lazy-image / profile / waterfall | `LikePlugin` / `A11yPlugin` / `WatermarkPlugin`     |
| **CamelCase 无 `Plugin` 后缀（例外）** | **sku**                                                          | `Analytics` / `ImageLink` / `PriceLink` / `SkuCode` |

### 2.6 doc.json 元数据 schema

顶层 8 字段在 6 个有 doc.json 的包中**基本一致**：`name / description / since / tags / config / example / features / useCases / notes`。

- 唯一差异：**lazy-image 用 `examples`（复数）**，其余包用 `example`（单数）。属细微但不一致。
- card 的薄壳层无 doc.json，但真实实现层（components/CardPlugin/custom-plugins）有 22 个。

### 2.7 测试

- **所有包 `custom-plugins/` 内插件级测试 = 0**。测试只存在于包根 `test/`（selftest 集成测试，跑真实挂载+点击+DOM 断言）。
- 无"插件级单元测试"约定（如 `createXxxPlugin` 的纯函数行为、配置默认合并、边界）。

### 2.8 presets 目录

- 有：card / comment / lazy-image / waterfall
- 无：file-preview / profile / sku

（presets 是预设插件组合，缺失不致命，但作为"开箱即用场景"能力不统一。）

---

## 3. 问题清单（按严重度排序）

### 🔴 P0 — 影响复用与工具链

1. **插件内部范式分裂（最重要）**：仅 23% 插件遵循三件套。file-preview/card 用 `doc.json+index.tsx`，lazy-image(52%)/waterfall(31%) 大量工厂内联进 `index.ts`。后果：`sync:exports`/`generate-plugin-docs` 若依赖 `create.tsx` 或统一入口，会在这些包上行为不一致；新插件不知该抄谁。
2. **sku 命名违反约定**：12 个插件 CamelCase 且无 `Plugin` 后缀，与全仓其余 182 个插件冲突。后果：文档/检索/自动导入按 `XxxPlugin` 假设时会漏掉 sku。

### 🟠 P1 — 影响工程清晰度

1. **card 双 custom-plugins 结构**：真实实现藏在 `components/CardPlugin/custom-plugins/`，外层 `src/custom-plugins/` 仅薄壳。后果：路径深、易误改薄壳、与所有其他包结构相反。
2. **入口聚合成三套**：entries/ vs 顶层 core/plugins vs 核心组件内导出。后果：消费方记忆成本高、脚本按一种模式扫描会漏。
3. **工厂内联 vs 分离**：lazy-image/waterfall 近 70% 插件把 `Object.assign(create, {...})` 写在 `index.ts` 而非 `create.tsx`。后果：职责不清，元数据与实现耦合。

### 🟡 P2 — 一致性打磨

1. **doc.json schema 微差**：lazy-image `examples` vs 其他 `example`。
2. **presets 有无不一**：file-preview/profile/sku 缺失。
3. **插件级测试缺失**：0 覆盖，回归只能靠包根 selftest 大伞。

---

## 4. 根因分析

- **无统一脚手架**：各包在不同时间点由不同 prompt/agent 轮次独立生成，**没有"包骨架生成器"（scaffold）** 作为单一事实来源。
- **缺少结构级 CI gate**：现有脚本 `sync:exports`（只同步 `package.json` exports）、`sync-readme`（只同步 README）只管产物，不管 `src` 结构；没有"骨架校验"环节。
- **规范确立晚于老包**：三件套 + `entries/` 的范式是 **vane-comment 最新确立**的（也是 ADR 的落点），但早于它的 card（双结构）、file-preview（doc+tsx）、lazy-image（巨型、部分内联）、waterfall（部分内联）在规范前已形成，未反向应用。
- **规模放大漂移**：lazy-image 84 个插件、`_shared` 共享目录等，是在没有模板约束下"自然生长"的结果。

> 亮点（并非全乱）：**核心组件层完全统一** —— 每包恰好一个 `components/<Name>Plugin/`，命名与职责一致。问题集中在"插件层"与"组织层"，说明骨架主干是对的，需要的是把插件层对齐到已验证的金标准。

---

## 5. 标准化目标骨架（提案）

定义**全仓唯一**包骨架：

```
packages/<name>/
  package.json                 # exports 由 sync:exports 自动生成（已落地）
  src/
    index.ts                   # 主入口：re-export core + plugins 聚合 + 类型
    components/
      <Name>Plugin/            # 唯一核心组件（已是统一事实，保留）
        <Name>Plugin.tsx
        plugins/types.ts       # 插件契约类型（Plugin / Context / Creator / Hooks）
        index.ts
    custom-plugins/            # 唯一真实实现层（消除 card 双结构）
      <XxxPlugin>/             # 命名：PascalCase + Plugin 后缀（修正 sku）
        create.tsx             # 工厂 createXxxPlugin()  +  import doc; export { doc }
        doc.json               # 元数据（统一 8 字段 schema）
        index.ts               # Object.assign(create, { meta: doc }) + 默认导出 create
      index.ts                 # 桶导出所有插件
    presets/                   # 预设组合（建议存在，哪怕仅基础预设）
      index.ts
    entries/                   # 统一聚合入口（消除散落顶层 core/plugins）
      core.ts                  # 核心组件 + withPlugins + 类型
      plugins.ts               # 全量/分组插件再导出
  test/
    <XxxPlugin>.test.tsx       # 插件级单元测试约定
```

**统一约定清单：**

1. 插件命名：`PascalCase` + `Plugin` 后缀（修正 sku 的 `Analytics`→`AnalyticsPlugin` 等）。
2. 插件三件套强制：`create.tsx` + `doc.json` + `index.ts`（黄金范式，comment/profile/sku 已是）。
3. 真实实现只在 `src/custom-plugins/<XxxPlugin>/`（消除 card 双结构）。
4. 入口聚合统一走 `entries/`（core.ts + plugins.ts），不再散落顶层（card/file-preview/lazy-image 迁入）。
5. doc.json schema 统一为 8 字段，`example`（单数），修正 lazy-image `examples`。
6. 插件级单元测试约定落地（至少覆盖工厂纯函数 + 配置默认）。

---

## 6. 迁移路径（分阶段，每包独立 PR，低风险）

| 阶段      | 内容                                                                                    | 涉及包                              | 风险                   |
| ------- | ------------------------------------------------------------------------------------- | -------------------------------- | -------------------- |
| Phase 0 | 落地 `scripts/check-structure.mjs` 骨架校验，接 CI（仅报告不阻断）                                    | 全仓                               | 低                    |
| Phase 1 | sku 插件重命名 `X→XPlugin` + 同步 `package.json` exports                                     | vane-sku                         | 低（脚本批量）              |
| Phase 2 | card 消除双结构：真实插件移到 `src/custom-plugins/`，删 `components/CardPlugin/custom-plugins/` 薄壳层 | vane-card                        | 中（路径迁移，需重跑 sync）     |
| Phase 3 | file-preview / card 三件套化：从 `index.tsx` 拆出 `create.tsx`                                | vane-file-preview / vane-card    | 中                    |
| Phase 4 | lazy-image / waterfall 拆分内联工厂到 `create.tsx`（保留 `_shared`）                             | vane-lazy-image / vane-waterfall | 中（84/26 插件，脚本辅助）     |
| Phase 5 | 统一入口聚合：card/file-preview/lazy-image/sku 迁入 `entries/`                                 | 4 包                              | 中（改 exports + 消费方路径） |
| Phase 6 | doc.json schema 统一（`examples`→`example`）                                              | vane-lazy-image                  | 低                    |
| Phase 7 | 补插件级单元测试 + 校验脚本升级为 CI 阻断                                                              | 全仓                               | 低                    |

> 建议 Phase 0 先行，让现状可视化、可监控；Phase 1/6 纯低风险可立即做；Phase 2–5 按包逐个推进，避免一次大改。

---

## 7. 自动化校验（防止回流）

新增 `scripts/check-structure.mjs`，对每个包断言：

- `src/components/<Name>Plugin/` 恰好一个核心组件；
- `src/custom-plugins/<X>/` 下存在 `create.tsx` + `doc.json` + `index.ts`；
- 插件目录名匹配 `/^[A-Z][A-Za-z0-9]*Plugin$/`；
- 若存在 `entries/`，则含 `core.ts` + `plugins.ts`，且不出现顶层 `core.ts`/`plugins.ts`；
- `doc.json` 顶层字段集合 == 标准 8 字段。

输出每包通过/失败清单，CI 中先"报告"后"阻断"。

---

## 8. 优先级建议（TL;DR）

- **立刻做（P0）**：sku 命名统一；file-preview/card/lazy-image/waterfall 三件套化。
- **近期（P1）**：消除 card 双结构；统一入口聚合到 `entries/`。
- **打磨（P2）**：doc.json schema 统一；补插件级测试；presets 补齐。
- **保驾护航**：Phase 0 校验脚本先落地，让漂移可观测、可阻断。

---

## 附录：可复现的调查命令

```bash
cd packages
# 顶层结构 + 插件清单
for d in vane-card vane-comment vane-file-preview vane-lazy-image vane-profile vane-sku vane-waterfall; do
  echo "## $d"; ls -1 "$d/src"; ls -1 "$d/src/custom-plugins" | tr '\n' ' '; echo
done

# 插件内部文件统计
for d in vane-card vane-comment vane-file-preview vane-lazy-image vane-profile vane-sku vane-waterfall; do
  echo "## $d"
  echo "  create.tsx=$(find "$d/src/custom-plugins" -mindepth 2 -maxdepth 2 -name create.tsx|wc -l)"
  echo "  doc.json=$(find "$d/src/custom-plugins" -mindepth 2 -maxdepth 2 -name doc.json|wc -l)"
  echo "  index.ts(x)=$(find "$d/src/custom-plugins" -mindepth 2 -maxdepth 2 -name 'index.ts*'|wc -l)"
done

# doc.json 顶层 key
for d in vane-comment vane-file-preview vane-lazy-image vane-profile vane-sku vane-waterfall; do
  f=$(find "$d/src/custom-plugins" -mindepth 2 -maxdepth 2 -name doc.json|head -1)
  echo -n "$d: "; grep -oE '^  "[a-zA-Z_]+":' "$f" | tr -d ' ":' | tr '\n' ' '; echo
done

# card 双结构核查
ls vane-card/src/components/CardPlugin/custom-plugins
```
