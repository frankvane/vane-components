<p align="center">
  <a href="https://www.npmjs.com/package/vane-sku"><img src="https://img.shields.io/npm/v/vane-sku.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/vane-sku"><img src="https://img.shields.io/npm/dm/vane-sku.svg" alt="npm downloads" /></a>
  <a href="https://chinavane.netlify.app/"><img src="https://img.shields.io/badge/demo-online-brightgreen.svg" alt="demo" /></a>
</p>
# 规格选择

> 插件式 React SKU 规格选择引擎：组合矩阵 / 禁用推导 / 价格联动 / 限购校验

`vane-sku` 解决的是「多规格商品怎么选」这一件事：给出属性定义与变体列表，它负责

- **组合矩阵 + 禁用推导**（核心能力，内置在 core）：选了「蓝」之后，所有「没有蓝色变体」的尺码自动置灰 —— 而不是让用户点了才发现无货；
- 价格联动 / 限购校验 / 规格切主图等长尾能力，做成**按需子路径插件**，用几个装几个。

与 `vane-card` 已有的 `SKUPlugin` 的关系：后者是「卡片内的轻量选规格」，没有禁用推导与限购校验；`vane-sku` 是独立领域引擎，可脱离卡片单独使用。二者并存，互不替代。

## 安装

```bash
npm install vane-sku
```

## 30 秒上手

```tsx
import { createSkuSelector } from "vane-sku";
import type { SkuAttribute, SkuVariant } from "vane-sku";
import { createPriceLinkPlugin } from "vane-sku/custom-plugins/PriceLink";
import { createQuotaPlugin } from "vane-sku/custom-plugins/Quota";
import { createImageLinkPlugin } from "vane-sku/custom-plugins/ImageLink";

const attributes: SkuAttribute[] = [
  { name: "颜色", options: [{ id: "red", label: "红" }, { id: "blue", label: "蓝" }] },
  { name: "尺码", options: [{ id: "s", label: "S" }, { id: "m", label: "M" }, { id: "l", label: "L" }] },
];

// 故意不给 blue-l：选蓝色后「L」会被禁用推导自动置灰
const variants: SkuVariant[] = [
  { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, originalPrice: 299, stock: 5, quota: 2 },
  { sku: "red-m", attrValues: { 颜色: "red", 尺码: "m" }, price: 219, stock: 3 },
  { sku: "blue-s", attrValues: { 颜色: "blue", 尺码: "s" }, price: 209, stock: 8 },
  { sku: "blue-m", attrValues: { 颜色: "blue", 尺码: "m" }, price: 229, stock: 6 },
];

const Sku = createSkuSelector([
  createPriceLinkPlugin({ discountText: "限时8折" }),
  createQuotaPlugin({ purchasedCount: 1 }),
  createImageLinkPlugin({ onImageChange: setMainImage }),
]);

<Sku
  attributes={attributes}
  variants={variants}
  defaultSelection={{ 颜色: "red", 尺码: "s" }}
  onChange={(selection, variant) => console.log(selection, variant?.sku)}
/>;
```

## 数据模型

```ts
interface SkuOption   { id: string; label: string; image?: string }        // 稳定 id，非展示字符串
interface SkuAttribute{ name: string; options: SkuOption[] }
interface SkuVariant  { sku: string; attrValues: Record<string, string>;   // 值为 optionId
                        price?: number; originalPrice?: number;
                        stock?: number; image?: string; quota?: number }
```

`option.id` 用稳定标识而非展示文案，是禁用推导与 i18n 的刚需（同文案不同义、多语言都能正确区分）。

## 禁用推导怎么算

对每个属性的每个候选选项，把它临时代入当前选择，检查**是否存在变体**匹配所有已选属性：

- 存在 → 该选项可选；
- 不存在（是死路）→ 置灰。

`ignoreOutOfStock`（默认 `true`）决定缺货变体（`stock === 0`）是否参与推导：开启时，通往「只有缺货变体」的选项同样被置灰。

## 插件（12 个，全部按需子路径）

### 价格与库存

| 插件 | 子路径 | 作用 |
| --- | --- | --- |
| `PriceRange` | `.../custom-plugins/PriceRange` | 未选全时展示价格区间（¥199–¥269） |
| `PriceLink` | `.../custom-plugins/PriceLink` | 命中变体后展示单价 + 原价删除线 + 折扣文案 |
| `StockStatus` | `.../custom-plugins/StockStatus` | 现货 / 仅剩 N 件 / 缺货 |
| `Quota` | `.../custom-plugins/Quota` | 限购校验：提示条 + `canPurchase` 门控 |
| `Quantity` | `.../custom-plugins/Quantity` | 数量步进，上限取 min(库存, 限购) |

### 信息与联动

| 插件 | 子路径 | 作用 |
| --- | --- | --- |
| `ImageLink` | `.../custom-plugins/ImageLink` | 规格切主图，只发事件（`onImageChange` / `sku:image`），不渲染 UI |
| `SkuCode` | `.../custom-plugins/SkuCode` | 货号 / SKU 编码展示 |
| `Analytics` | `.../custom-plugins/Analytics` | 埋点上报（`sku:mount` / `sku:change` / `sku:invalid`），不渲染 UI |

### 选择与交互

| 插件 | 子路径 | 作用 |
| --- | --- | --- |
| `ResetBar` | `.../custom-plugins/ResetBar` | 清空重选 |
| `KeyboardNav` | `.../custom-plugins/KeyboardNav` | 键盘漫游：←→ 同行、↑↓ 跨行，跳过置灰项 |
| `StatePersistence` | `.../custom-plugins/StatePersistence` | 选择态存 localStorage / sessionStorage |
| `UrlSync` | `.../custom-plugins/UrlSync` | 选择同步到 URL 查询串，可分享/刷新还原 |

插件一律走子路径按需引入（ADR-6），不进根入口。桶文件 `vane-sku/custom-plugins` 可一次引入全部（体积会变大，非推荐用法）。标注「不渲染 UI」的是事件型插件。

## 包体积

| 导入方式 | Gzip |
| --- | --- |
| 根入口 `vane-sku`（core + 装配 + 禁用推导 + 内联内核） | ~6.1 KB |
| 单个插件子路径（含 doc.json 元数据） | ~1.0–1.5 KB |

> 体积门：根 `≤7KB`、插件子路径各 `≤2KB`（`pnpm check` 卡）。根入口含内联的 `vane-plugin-core`（与 `vane-card` 同策略）；若改走 peer 外部化，根入口可降到 3KB 量级，代价是消费者需自行安装内核。

## 文档

- [API](../../docs/components/vane-sku/api.md)
- [插件目录](../../docs/components/vane-sku/plugins.md)
- [组合配方](../../docs/components/vane-sku/recipes.md)

## License

MIT
