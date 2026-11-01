# vane-sku 修复实施验收清单

> 对应评审报告：`tasks/43-vane-sku-核心功能评审.html`（3 项 P0 / 3 项 P1 / 8 项 P2）
> 实施范围：`packages/vane-sku/`（源码、插件、demo 自测、测试）
> 结论：**14 项全部修复，0 项跳过，0 项阻塞**；`test` / `typecheck` / `lint` / `build` 四条命令全部通过。

## 1. 概述

### 1.1 修复策略

| 原则 | 落地方式 |
| --- | --- |
| 落到源设计，不做宿主补丁 | 数据归一化 / 选择态白名单收敛在 HOC（`withPlugins`）单一入口；数量与限购口径抽到 `limits.ts`，由插件在事件钩子中写回内核 state |
| 数量约束写回 state | `QuantityPlugin` 在 `onMount` / `onSkuChange` 中 `context.setState({ quantity })`，并触发 `config.onChange` |
| 库存/限购变化重新收敛 | `withPlugins` 的事件 effect 增加「变体身份变化」触发条件，库存轮询改小也能派发 `onSkuChange` |
| 避免无限 setState | 收敛前与目标值比较（相同直接返回）；选择态用 `(state.selection, attributes)` 引用缓存，保证同一输入返回同一对象；派生值与插槽 `useMemo` |
| 公开 API 兼容 | 新增字段全部可选；语义收紧的 4 处已在第 6 节标注为「破坏性变更」并给出迁移方式 |

### 1.2 改动文件列表

**新增**
- `packages/vane-sku/src/components/SkuPlugin/normalize.ts`（数据 + 选择态归一化、等价比较）
- `packages/vane-sku/src/components/SkuPlugin/limits.ts`（剩余限购 / 数量上限 / 价格格式化）
- `packages/vane-sku/test/regressions.test.tsx`（14 项缺陷的回归测试，28 条用例）
- `tasks/52-vane-sku-修复实施验收清单.md`（本文档）

**修改（源码）**
- `packages/vane-sku/src/components/SkuPlugin/matrix.ts`
- `packages/vane-sku/src/components/SkuPlugin/withPlugins.tsx`
- `packages/vane-sku/src/components/SkuPlugin/SkuSelectorCore.tsx`
- `packages/vane-sku/src/components/SkuPlugin/plugins/types.ts`
- `packages/vane-sku/src/index.ts`
- `packages/vane-sku/src/custom-plugins/QuantityPlugin/create.tsx`
- `packages/vane-sku/src/custom-plugins/QuotaPlugin/create.tsx`
- `packages/vane-sku/src/custom-plugins/PriceRangePlugin/create.tsx`
- `packages/vane-sku/src/custom-plugins/PriceLinkPlugin/create.tsx`
- `packages/vane-sku/src/custom-plugins/KeyboardNavPlugin/create.tsx`
- `packages/vane-sku/src/custom-plugins/KeyboardNavPlugin/doc.json`
- `packages/vane-sku/src/custom-plugins/UrlSyncPlugin/create.tsx`
- `packages/vane-sku/src/custom-plugins/StatePersistencePlugin/create.tsx`

**修改（测试 / demo 自测）**
- `packages/vane-sku/test/plugins-extra.test.tsx`（KeyboardNav 两条用例对齐新语义）
- `packages/vane-sku/demo/src/lib/selftest.tsx`（第 6 段键盘断言对齐新语义）

> 未改动 `packages/plugin-core`、其它包、根配置、`tasks/43` 报告本身；未执行任何 git 命令。

## 2. 逐项验收表

> 编号与评审报告一致。「回归测试用例名」均位于 `packages/vane-sku/test/regressions.test.tsx`（除标注文件外）。

