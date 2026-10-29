# 19 · vane-sku 分析（新独立包 · 定位 / 与 vane-card 边界 / 数据模型 / 内核映射 / 体积口径 / SOP 抗辩）

> 状态：**决策已锁定（B1–B6 见第八章）· 待开工**（本文不改任何代码）
> 基线：仓库 `e:\react-plugin-component` @ 当前 HEAD；`vane-card@2.0.1`（已含 `SKUPlugin` + `QuantityPlugin` + `PriceCalculatorPlugin` + `InventoryPlugin` + `presets/sku-flow`）；`vane-plugin-core@0.1.0`
> 规划源：`next-batch-components-plan.html` 第 1 批（vane-sku = 规格选择引擎，chips：Combination / DisableRule / PriceLink / Quota）
> 关联：实施清单见 `tasks/20-vane-sku-实施清单.md`；家族范式见 `tasks/17`/`18`（vane-gallery）、`tasks/15`/`16`（vane-profile）
> 内核 API 权威定义：`packages/plugin-core/src/types.ts`、`src/react/{withPlugins,slots,usePluginRuntime}.tsx`

---

## 一、结论先行

1. **vane-sku 新建独立包 `packages/vane-sku`（B1 已定）。** 规划原文的"复用 vane-card 电商插件范式与样式令牌"被修正：经核查，`vane-card@2.0.1` **已经有一整套 SKU 能力**（基础选规格 + 数量 + 价格计算 + 库存 + `sku-flow` 配方），但它缺最难的 20%——**禁用推导**（选 A 后自动置灰无货/无变体的 B 选项）和**限购校验**（Quota）。vane-sku 定位为独立领域引擎，不绑死在 card 里，覆盖这块空白。

2. **vane-card 现有 SKU 能力"保留为卡内轻量版"，不抽不改（B1/B4）。** card 的 `SKUPlugin`/`sku-flow` 继续存在并对外暴露（外部 API `vane-card/custom-plugins/SKUPlugin`、`vane-card/presets/sku-flow` 不变，避免 breaking change）。vane-sku 是更全量的独立引擎，二者并存；未来若需要，card 可选地把 `SKUPlugin` 换成引用 vane-sku（不在本轮范围）。

3. **基于 `vane-plugin-core` 构建 + 显式渲染插槽（B2）。** 与 card/gallery 一致，白拿生命周期/事件总线/插槽。core = **选规格状态机 + 组合矩阵 + 禁用推导**（最难、最稳的部分留在内核）；`PriceLink`/`Quota`/`ImageLink` 做按需子路径插件。**零改动 `vane-plugin-core`**（已是 0.1.0，应维持稳定）。

4. **数据模型在 vane-card 形状上扩展（B3）。** `SKUAttribute{ name; options:{id,label,image?}[] }`（option 加稳定 id + 可选色块图）、`SKUVariant{ sku; attrValues:Record<name,optionId>; price?; stock?; image?; quota? }`（用 id 关联 + 加 `quota` 限购）。稳定 id 是禁用推导与 i18n 的刚需。

5. **禁用推导进 core，不是插件（B4，修正规划措辞）。** 规划把"DisableRule 禁用推导"列为「建议首发插件」，但禁用推导是最稳的算法、漏装就不置灰，故定为 **core 内置能力**；插件则按 SOP② 长尾发散扩到 **12 个**（价格与库存 5 / 信息与联动 3 / 选择与交互 4，其中 5 个事件型）。原候选 `ThumbPreview` 不单独成插件——core 在 `option.image` 存在时已直接渲染色块图（见第四章）。

6. **体积门口径按实测据实调整（B6，实现后修正）。** 规划给 `≤2.5KB`；grill 阶段估 `≤3.5KB`，但那是以「core 走 peer 外部化」为前提（参照 vane-profile 3.09KB）。实现确认 vane-sku 采用 **core devDep 内联**策略（与 vane-card 6.77KB 同派），core 会被打进 dist，实测根入口 gzip **6.08KB**，故预算据实上调到 **`≤7KB`**；三个插件子路径走 `./custom-plugins/*`，闭包含 doc.json 元数据，实测 1.0–1.5KB，预算各 **`≤2KB`**。仍远低于 36KB 红线，子路径保住 SOP⑤ 按需省体积。

