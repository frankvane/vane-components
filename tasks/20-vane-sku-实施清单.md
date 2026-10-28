# 20 · vane-sku 实施清单（新独立包 · 阶段 / 任务 / 验收门）

> 用法：每完成一项打勾；**每个阶段末尾有验收门，不过门不进下一阶段**。
> 关联：设计决策与内核映射见 `tasks/19-vane-sku-分析.md`；家族范式见 `tasks/18`（vane-gallery）、`tasks/16`（vane-profile）
> 前置状态：`vane-plugin-core@0.1.0`（已发布，零改动）、`vane-card@2.0.1`（现有 SKU 能力保留不动）；**本次新建 `packages/vane-sku` 独立包**。

---

## 阶段总览

| 阶段 | 目标 | 主要产出 | 依赖 | 相对量 |
| --- | --- | --- | --- | --- |
| **P0** | 决策拍板（锁定 B1–B6） | `tasks/19` 结论 + 本文档 | — | S |
| **P1** | 包骨架（模板 / 依赖 / 导出 / 预算） | `packages/vane-sku` 可构建、`package.json` exports + `sizeBudgetKb` | P0 | M |
| **P2** | 数据模型 + core 引擎 | `SkuSelectorCore` + `useSkuRuntime` + `matrix.ts`（组合矩阵+禁用推导）+ `createSkuSelector` | P1 | L |
| **P3** | 渲染与插槽 | 规格按钮组（禁用态）+ 选中摘要 + before/after/overlay 接线 | P2 | M |
| **P4** | 三个插件 | PriceLink / Quota / ImageLink + 各 `doc.json` + 子路径导出 | P3 | M |
| **P5** | demo（规格选择组合场景） | sku 工坊 + 场景 + 逐项 + 几何体检 | P4 | M |
| **P6** | 文档 / README / 体积 / 发布 | docs sku 段、changeset、`0.1.0` | P5 | S |

> 量级口径：S ≈ 半天内、M ≈ 1–2 个专注时段、L ≈ 需要分批推进。本清单是**新建包**（比 gallery 并入 lazy-image 重：含包骨架 + 依赖策略 + 全量引擎），P2 引擎逻辑是重点。

---

## 基线（P0 固化，后续阶段以此为准）

| 指标 | 规划/预期 | 复现/确认命令 |
| --- | --- | --- |
| 包定位 | 新独立包 `vane-sku`（规格选择引擎） | `tasks/19` 第一章 |
| 内核策略 | 基于 `vane-plugin-core@0.1.0`（零改动，devDep 内联） | `tasks/19` 第七章 |
| 数据模型 | `SkuAttribute{options:{id,label,image?}}` + `SkuVariant{attrValues,quota}` | `tasks/19` 第五章 |
| 插件集合 | PriceLink / Quota / ImageLink（承诺）+ ThumbPreview（候选） | `tasks/19` 第四章 |
| 体积预算 | 根 `≤7KB`（实测 6.08KB，core 内联）+ 子路径 `./custom-plugins/{PriceLink,Quota,ImageLink}` 各 `≤2KB` | `tasks/19` 第七章 |
| SOP 命中 | 5/5（红线③已抗辩） | `tasks/19` 第九章 |
| 红线 | 0 命中 | `tasks/19` 第九章 |

---

## P0 · 决策拍板（已随 grill B1–B6 锁定）

- [x] **P0.1 锁定 B1**：新独立包 `packages/vane-sku`，从零写；card 现有 SKU 能力保留并存（不抽不改）
- [x] **P0.2 锁定 B2**：基于 `vane-plugin-core` + 显式插槽；core=选规格+组合矩阵+禁用推导
- [x] **P0.3 锁定 B3**：数据模型扩展 option id/image + variant attrValues/quota（见 `tasks/19` 第五章）
- [x] **P0.4 锁定 B4**：禁用推导进 core（非插件）；插件仅 PriceLink/Quota/ImageLink（修正规划措辞）
- [x] **P0.5 锁定 B5**：core 渲染规格按钮组+选中摘要；before/after/overlay 映射现有 core 钩子；ImageLink emit 事件；零改 core
- [x] **P0.6 锁定 B6**：peer 仅 react/react-dom；core devDep 内联；零 vane-card 依赖；根 ≤7KB + 子路径各 ≤2KB（实现后按实测修正，原估 3.5/1）
- [x] **P0.7 复核 P1 前置**：内核依赖策略经核查已是统一 inline（四包全 devDep 内联），直接确认沿用

