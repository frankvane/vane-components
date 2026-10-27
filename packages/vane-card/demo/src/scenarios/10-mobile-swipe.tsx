/**
 * 场景 10 · 移动端横滑卡
 *
 * 窄卡（240px）+ 横滑容器。ResponsivePlugin 看的是**卡片自身宽度**，
 * 所以同一份组件放进横滑位也会自动切成窄版，而不是「以为自己是桌面」。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createActionsPlugin,
  createImagePlugin,
  createPriceCalculatorPlugin,
  createResponsivePlugin,
} from "vane-card/custom-plugins";
import { wallProducts } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "mobile-swipe",
  title: "移动端横滑卡",
  group: "列表",
  industry: "通用",
  ref: { label: "横滑商品位", url: "https://github.com/frankvane/vane-components" },
  pain: "同一个商品卡，放在主图位、侧栏、横滑位宽度差 3 倍，媒体查询写死就会错位。",
  plugs: [
    { fn: "createResponsivePlugin", cfg: "breakpoints: { mobile: 280, tablet: 520, desktop: 880 }", why: "按卡片宽度切布局，而不是按 viewport" },
    { fn: "createImagePlugin", why: "窄版主图" },
    { fn: "createPriceCalculatorPlugin", cfg: "showDiscount: true", why: "窄版价格（只留现价与折扣）" },
    { fn: "createActionsPlugin", cfg: "showWishlistButton: false", why: "窄版只留一个按钮，避免挤成两行" },
  ],
  props: ["padding={0}", "containerStyle={{ width: 240 }}"],
  note: "横滑容器用 scroll-snap：手指划一次停一张，比自由滚动更容易点到想看的卡。",
  cardWidth: 260,
};

const Card = withPlugins(CardCore, {
  plugins: [
    createResponsivePlugin({ breakpoints: { mobile: 280, tablet: 520, desktop: 880 } }),
    createImagePlugin(),
    createPriceCalculatorPlugin({ showDiscount: true }),
    createActionsPlugin({ showWishlistButton: false }),
  ],
});

const SLIDE = wallProducts().slice(0, 6);

export default function MobileSwipe() {
  return (
    <div className="scn-swipe">
      {SLIDE.map((item) => (
        <Card
          key={String(item.id)}
          cardId={`swipe-${item.id}`}
          data={item}
          padding={0}
          containerStyle={{ width: 240 }}
        >
          <div className="scn-content">
            <div className="scn-content__title">{item.title}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