7. **SOP 命中 5/5、红线 0（B2 抗辩后）。** 规划自评 5/5 原存疑（红线③"headless 引擎"），但显式把"禁用态/价格浮层/限购提示条"坐实为渲染插槽后，SOP④「天然渲染插槽」成立，红线③不触发（见第九章）。

---

## 二、定位与范围

### 2.1 一句话定位

> **SKU 规格选择引擎（独立领域引擎）**：以"选规格状态机 + 组合矩阵 + 禁用推导"为内核，把价格联动 / 限购校验 / 规格切主图外置为插件，SkuSelectorCore 只渲染规格按钮组（含禁用态）与选中摘要，长尾能力交给插槽与按需子路径。

### 2.2 规划原文 vs 本次分析

| 维度 | 规划原文（next-batch-components-plan.html） | 本次分析结论 |
| --- | --- | --- |
| 批次 | 第 1 批 · 商品页三件 | 同（与 gallery / coupon 同批） |
| 定位 | 规格选择引擎（组合矩阵 / 禁用推导 / 价格联动 / 限购校验） | 同，但**新建独立包**（非"复用 card 范式"的从属） |
| 首发插件 | Combination / DisableRule / PriceLink / Quota（4 chips） | **修正**：Combination+DisableRule=core 内置；插件扩到 **12 个**（用户要求"更多插件"） |
| 复用资产 | vane-card 电商插件范式与样式令牌 | **不依赖 vane-card**（硬约束 + 避免重叠）；沿用其数据模型词汇与 core 范式 |
| 体积预算 | ≤ 2.5KB（独立包根 gzip） | 推翻 → 根 `≤7KB`（实测 6.08KB，core 内联）+ 子路径各 `≤2KB`（B6，见第一章结论 6） |
| 工作量 | 3–4 天 | 见 `tasks/20`：P0–P6，M–L 量级 |

### 2.3 不在范围内（明确排除，避免范围蔓延）

- ❌ 不修改 `vane-plugin-core`（B2/B5 已核：现有 `renderHeader`/`renderOverlay`/`renderFooter` + before/after position 已覆盖全部插槽需求）
- ❌ 不依赖 `vane-card` 或复用其 `SKUPlugin` 代码（独立引擎；card 现有 SKU 能力保留不动）
- ❌ 不把加购/下单按钮做进 core（强业务耦合，交给宿主 `after` 插槽注入）
- ❌ 不做多 SKU 批量对比 / 购物车联动（属上层业务，不在选择器职责）
- ❌ 不做"规格 3D / AR 试穿"等需要外部依赖的能力（候选二期）

---

## 三、与 vane-card 现状的边界（B1 已定）

### 3.1 现状核查（实测，非推测）

`vane-card@2.0.1` 的 `src/components/CardPlugin/custom-plugins/SKUPlugin/index.tsx`（174 行）+ 配套插件已提供：

| 能力 | vane-card 现状 | vane-sku 是否覆盖 |
| --- | --- | --- |
| 基础选规格（attributes × options 按钮） | ✅ `Selector` 组件，纯字符串选项 | ✅ 重写（扩 id/image） |
| 变体精确匹配 | ✅ `matchVariant`（全选齐才命中） | ✅ 沿用思路 |
| 价格/库存总线联动 | ✅ `skuPrice`/`skuVariant`/`skuImage` 写入 + `PriceCalculatorPlugin`/`InventoryPlugin` | ✅ PriceLink/Quota 插件化 |
| 首屏默认规格 | ✅ `data.defaultAttrs` | ✅ 沿用 |
| **禁用推导（选 A 置灰无货 B）** | ❌ 每个按钮永远可点，错配只是不命中 | 🎯 **vane-sku core 核心卖点** |
| **限购校验（每人限购 N）** | ❌ 只有 `stock`（库存），无 per-user quota | 🎯 **vane-sku Quota 插件** |
| 规格色块图（option.image） | ❌ option 是纯字符串，无位 | ✅ 数据模型扩展 `options:{id,label,image?}` |

