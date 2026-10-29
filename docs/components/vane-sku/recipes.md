# 规格选择 · 组合配方

配方 = 一组插件的预设组合，用来降低「不知道该装哪几个」的成本。**配方只是快捷方式，不是白名单**——任何插件都能单独引入。

## 电商全量（推荐起步）

价格 + 限购 + 切主图，一次到位：

```tsx
import { createSkuSelector } from "vane-sku";
import { createPriceLinkPlugin } from "vane-sku/custom-plugins/PriceLinkPlugin";
import { createQuotaPlugin } from "vane-sku/custom-plugins/QuotaPlugin";
import { createImageLinkPlugin } from "vane-sku/custom-plugins/ImageLinkPlugin";

export const SkuFull = createSkuSelector([
  createPriceLinkPlugin({ currency: "¥", showOriginal: true, discountText: "限时8折" }),
  createQuotaPlugin({ purchasedCount: 0 }),
  createImageLinkPlugin({ onImageChange: setMainImage }),
]);
```

## 只要价格联动

```tsx
export const SkuPrice = createSkuSelector([
  createPriceLinkPlugin({ discountText: "限时8折" }),
]);
```

## 限量商品（限购 + 价格，不要切图）

```tsx
export const SkuLimited = createSkuSelector([
  createPriceLinkPlugin(),
  createQuotaPlugin({
    purchasedCount,
    onExceed: () => toast("已达每人限购上限"),
  }),
]);
```

## 与 vane-gallery 联动（选规格切主图）

`ImageLink` 只负责把图抛出来，**不渲染 UI**，主图仍由 gallery 渲染——这样规格联动与图片渲染彻底解耦：

```tsx
const [mainIndex, setMainIndex] = React.useState(0);

const Sku = createSkuSelector([
  createImageLinkPlugin({
    onImageChange: (image) => setMainIndex(images.findIndex((i) => i.src === image)),
  }),
]);

<>
  <Gallery images={images} activeIndex={mainIndex} onActiveChange={setMainIndex} />
  <Sku attributes={attributes} variants={variants} />
</>;
```

## 动态引入（低频 / 重型插件）

```tsx
const { createQuotaPlugin } = await import("vane-sku/custom-plugins/QuotaPlugin");
```

## 推荐做法

- 常用组合沉淀为配方导出在业务侧（3–5 个起步即可）；
- 插件一律走子路径按需引入（ADR-6），只有确实全都要用才引 `vane-sku/custom-plugins` 桶；
- 加购/下单按钮**不要**做进插件——它是强业务耦合，交给宿主的 `after` 插槽注入，用 `Quota` 暴露的 `canPurchase` 决定是否禁用。
