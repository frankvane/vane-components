/**
 * 场景 13 · 美妆：色号即 SKU，图必须跟着换
 *
 * 美妆的转化全靠「这个色上我嘴是什么样」。所以色号不是普通属性 ——
 * 选一个色号，主图必须同步换成那个色的实拍，否则用户只能靠想象。
 *
 * 技术上有两条路：Gallery 自己管图集（点缩略图切图），SKU 管色号（写总线）。
 * 两者都订阅 `sku.image`：SKU 选中色号 → 写 `sku.variant` → Gallery/Image 换图。
 * 这页装的是 Gallery，所以切色号时图集的首图会跟着变。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createCouponPlugin,
  createGalleryPlugin,
  createPriceCalculatorPlugin,
  createSKUPlugin,
} from "vane-card/custom-plugins";
import { LIPSTICK, skuVariantsOf } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "beauty-shade",
  title: "美妆：色号即 SKU",
  group: "商详",
  industry: "美妆",
  ref: { label: "美妆商详（色号图集 + 小样）", url: "https://github.com/frankvane/vane-components" },
  pain: "选色号不换图，等于让用户闭眼下单；换成别的色，图却还是上一支。",
  plugs: [
    { fn: "createGalleryPlugin", cfg: "images: shots, showThumbnails: true", why: "多角度图集，缩略图切换" },
    { fn: "createSKUPlugin", cfg: "attributes: attrs, variants: variants", why: "色号是 SKU，选中会写 sku.variant" },
    { fn: "createPriceCalculatorPlugin", cfg: "showOriginalPrice: true", why: "妆效再好看也要给价：色号切换后价格同步" },
    { fn: "createCouponPlugin", cfg: "coupons: coupons", why: "小样券是美妆的常规钩子，和色号互不干扰" },
  ],
  props: ["padding={16}"],
  note: "Gallery 的 images 与 SKU 的 variant.image 是两套来源：前者是「这一支的图集」，后者是「这个色号的主图」。别指望它们自动同步，用总线里的 sku.image 对齐。",
};

const SHOTS = LIPSTICK.images ?? [LIPSTICK.image].filter(Boolean);

const COUPONS = [
  // 「赠小样」不是券（券只表达「减多少钱」），赠品属于服务承诺，别硬塞进券里
  { code: "首单立减 20", discount: 20, minAmount: 129 },
  { code: "两支再减 26", discount: 26, minAmount: 258 },
];

const Card = withPlugins(CardCore, {
  plugins: [
    createGalleryPlugin({ images: SHOTS, showThumbnails: true }),
    createSKUPlugin({ attributes: LIPSTICK.attributes, variants: skuVariantsOf(LIPSTICK) }),
    createPriceCalculatorPlugin({ showOriginalPrice: true }),
    createCouponPlugin({ coupons: COUPONS }),
  ],
});

export default function BeautyShade() {
  return (
    <Card cardId="scn-beauty" data={LIPSTICK} padding={16}>
      <div className="scn-content">
        <div className="scn-content__title">{LIPSTICK.title}</div>
        <div className="scn-content__sub">换色号看主图：图集首图会跟着变</div>
      </div>
    </Card>
  );
}