> 结论：vane-card 覆盖了 SKU 的**易实现 80%**（基础选择 + 总线联动 + 配方），vane-sku 的价值在**最难也最稳的 20%**（禁用推导 + 限购 + 色块图）。这正是独立成包、做全量引擎的理由——若只增强 card，所有用 SKU 的人都被迫引入 vane-card（36KB 包络），且偏离"通用领域引擎"定位。

### 3.2 B1 决策：独立包，card 并存

- vane-card 现有 `SKUPlugin` / `sku-flow` **对外 API 不变**（不抽、不改、不 deprecated 本轮）。
- vane-sku 全部新代码在 `packages/vane-sku`，数据模型词汇与 card 的 `name/attrs` 心智一致（便于未来反哺），但实现独立。

---

## 四、插件目录与内核边界（B2/B4）

> 状态列：🔧=core 内置能力（非插件）/ 🆕=本期新增插件 / 🟡=候选（可能并入 core 渲染，不阻塞主流程）。

| # | 名称 | 映射规划 chip | 状态 | 职责 | 钩子/槽位 |
| --- | --- | --- | --- | --- | --- |
| 1 | **组合矩阵 + 禁用推导** | Combination + DisableRule | 🔧 | 由 variants 派生有效组合全集；当前选择下计算每个 option 是否"死路"（选它后无任何有效变体）并置灰；支持 `ignoreOutOfStock` 配置 | core 内部纯函数 + 驱动 option 的 `disabled` 渲染态 |
| 2 | **选规格状态机** | —（引擎本质） | 🔧 | 单值/维选择、初始化默认规格、完整选择→匹配变体→emit `sku:change` | `onMount`/`onSelect`/`transformProps` + `context.bus.emit("sku:change")` |
| 3 | **`PriceLinkPlugin`** | PriceLink | 🆕 | 命中变体后渲染单价 + 原价删除线 + 折扣文案 | `renderOverlay` |
| 4 | **`PriceRangePlugin`** | —（价格区间） | 🆕 | 未选全时按当前选择过滤变体展示区间（¥199–¥229）；命中后让位给 PriceLink | `renderOverlay`（order 5） |
| 5 | **`StockStatusPlugin`** | —（库存） | 🆕 | 现货 / 仅剩 N 件 / 缺货（低库存阈值可配） | `renderHeader(after)` order 10 |
| 6 | **`QuotaPlugin`** | Quota | 🆕 | 限购校验：读 `variant.quota` + 已购数渲染提示条，`canPurchase` 写 state | `renderHeader(after)` order 15 + 事件钩子 |
| 7 | **`QuantityPlugin`** | —（数量） | 🆕 | 数量步进，上限 = min(库存, 限购, config.max)，数量写 state | `renderHeader(after)` order 20 |
| 8 | **`ImageLinkPlugin`** | —（规格切主图） | 🆕（事件型） | 命中变体带 `image` 时抛事件（回调 + 总线 `sku:image`），**不渲染 UI** | 事件钩子 |
| 9 | **`SkuCodePlugin`** | —（货号） | 🆕 | 命中变体后展示 SKU 编码，便于对单 / 报修 | `renderHeader(after)` order 50 |
| 10 | **`ResetBarPlugin`** | —（清空） | 🆕 | 一键清空重选，走 `context.clearSelection()` | `renderHeader(after)` order 40 |
| 11 | **`KeyboardNavPlugin`** | —（键盘漫游） | 🆕（事件型） | ←→ 同行切换、↑↓ 跨行跳转，自动跳过置灰项 | `onMount` 挂 keydown + 返回清理函数 |
| 12 | **`StatePersistencePlugin`** | —（本地记忆） | 🆕（事件型） | 选择存 localStorage/sessionStorage，挂载还原、清空删键 | 事件钩子 |
| 13 | **`UrlSyncPlugin`** | —（URL 同步） | 🆕（事件型） | 选择 ↔ 查询串（`?sku_颜色=red`）双向同步，可分享与刷新还原 | 事件钩子 |
| 14 | **`AnalyticsPlugin`** | —（埋点） | 🆕（事件型） | `sku:mount` / `sku:change` / `sku:invalid` 三类事件，回调 + 总线双通道 | 事件钩子 |