| 编号 | 级别 | 问题 | 修复方案 | 改动位置（file:line） | 回归测试用例名 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| SKU-P0-1 | P0 | 脏 / 陈旧 `selection`（URL、localStorage、defaultSelection）残留时，全部选项被置灰、无法取消，矩阵死锁 | 新增 `normalizeSelection` 按 attributes 的 optionId 白名单过滤；HOC 在 `initialState`、`setState` 拦截、`commitSelection` 三处统一走白名单；`Core` 对已选中项永不禁用 | `normalize.ts:133-152`；`withPlugins.tsx:107-118, 159-193, 236-241`；`SkuSelectorCore.tsx:136-152` | `SKU-P0-1 … > 脏 defaultSelection（optionId 不存在）被丢弃，矩阵仍可点` / `localStorage 里的陈旧选择（换了商品）也不会写进 state` / `normalizeSelection 纯函数：只保留合法键值` | ✅ 已修复 |
| SKU-P0-2 | P0 | 数量上限只作用于渲染值，库存/限购变化后 `state.quantity` 仍是旧值 → 宿主持有超卖数量 | `QuantityPlugin` 新增 `targetOf / converge`，在 `onMount` / `onSkuChange` 中把收敛值写回 state；HOC 事件 effect 让「变体身份变化」也触发 `onSkuChange` | `QuantityPlugin/create.tsx:34-64, 73-79, 94-99`；`withPlugins.tsx:294-317` | `SKU-P0-2 … > 库存从 10 降到 2 时 state.quantity 收敛为 2 并触发 onChange` / `变体消失（未选全 / 无可售组合）时数量回到 1` | ✅ 已修复 |
| SKU-P0-3 | P0 | `attributes` 缺 `options`、`variants` 缺 `attrValues` 时渲染期 TypeError → 整页白屏 | 新增 `normalizeSkuData` 补齐/过滤/去重；`matrix` 用 `attrValue()` 容错读取；HOC 外层 `PluginErrorBoundary` 提供降级 UI，数据变化时以递增 key 自愈 | `normalize.ts:38-124`；`matrix.ts:37-40, 85`；`withPlugins.tsx:71-89, 367-388`；`SkuSelectorCore.tsx:119` | `SKU-P0-3 … > 属性缺 options / 变体缺 attrValues 时不抛异常、正常渲染` / `attributes 传 null 也不崩` / `HOC 级错误边界兜底…` / `normalizeSkuData 纯函数：补齐缺失字段并去重` | ✅ 已修复 |
| SKU-P1-1 | P1 | 「有效 SKU」口径不一致：命中缺货变体仍触发 `onValidSkuChange`，摘要也照常展示价格 | 新增 `isPurchasable` 作为唯一口径（与 `effectiveVariants` 共用 `ignoreOutOfStock`）；仅在 `variant && purchasable` 时回调；摘要追加 ` · 缺货` | `matrix.ts:43-64`；`withPlugins.tsx:164, 313-315`；`SkuSelectorCore.tsx:195-201` | `SKU-P1-1 … > 命中但 stock=0 的变体：回调不触发，摘要标注缺货` / `库存在运行中变为 0 时不再宣告「有效 SKU」` / `ignoreOutOfStock=false 时缺货变体仍视为可售（口径一致）` | ✅ 已修复 |
| SKU-P1-2 | P1 | 不支持受控 `selection`：宿主无法预选/重置，点击只改内部 state | 新增 `selection` + `onSelectionChange` props；受控判定 `props.selection !== undefined`；点击统一走 `commitSelection` 并回传；props 变化用 `isSameSelection` 挡住重复写入 | `plugins/types.ts:86-98`；`withPlugins.tsx:92-94, 167-176, 250-259` | `SKU-P1-2 … > 传入 selection 即以 props 为准，父级更新后选中态同步` / `点击通过 onSelectionChange 回传，而不是只改内部 state` | ✅ 已修复 |
| SKU-P1-3 | P1 | 限购未扣减已购件数：限购 2、已购 1 时数量仍可加到 2（共 3 件） | 抽 `remainingQuota / quantityUpper` 统一口径；`QuantityConfig` 与 `QuotaConfig` 新增 `purchasedCount`；Quota 输出 `remaining` / `canPurchase` | `limits.ts:14-35`；`QuantityPlugin/create.tsx:24-39`；`QuotaPlugin/create.tsx:31-50, 59-64` | `SKU-P1-3 … > 已购 1 / 限购 2 → 数量上限 1、剩余 1` / `remainingQuota / quantityUpper 纯函数口径` | ✅ 已修复 |
| SKU-P2-1 | P2 | 已选中项一旦被禁用推导置灰就 `disabled`，用户无法取消（库存变 0 后尤为明显） | `const blocked = disabled && !selected`；`disabled={blocked}`，`cursor` 同步 | `SkuSelectorCore.tsx:139-152, 165` | `SKU-P2-1 … > 库存变为 0 后，已选中的选项仍可点击取消` | ✅ 已修复 |
| SKU-P2-2 | P2 | 价格区间把缺货变体计入 min/max；价格未固定两位小数 | `PriceRange` 改用 `effectiveVariants` 排除缺货；`PriceRange` / `PriceLink` / 摘要统一用 `formatPriceValue` | `PriceRangePlugin/create.tsx:36-71`；`PriceLinkPlugin/create.tsx:2, 52, 57`；`limits.ts:38-49`；`SkuSelectorCore.tsx:195-197` | `SKU-P2-2 … > 区间不包含缺货变体的价格，且保留两位小数` / `单价与摘要价格都固定两位小数` | ✅ 已修复 |
| SKU-P2-3 | P2 | 重复属性名 / 重复 optionId → React duplicate key、选中态串联 | `normalizeSkuData` 去重（保留首个）并记录 `issues`；HOC 在开发环境 `console.warn` | `normalize.ts:44-88, 100-104`；`withPlugins.tsx:83-89` | `SKU-P2-3 … > 同名属性只渲染一行，重复 optionId 只保留一个按钮` | ✅ 已修复 |
| SKU-P2-4 | P2 | 每次渲染都重建禁用矩阵与全部插槽，父组件无关重渲染也跑插件渲染钩子 | `EMPTY_ATTRIBUTES / EMPTY_VARIANTS` 稳定空数组；`availabilityOf` 按 `[attributes, variants, selection, ignoreOutOfStock]` 缓存；`slots` 用 `useMemo` | `withPlugins.tsx:24-26, 120-154, 319-339` | `SKU-P2-4 … > 同一 props 引用重渲染不会重复执行插件渲染钩子` | ✅ 已修复 |
| SKU-P2-5 | P2 | URL 只写不读、不监听 `popstate`；持久化单 key 跨商品串味 | `UrlSync.onMount` 读回 + 注册 `popstate`（返回 cleanup）；`StatePersistence` 新增 `productKey`，键为 `key:productKey`，读取走 `context.setSelection` 白名单 | `UrlSyncPlugin/create.tsx:33-73`；`StatePersistencePlugin/create.tsx:42-47, 56-70` | `SKU-P2-5 … > popstate 后按 URL 还原选择，脏值被忽略` / `StatePersistence 的 productKey 让不同商品互不串味` | ✅ 已修复 |
| SKU-P2-6 | P2 | 运行时替换插件数组后新插件不执行 `onMount`（监听丢失） | 新增可选 `plugins` prop；HOC 按元素引用 diff，插件数组变化时对新实例补跑 `onMount` | `plugins/types.ts:107`；`withPlugins.tsx:96-97, 268-281` | `SKU-P2-6 … > 新插件注册后会跑一次 onMount，监听不丢` | ✅ 已修复 |
| SKU-P2-7 | P2 | 方向键直接触发选择（移动即选中），且跨行按过滤后下标导致列漂移；缺 roving tabindex / radio 语义 | KeyboardNav 改为方向键只 `focus()`，Enter/Space 交原生按钮；水平按完整候选列表循环找非禁用项，垂直按完整列表列位置就近落点；Core 补 `role="radiogroup"/"radio"`、`aria-checked`、单 Tab 落点 | `KeyboardNavPlugin/create.tsx:34-100`；`KeyboardNavPlugin/doc.json`；`SkuSelectorCore.tsx:121-152`；`demo/src/lib/selftest.tsx:217-233`；`test/plugins-extra.test.tsx:183-218` | `SKU-P2-7 … > → 只移动焦点不改变选择…` / `↓ 按完整候选列表的列位置落点，且行内只有一个 Tab 落点`（另在 `plugins-extra` 与 demo 自测同步更新） | ✅ 已修复 |
| SKU-P2-8 | P2 | 父组件内联 props 时每帧都跑 `onPropsChange`；摘要每次渲染 O(属性×选项) 查 label；`getContainer` 依赖漏 `containerRef` | `shallowEqualProps` 内容比较后才派发；`labelMap` 预建索引 + `labelOf`；`useImperativeHandle` 依赖补 `containerRef` | `withPlugins.tsx:28-38, 285-292`；`SkuSelectorCore.tsx:53-67, 77-93` | `SKU-P2-8 … > props 内容不变时 onPropsChange 不再触发` / `摘要按预建索引取 label，未选全时不渲染变体信息` | ✅ 已修复 |

