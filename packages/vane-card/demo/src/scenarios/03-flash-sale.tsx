/**
 * 场景 03 · 秒杀倒计时
 *
 * 时间压力 + 库存压力 + 价格锚点，三件事要同时出现在一屏：
 * 倒计时在 overlay 上，低库存在 overlay 另一角，价格在 footer。它们互不遮挡。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createActionsPlugin,
  createBadgePlugin,
  createCountdownPlugin,
  createImagePlugin,
  createInventoryPlugin,
  createPriceCalculatorPlugin,
} from "vane-card/custom-plugins";
import { MUG } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "flash-sale",
  title: "秒杀倒计时",
  group: "交易",
  ref: { label: "限时特卖卡形态", url: "https://github.com/frankvane/vane-components" },
  pain: "倒计时、库存告警、折扣价三个催促点同时存在时，很容易互相遮挡或互相打断。",
  plugs: [
    { fn: "createCountdownPlugin", cfg: "durationMs: 3 * 60 * 60 * 1000, prefix: \"⏰\"", why: "右上角倒计时（每秒只重渲染自己）" },
    { fn: "createInventoryPlugin", cfg: "lowStockThreshold: 8", why: "左下角「仅剩 4 件」" },
    { fn: "createBadgePlugin", cfg: 'text: "限时", type: "sale"', why: "左上角活动角标" },
    { fn: "createPriceCalculatorPlugin", cfg: "showDiscount: true, showSavings: true", why: "折扣价与省多少" },
    { fn: "createImagePlugin", why: "商品主图" },
    { fn: "createActionsPlugin", why: "立即抢购" },
  ],
  props: ["padding={0}"],
  note: "倒计时的 endTimestamp 应该由服务端下发；客户端算「还有多久」会因为改系统时间而失效。",
};

const Card = withPlugins(CardCore, {
  plugins: [
    createCountdownPlugin({ durationMs: 3 * 60 * 60 * 1000, prefix: "⏰" }),
    createInventoryPlugin({ lowStockThreshold: 8 }),
    createBadgePlugin({ text: "限时", type: "sale", position: "top-left" }),
    createPriceCalculatorPlugin({ showDiscount: true, showSavings: true }),
    createImagePlugin({ alt: MUG.title }),
    createActionsPlugin({ cartButtonText: { add: "立即抢购", remove: "已加入" } }),
  ],
});

export default function FlashSale() {
  return (
    <Card cardId="scn-flash" data={MUG} padding={0}>
      <div className="scn-content">
        <div className="scn-content__title">{MUG.title}</div>
        <div className="scn-content__sub">前 100 件 8 折 · 售完即止</div>
      </div>
    </Card>
  );
}
