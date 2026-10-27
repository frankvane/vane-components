/**
 * 场景 08 · 视频商详
 *
 * 视频代替主图做第一屏。要注意两点：
 *  1. 默认不自动播（带声会被浏览器拦，静音自动播也常常被用户嫌）
 *  2. 悬停播放要能暂停，且切到别的卡时不残留播放
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createActionsPlugin,
  createPriceCalculatorPlugin,
  createSKUPlugin,
  createVideoPlugin,
} from "vane-card/custom-plugins";
import { svgImage } from "../data/images";
import { CHAIR } from "../data/seed";
import videoUrl from "../assets/demo.mp4?url";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "video-detail",
  title: "视频商详",
  group: "商详",
  industry: "通用",
  ref: { label: "视频首屏", url: "https://github.com/frankvane/vane-components" },
  pain: "户外 / 家电类商品，图片说不清「用起来什么感觉」，但自动播视频又会被骂。",
  plugs: [
    { fn: "createVideoPlugin", cfg: "src: videoUrl, poster: poster, muted: true, playOnHover: true", why: "头部视频，悬停播放、移出暂停" },
    { fn: "createSKUPlugin", cfg: "attributes: attrs, variants: variants", why: "规格选择（这里用单属性）" },
    { fn: "createPriceCalculatorPlugin", cfg: "showDiscount: true", why: "价格区" },
    { fn: "createActionsPlugin", why: "加购" },
  ],
  props: ["padding={0}"],
  note: "Video 与 Gallery 同时装时，Gallery 会声明 media.handledByGallery，Video 自动让位 —— 避免两个播放器抢同一个位置。",
};

const Card = withPlugins(CardCore, {
  plugins: [
    createVideoPlugin({
      src: videoUrl,
      poster: svgImage({ label: "露营椅 · 视频封面", width: 480, height: 270 }),
      muted: true,
      playOnHover: true,
      controls: true,
    }),
    createSKUPlugin({
      attributes: [{ name: "配色", options: ["沙色", "墨绿"] }],
      variants: [
        { sku: "CH-SAND", attrs: { 配色: "沙色" }, price: 459, stock: 48 },
        { sku: "CH-GREEN", attrs: { 配色: "墨绿" }, price: 479, stock: 12 },
      ],
    }),
    createPriceCalculatorPlugin({ showDiscount: true, showSavings: true }),
    createActionsPlugin(),
  ],
});

export default function VideoDetail() {
  return (
    <Card cardId="scn-video" data={CHAIR} padding={0}>
      <div className="scn-content">
        <div className="scn-content__title">{CHAIR.title}</div>
        <div className="scn-content__sub">把鼠标移到视频上：播放；移开：暂停</div>
      </div>
    </Card>
  );
}