**统计：14 / 14 已修复；跳过 0；阻塞 0。**

## 3. 验证记录

在 `e:\react-plugin-component` 下真实执行（2026-11-01）：

| 命令 | 结果 | 关键输出摘要 |
| --- | --- | --- |
| `pnpm --filter vane-sku test` | ✅ 通过 | `Test Files 6 passed (6)`；`Tests 70 passed (70)`；`Duration 13.72s`。新增 `test/regressions.test.tsx` 28 条全部通过（修复前基线：5 文件 / 42 用例） |
| `pnpm --filter vane-sku typecheck` | ✅ 通过 | `tsc --noEmit -p tsconfig.json`，无任何错误输出 |
| `pnpm --filter vane-sku lint` | ✅ 通过 | `✖ 33 problems (0 errors, 33 warnings)`，退出码 0。警告均为既有 `react-refresh/only-export-components` 与 `no-explicit-any`（规则本身为 warn），无新增 error |
| `pnpm --filter vane-sku build` | ✅ 通过 | `63 modules transformed`；`built in 3.24s`；根入口 `chunks/withPlugins-*.js` gzip **6.50 kB**（预算 7 kB 内）；`vite:dts` 声明文件生成成功 |

测试过程中刻意处理的非预期现象（均已在实现中修正，非放行）：
- 早期版本 `QuotaPlugin` 两条用例 5s 超时 → 原因是 `extendContext` 每帧产出新 `selection` 对象引发 self-triggering；已通过 `selectionCacheRef` + 引用比较修复。
- KeyboardNav 与 demo 自测的旧断言基于「方向键即选中」 → 属预期的语义变更，已同步更新测试与自测，非绕过。