**验收门 P0**：`tasks/19` 与本文档结论一致；B1–B6 全部落纸；与 vane-card 边界清晰（不依赖、不冲突）。

---

## P1 · 包骨架（模板 / 依赖 / 导出 / 预算）

### P1.1 脚手架（沿用家族模板）

- [ ] `pnpm new`（或复制 `packages/templates`）生成 `packages/vane-sku`，改名 + 清模板占位
- [ ] `package.json`：
  - [ ] `name: "vane-sku"`、`version: "0.1.0"`、`type: "module"`、`files: ["dist"]`、`sideEffects: false`
  - [ ] `peerDependencies`: `react` / `react-dom`（仅此，硬约束）
  - [ ] `devDependencies`: `vane-plugin-core`（`workspace:*`，内联）、`@vane/build-config` / `@vane/eslint-config` / `@vane/tsconfig` / `@vane/vitest-config`、`vite` / `vite-plugin-dts` / `vitest` / `happy-dom` / `typescript` / `react` / `react-dom` / `@types/*`
  - [x] `exports`：`.` / `./custom-plugins` / `./custom-plugins/{PriceLink,Quota,ImageLink}` / `./custom-plugins/*` 通配
  - [x] `vane.sizeBudgetKb: 7` + `vane.subpathBudgets: { "./custom-plugins/PriceLink":2, "./custom-plugins/Quota":2, "./custom-plugins/ImageLink":2 }`（理由写入 sizeBudgetNote：core 内联 + doc.json 元数据随插件发布）
  - [ ] `scripts`: `dev`/`build`/`build:demo`/`typecheck`/`test`/`lint`/`serve:demo`/`verify:scenarios` 对齐家族
  - [ ] `publishConfig.access: "public"`
- [ ] `vite.config.ts`（lib 多入口）+ `tsconfig.json` + `vitest.config.ts` 对齐 `vane-lazy-image`/`vane-card`

### P1.2 内核接入预检

- [ ] 确认 `vane-plugin-core` 经 devDep 内联后，`withPlugins`/`usePluginRuntime`/`composeSlots`/`PluginErrorBoundary`/`extendContext` 在 `src` 可直接 import
- [ ] 确认 core 插槽词汇 `renderHeader(before/after)`/`renderOverlay`/`renderFooter` 满足 B5 映射（已核，见 `tasks/19` 4.1）

**验收门 P1**：`pnpm build` 产出空壳 `dist/index.js` 且 `exports` 有效；`typecheck` 0 错；`lint` 0 error；根体积预检不超 7KB（空壳应远小于）；`pnpm check` 包卫生通过（README 首屏 `npm install vane-sku`、files/dist 等）。

---

## P2 · 数据模型 + core 引擎（重点）

### P2.1 类型（B3）

- [ ] `src/types.ts`：`SkuOption` / `SkuAttribute` / `SkuVariant` / `SkuSelectorProps` / `SkuPluginContext`（派生 `PluginContext` + `selection`/`disabledMap`/`variant`/`canPurchase`）

### P2.2 组合矩阵 + 禁用推导（纯函数，核心卖点）

- [ ] `src/core/matrix.ts`：
  - [ ] `buildAvailability(attributes, variants, selection, opts)` → `{ disabled: Record<string, Set<string>>, availableCount: Record<string, number> }`
  - [ ] 对每个属性每个候选 option 做"临时选择→是否存在匹配变体"判定；`ignoreOutOfStock`（默认 true）时 `stock===0` 不计
  - [ ] 边界：部分选择、全部未选、无匹配变体（variants 为空/残缺）、option 重复 id

