/**
 * 场景 09 · 评论墙
 *
 * 三张卡 + 评价 + 悬停，验证「同一套插件在多实例下不串状态」：
 * 每张卡有独立的 sharedData / 总线 / state，点其中一张的收藏不会影响另外两张。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createHoverPlugin,
  createImagePlugin,
  createPriceCalculatorPlugin,
  createReviewPlugin,
} from "vane-card/custom-plugins";
import { wallProducts } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "review-wall",
  title: "评论墙",
  group: "内容",
  industry: "通用",
  ref: { label: "UGC 卡片墙", url: "https://github.com/frankvane/vane-components" },
  pain: "一屏十几张卡同时存在，最容易出的是「状态串了」和「悬停时全部一起动」。",
  plugs: [
    { fn: "createImagePlugin", why: "每张卡自己的主图" },
    { fn: "createReviewPlugin", cfg: "showRating: true, showReviewCount: true", why: "评分与评价数" },
    { fn: "createPriceCalculatorPlugin", why: "价格（同一套算法，多实例互不影响）" },
    { fn: "createHoverPlugin", cfg: "enableShadow: true", why: "单卡悬停反馈" },
  ],
  props: ["padding={0}"],
  note: "插件实例是「每次 withPlugins 一份」还是「每个组件实例一份」？这里是后者 —— 状态隔离靠 React 实例，不靠全局。",
};

const Card = withPlugins(CardCore, {
  plugins: [
    createImagePlugin(),
    createReviewPlugin({ showRating: true, showReviewCount: true, enableUserReview: false }),
    createPriceCalculatorPlugin({ showDiscount: true, showSavings: true }),
    createHoverPlugin({ enableShadow: true, enableScale: false, shadowIntensity: "light" }),
  ],
});

const WALL = wallProducts().slice(0, 4);

export default function ReviewWall() {
  return (
    <div className="scn-wall">
      {WALL.map((item) => (
        <Card key={String(item.id)} cardId={String(item.id)} data={item} padding={0}>
          <div className="scn-content">
            <div className="scn-content__title">{item.title}</div>
            <div className="scn-content__sub">{item.subtitle ?? "编辑部选品"}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