> **说明**：规划"4 chips"中 Combination/DisableRule 被合并为 core 内置能力（最稳算法，不可漏装）。插件按 SOP②「长尾发散」扩到 **12 个**：价格与库存 5 个、信息与联动 3 个、选择与交互 4 个；其中 5 个是**事件型**（不占渲染插槽）。原候选 `ThumbPreview` 不单独成插件 —— core 在 `option.image` 存在时已直接渲染色块图，没有插入点。
>
> **子路径命名（实现修正）**：原拟 `/pricing` `/quota` `/image`，但 `internal/build-config/discover-entries.mjs` 的入口自动发现只认
> `src/index.ts`（→`.`）、`src/<name>.ts`（→`./<name>`）、`src/custom-plugins/<Name>/index.ts`（→`./custom-plugins/<Name>`），
> 且 `components/` 属内部目录不发布。为与家族（vane-card / vane-lazy-image / vane-profile）及 `pnpm sync:exports` 保持一致，
> 最终采用 **`vane-sku/custom-plugins/<Name>`**（12 个）；另有桶文件 `vane-sku/custom-plugins`。

### 4.1 内核可提供的能力（复用 vane-plugin-core，零改动）

| 能力 | 内核钩子 / API | vane-sku 用法 |
| --- | --- | --- |
| 生命周期 | `onMount`/`onUnmount`/`onPropsChange` | 初始化默认规格、选择变化重算禁用集 |
| props 改写 | `transformProps(props)` | 外层可改写 attributes/variants（极少用） |
| 渲染插槽（3 类 + 前后） | `renderHeader`(before/after) / `renderOverlay` / `renderFooter` | before=标题、after=加购按钮区、overlay=价格浮层（B5 直接映射，零新增） |
| 上下文扩展 | `extendContext(ctx => ctx)` | Quota 注入 `canPurchase`；core 注入 `selection`/`disabledMap`/`variant` |
| 排序 | `config.order` 升序 → `priority` 降序 | 同家族 |
| 跨插件通信 | `context.bus`/`context.shared` | PriceLink/Quota/ImageLink 经 `variant` 协调；ImageLink emit `sku:image` |
| 强制刷新 | `context.forceUpdate` | core 改闭包选择/禁用集后必调（勿用 `coreRef.forceUpdate`，见 vane-waterfall 铁律） |

### 4.2 SkuSelectorCore 设计（B3/B5）

新增 `packages/vane-sku/src/`：

- `core/`：
  - `SkuSelectorCore.tsx`：渲染**规格按钮组（含禁用态）+ 选中摘要**两块选择器本体；外层 `withPlugins` 包裹；`composeSlots` 在 `children` 前后插入 before/after/overlay 插槽
  - `useSkuRuntime.ts`：封装 `usePluginRuntime`，`extendContext` 注入 `selection`/`disabledMap`/`variant`/`canPurchase`
  - `matrix.ts`：**组合矩阵 + 禁用推导纯函数**（单元可测）——`buildAvailability(attributes, variants, selection, opts)` → `{ disabled: Record<attrName, Set<optionId>>, availableCount }`
  - `createSkuSelector.tsx`：工厂 `createSkuSelector(runtimePlugins?, opts?)`
- `plugins/`：`PriceLinkPlugin` / `QuotaPlugin` / `ImageLinkPlugin`（三件套 `create.tsx` + `doc.json` + `index.ts` 挂 `.meta`）
- `index.ts`：导出 `SkuSelectorCore` + `createSkuSelector` + 类型 + core 纯函数

---

## 五、数据模型契约（B3）