## 4. 遗留问题与风险

| 风险 | 说明 | 影响 / 缓解 |
| --- | --- | --- |
| 受控模式为「务实降级」 | 点击时仍写入内部 state 并回调 `onSelectionChange`；宿主不回写 props 时表现为非受控 | 不阻塞使用；真正严格的「props 为唯一事实源」需要内核提供受控桥接能力（本次不改 plugin-core） |
| `quantity` 收敛发生在事件钩子期 | `onMount` / `onSkuChange` 内 `setState`，属异步批处理 | 极端情况下有 1 帧展示值由 `renderHeader` 的 clamp 兜底，测试已覆盖收敛后的最终态 |
| 事件 effect 依赖 `variant` 引用 | 变体对象引用变化也会派发一次 `onSkuChange`（即使内容相同） | 属预期行为（库存轮询场景依赖它）；重复派发由收敛比较与 `isSameSelection` 挡住，不会循环 |
| 归一化 `issues` 仅 `console.warn` | 生产环境静默 | 与既有插件日志风格一致；宿主如需上报可读 `normalizeSkuData().issues`（已导出） |
| 插件替换的粒度 | `plugins` 按数组元素引用 diff，传入新实例（如每次渲染都调工厂）会被视为替换 | 文档已注明「保持引用稳定」；元素引用不变时不会重复 `onMount` |

## 5. 未覆盖范围

- 未引入 `plugin-core` 改动，因此未覆盖「内核级受控 state 桥接」「内核自动派发 `onSkuChange`」等需要内核支持的能力（本次通过 HOC 侧实现达成同等效果）。
- 未新增 E2E / 浏览器真实键盘事件测试（现有为 happy-dom 下 `KeyboardEvent` 派发 + demo 内自测）。
- 未对 demo 页面样式、文档站文案做系统性回归（仅同步了 KeyboardNav 的行为描述与自测断言）。
- 未做体积预算的进一步压缩（本次根入口 gzip 6.50 kB，仍在预算内）。

## 6. 公开 API 变更（破坏性变更标注）

| 变更 | 是否破坏性 | 迁移方式 |
| --- | --- | --- |
| 新增 `selection` / `onSelectionChange` props | 否（可选） | 需要受控时显式传入；不传行为与之前一致 |
| `onValidSkuChange` 语义收紧：仅「选全且可售」时触发（缺货不触发） | **是（语义）** | 若宿主依赖「命中即回调」，改为监听 `onChange(selection, variant)` 并用 `isPurchasable(variant, { ignoreOutOfStock })` 自行判定 |
| KeyboardNav：方向键只移动焦点，Enter/Space 才选中 | **是（行为）** | 依赖「方向键即选中」的自动化脚本改为「方向键 + `click()`」两步；或直接调用 `selectOption` |
| `StatePersistence` 新增 `productKey`（同一个 `key` 下不同商品曾互相串味） | **是（默认值语义）** | 单面板 / 单商品场景无需改动；多商品复用同一 `key` 时**建议必传** `productKey`，否则仍共用同一存储键 |
| 新增 `plugins` prop、`SkuPluginContext` 新增 `attributes / variants / ignoreOutOfStock / purchasable / setSelection` | 否（增量） | 现有插件无需改动；自定义插件可从 context 直接读取归一化数据 |
| 新增公开纯函数导出：`isPurchasable / effectiveVariants / normalizeSkuData / normalizeSelection / isSameSelection / remainingQuota / quantityUpper / formatPrice / formatPriceValue` 及类型 `NormalizedSkuData / AvailabilityOptions / Availability` | 否（增量） | 可直接 `import ... from "vane-sku"` |
| 价格展示统一两位小数（如 `¥199` → `¥199.00`） | **是（展示）** | 若需旧格式，传入 `PriceLink` 的 `currency` 或自写 overlay 插件 |