### P2.3 选规格状态机 + runtime

- [ ] `src/core/useSkuRuntime.ts`：`usePluginRuntime({ plugins, props, extendContext })`；`extendContext` 注入 `selection`/`disabledMap`/`variant`/`canPurchase`（`useCallback` 稳定）
- [ ] `src/core/SkuSelectorCore.tsx`（forwardRef）：
  - [ ] 渲染规格按钮组（每组一属性，按钮含 `disabled` 态 + 选中态）+ 选中摘要
  - [ ] 初始化默认规格（`defaultSelection`）→ 首屏即带默认 + 写 `variant`/`price`/`image`
  - [ ] 选项点击 → 更新 `selection` → 重算 `disabledMap` → 完整选择命中变体则 emit `sku:change` + 调 `onChange`/`onValidSkuChange`
  - [ ] 改闭包状态后必调 `context.forceUpdate()`（**勿用 `coreRef.forceUpdate()`**，vane-waterfall 铁律）
  - [ ] `composeSlots` 在 children 前后插入 before/after/overlay 插槽
- [ ] `src/core/createSkuSelector.tsx`：`createSkuSelector(runtimePlugins?, opts?)` 复用 `withPlugins` 范式，默认注入空 runtime

### P2.4 单测（第一批，纯函数优先）

- [ ] `test/matrix.test.ts`：典型矩阵（2 属性 × 各 2-3 选项）、缺货变体、`ignoreOutOfStock` 开关、无匹配变体、部分选择下的禁用集
- [ ] `test/sku-core.test.ts`：默认规格初始化、点击置灰项不可选、完整选择 emit `sku:change` 带 variant、`forceUpdate` 契约

**验收门 P2**：`build` 通过；`typecheck` 0 错；`test` ≥10 通过（矩阵 + core）；禁用推导在 happy-dom 下行为正确；根体积预检不超 7KB。

---

## P3 · 渲染与插槽（B5）

### P3.1 插槽接线

- [ ] `before` → `renderHeader(position:"before")`：标题/头部
- [ ] `after` → `renderHeader(position:"after")` 或 `renderFooter`：加购/确认按钮区（宿主注入，core 不渲染按钮）
- [ ] `overlay` → `renderOverlay`：价格浮层位（P4 PriceLink 填充）
- [ ] `disabled` 态样式：置灰 + 不可点击 + 可选"缺货"角标（不阻断，仅视觉）
- [ ] `ThumbPreview` 候选：option.image 有则在按钮内渲染色块图（若实现则并入 core 渲染，不单独成插件）

### P3.2 单测

- [ ] `test/sku-slots.test.ts`：before/after/overlay 位置正确、空插槽不渲染、宿主 `after` 注入节点出现在正确段

**验收门 P3**：`build` 通过；`typecheck` 0 错；插槽位置与禁用态渲染有断言；根体积预检不超 7KB。

---

## P4 · 三个插件（PriceLink / Quota / ImageLink）

> 统一动作（每个插件）：三件套 `create.tsx`（工厂返回 `{ name, hooks }`）+ `doc.json`（name/description/since/tags/config/example/useCases）+ `index.ts` 挂 `.meta` + 子路径导出登记。
> **铁律**：凡在事件/钩子里改了闭包状态，必须调 `context.forceUpdate()`（勿用 `coreRef.forceUpdate()`）。

### P4.1 PriceLinkPlugin（价格联动 · 承诺）

- [ ] 订阅 `variant`，`renderOverlay` 渲染价格区（变体价 / 原价 / 折扣文案 / 币种）
- [ ] config：`currency` / `showOriginal` / `discountText`
- [ ] `src/custom-plugins/PriceLink/` 三件套 + `exports` 登记 `./custom-plugins/PriceLink`