```ts
// 属性定义：每个选项有稳定 id + 可选色块图
export interface SkuOption {
  id: string;          // 稳定标识（禁用推导/i18n 刚需，替代纯字符串）
  label: string;       // 展示文案
  image?: string;      // 色块图（颜色类规格）
}
export interface SkuAttribute {
  name: string;            // 如 "颜色"、"尺码"
  options: SkuOption[];
}

// 变体：用 optionId 关联，加 quota 限购
export interface SkuVariant {
  sku: string;                                  // 变体唯一键
  attrValues: Record<string, string>;            // { 颜色: "red", 尺码: "M" }（值为 optionId）
  price?: number;
  originalPrice?: number;
  stock?: number;                                // 库存（0 = 缺货）
  image?: string;                                // 变体主图（ImageLink 切换用）
  quota?: number;                                // 每人限购件数（Quota 插件用）
}

export interface SkuSelectorProps {
  attributes: SkuAttribute[];
  variants: SkuVariant[];
  defaultSelection?: Record<string, string>;      // 默认规格（optionId）
  ignoreOutOfStock?: boolean;                     // 缺货变体是否参与可用推导（默认 true）
  onChange?: (selection: Record<string,string>, variant: SkuVariant | null) => void;
  onValidSkuChange?: (variant: SkuVariant) => void;
  before?: React.ReactNode;                       // 标题/头部（→ renderHeader before）
  after?: React.ReactNode;                        // 加购/确认按钮区（→ renderHeader after / footer）
  overlay?: React.ReactNode;                      // 价格浮层（→ renderOverlay）
}
```

**禁用推导算法（`matrix.ts`，纯函数、可单测）**：
- 输入 `attributes / variants / 当前 selection / opts`
- 对每个"已选或未选"的属性 `Ai`，对每个候选 `option o`：以 `selection` 为基（若 `Ai` 已选则覆盖为 `o`，否则临时设 `o`），判定**是否存在变体**匹配所有"已选属性"（含该临时 o）；`ignoreOutOfStock` 为真时 `stock===0` 的变体视为不存在
- 不存在 → `o` 置灰（写入 `disabledMap[Ai].add(o.id)`）
- 输出 `disabledMap` + 各属性可选计数，供 Core 渲染禁用态、供"完整选择能否命中"判定

---

## 六、渲染面与插槽（B5）

- **core 渲染**：规格按钮组（每组一属性，按钮含 `disabled` 态与选中态）+ 选中摘要（`已选：颜色:红 / 尺码:M（SKU：R-M）` + 命中变体的 price/stock）
- **插槽映射（零改 core）**：
  - `before` → `renderHeader(position:"before")`：标题/头部，宿主注入
  - `after` → `renderHeader(position:"after")` 或 `renderFooter`：加购/确认按钮区，宿主注入（强业务不进 core）
  - `overlay` → `renderOverlay`：价格浮层，由 `PriceLink` 填充
  - `Quota` 提示条 → `renderHeader(position:"after")`（与 after 同区或独立段）
- **ImageLink**：不发 UI，仅 emit `sku:image` / 回调 `onImageChange`，让外层 gallery/card 切主图（规格图联动解耦）

---

## 七、依赖与体积（B6）

| 项 | 决策 |
| --- | --- |
| peer 依赖 | **仅 `react` / `react-dom`**（项目铁律：发布包只 peer 这两） |
| `vane-plugin-core` | `devDependency`（workspace:*），**构建时内联进 dist**（与 card/gallery/lazy-image 三包统一，非 peer 外部化） |
| `vane-card` | **零依赖**（独立引擎，避免重叠 + 违反硬约束） |
| 体积门（根） | `vane.sizeBudgetKb: 7`（gzip，实测 6.08KB；含选择器 + 组合矩阵 + 禁用推导 + 内联的 vane-plugin-core） |
| 体积门（子路径） | `vane.subpathBudgets: { "./custom-plugins/PriceLink": 2, "./custom-plugins/Quota": 2, "./custom-plugins/ImageLink": 2 }`（实测 1.0–1.5KB，闭包含 doc.json 元数据） |
| 包配置 | `sideEffects: false`、`files: ["dist"]`、`publishConfig.access: public`（与家族一致） |

> P1「内核依赖策略（peer 外部化 vs 内联）」经核查**已是统一 inline**（四包全 devDep 内联），本轮直接确认沿用，非"待定分裂"。

---

## 八、决策分支汇总（B1–B6）

| 分支 | 决策 | 结论 |
| --- | --- | --- |
| B1 立项形态 | 新独立包 `packages/vane-sku`，从零写；card 现有 SKU 保留并存 | 独立领域引擎 |
| B2 架构定位 | 基于 `vane-plugin-core` + 显式插槽；core=选规格+组合矩阵+禁用推导 | 回应红线③ |
| B3 数据模型 | 扩展 `options:{id,label,image?}` + `variant.attrValues` + `quota` | 稳定 id + 限购 |
| B4 插件/内核边界 | 禁用推导进 core；插件仅 PriceLink/Quota/ImageLink | 修正规划措辞 |
| B5 渲染面 | core 渲染选择器+摘要；before/after/overlay 映射现有钩子；ImageLink emit | 零改 core |
| B6 依赖/体积 | peer 仅 react；core 内联；零 card 依赖；根 3.5KB + 子路径各 1KB | 务实口径 |

---

## 九、SOP 命中与红线抗辩

| SOP | 命中 | 说明 |
| --- | --- | --- |
| ① 核心职责薄且稳定 | ✅ | core=选规格+矩阵+禁用推导，薄而稳定；价格/限购/切图外置 |
| ② 需求长尾发散 | ✅ | 插件可继续长尾：批量选、推荐选项、数量步进、规格对比 |
| ③ 清晰生命周期/事件 | ✅ | `onMount` 初始化、`onSelect`、`onValidSkuChange`、`sku:change` |
| ④ 天然渲染插槽 | ✅ | 规格按钮组/禁用态/价格浮层/限购提示条 = 显式插槽（B2 坐实） |
| ⑤ 按需加载省体积 | ✅ | ESM 子路径 `/pricing`/`/quota`/`/image` tree-shake |

**红线③抗辩（规划自评 5/5 原存疑，现已闭环）**：vane-sku 的核心算法（组合矩阵 + 禁用推导）确属逻辑编排，但它是**驱动显式渲染插槽的引擎**——禁用态直接改变 option 按钮渲染、价格/限购是插件填充的浮层/提示条——而非纯 headless。SOP④ 因此成立，红线③不触发。这是对规划原文"5/5"的最关键修正点。

---

## 十、风险评估

| 级别 | 风险 | 缓解 |
| --- | --- | --- |
| P1 | 禁用推导算法正确性（置灰误判/漏判） | 纯函数 + 单测覆盖典型矩阵（含缺货、部分选择、无匹配变体） |
| P2 | 体积门 3.5KB 实测超 | 禁用推导走纯函数子模块；若超则拆 `/matrix` 子路径或真减，按 ADR-6 不许静默调大 |
| P2 | 与 vane-card 数据模型心智不一致 | 保留 `name/attrs` 词汇，option 由 string→object 向前兼容说明写进 README |
| P1 | 插槽 API 与 core 不完全对齐 | B5 已核：renderHeader(before/after)/renderOverlay/renderFooter 全覆盖，零改 core |

---

## 十一、验收口径

- **功能**：给定 attributes+variants，选 A 后正确置灰"无有效变体"的 B 选项；完整选择命中变体并 emit `sku:change` 带 price/stock/quota；缺货变体按 `ignoreOutOfStock` 处理
- **插件**：PriceLink 渲染价格浮层、Quota 渲染限购条并暴露 `canPurchase`、ImageLink emit `sku:image`
- **体积**：根 `≤3.5KB`、子路径各 `≤1KB`（`pnpm check` 的 size gate）
- **闸门**：`pnpm verify` 全绿（lint/typecheck/test/check）+ 几何体检 + changeset 随包提交
- **发布**：`vane-sku@0.1.0`（首版，对齐 core 0.1.0 节奏），经 Clash 7890 代理发布 npmjs