### P4.2 QuotaPlugin（限购校验 · 承诺）

- [ ] 读 `variant.quota` + 已购数（props/context 传入），`renderHeader(after)` 渲染"每人限购 N（已购 M）"提示条
- [ ] `extendContext(canPurchase)` 暴露门控（宿主加购按钮读它决定是否禁用）
- [ ] config：`purchasedCount` / `onExceed`
- [ ] `src/custom-plugins/Quota/` 三件套 + `exports` 登记 `./custom-plugins/Quota`

### P4.3 ImageLinkPlugin（规格切主图 · 承诺）

- [ ] 有效变体带 `image` 时 emit `bus.emit("sku:image", image)` 或回调 `onImageChange`；**不发 UI**
- [ ] config：`onImageChange`
- [ ] `src/custom-plugins/ImageLink/` 三件套 + `exports` 登记 `./custom-plugins/ImageLink`

### P4.4 单测

- [ ] `test/price-link.test.ts`：变体价/原价/折扣渲染正确
- [ ] `test/quota.test.ts`：限购提示 + `canPurchase` 在超限时为 false
- [ ] `test/image-link.test.ts`：有效变体 emit `sku:image`

**验收门 P4**：`build` 通过；`typecheck` 0 错；`test` 三个插件各 ≥1；子路径 `./custom-plugins/{PriceLink,Quota,ImageLink}` 闭包体积各 ≤2KB；`pnpm check` 包卫生通过。

---

## P5 · demo（规格选择组合场景）

### P5.1 demo 工坊

- [ ] `demo/src/pages/SkuPage.tsx`：规格选择工坊——左侧实时选择器，右侧显示当前 selection/variant/禁用集/事件日志
- [ ] 场景：多属性（颜色+尺码+版本）、带缺货变体、带 quota、带 option.image 色块、默认规格、ImageLink 联动外层主图

### P5.2 逐项 + 几何体检

- [ ] 逐项验证：禁用推导置灰、完整选择命中、价格浮层、限购条、`sku:image` 切换
- [ ] `verify:scenarios` 脚本（对齐家族）：无水平溢出 / 无零尺寸元素 / 两两不重叠 / 选中摘要覆盖
- [ ] 用页面内几何体检（非截图）断言越界/负坐标/零尺寸

**验收门 P5**：`build:demo` 通过；逐项功能人工 + 脚本复核；几何体检全绿；`pnpm verify` 全绿（lint/typecheck/test/check）。

---

## P6 · 文档 / README / 体积 / 发布

### P6.1 文档与 README

- [ ] `docs/components/sku/index.md`：定位、数据模型、API、插件、与 vane-card 边界说明
- [ ] `scripts/sync-readme.mjs` 从 docs 生成 README 首屏（含 `npm install vane-sku`）
- [ ] `README.md` 首屏 `npm install vane-sku` + SOP 命中表

### P6.2 体积与发布

- [ ] `pnpm check` 体积门全绿（根 ≤7KB + 子路径各 ≤2KB）
- [ ] changeset 随包提交（`.changeset/*.md`）
- [ ] `git` 提交（不 push，待你拍板）；`vane-sku@0.1.0` 发布（经 Clash 7890 代理 `npm publish --registry https://registry.npmjs.org`，前置 `export CODEBUDDY_SAFE_DELETE_ENABLED=0`）

**验收门 P6（发布前置）**：`pnpm verify` 全绿 + 体积门 + changeset 就位 + README 首屏 install 命令无误；发布命令就绪待执行。

---

## 收尾核对

- [ ] `git status` 仅含 `packages/vane-sku/**` + `tasks/19` + `tasks/20` + `docs/components/sku/**`（不夹带 `.lh/` 等未跟踪垃圾）
- [ ] 未修改 `vane-plugin-core`、`vane-card`（保持并存）
- [ ] 发布复核以 registry API 为准（`curl https://registry.npmjs.org/vane-sku/0.1.0`），不走缓存 `npm view`
