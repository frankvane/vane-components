/**
 * 场景 15 · 演出票务：SKU 是「场次 × 票档」
 *
 * 票务的 SKU 组合是**笛卡尔积**：2 个场次 × 2 个票档 = 4 个可售组合，
 * 每个组合的剩余张数单独算。这和服饰的「颜色 × 尺码」形状一样，
 * 但语义完全不同 —— 服饰的库存是「件」，票务是「张」，且不能合并发货。
 *
 * 另一个行业专属点：开票倒计时。票不是随时能买，倒计时结束才放票，
 * 所以 Countdown 在这里不是营销装饰，是**业务状态**。
 */
import React from "react";
import { CardCore, withPlugins } from "vane-card";
import {
  createCountdownPlugin,
  createImagePlugin,
  createInventoryPlugin,
  createQuantityPlugin,
  createPriceCalculatorPlugin,
  createSKUPlugin,
} from "vane-card/custom-plugins";
import { TICKET, skuVariantsOf } from "../data/seed";
import type { ScenarioMeta } from "./types";

export const meta: ScenarioMeta = {
  id: "ticket-session",
  title: "票务：场次 × 票档",
  group: "商详",
  industry: "演出票务",
  ref: { label: "演出票务（场次 + 票档 + 放票倒计时）", url: "https://github.com/frankvane/vane-components" },
  pain: "「哪个场次、哪一档、还剩几张、什么时候放票」四个变量同时在变，用户很容易选到已售罄的组合。",
  plugs: [
    { fn: "createImagePlugin", cfg: "alt: TICKET.title", why: "剧照是票务的第一说服力，也给左上角的倒计时留出落点" },
    { fn: "createSKUPlugin", cfg: "attributes: attrs, variants: variants", why: "场次 × 票档，每个组合独立库存" },
    { fn: "createPriceCalculatorPlugin", cfg: "showOriginalPrice: true", why: "票档就是价格：切票档价格必须跟着变" },
    { fn: "createCountdownPlugin", cfg: "endTimestamp: opensAt, prefix: \"开票\"", why: "放票是业务状态，不是营销装饰" },
    { fn: "createQuantityPlugin", cfg: "min: 1, max: 4", why: "票务普遍限购 4 张，这是规则不是库存" },
    { fn: "createInventoryPlugin", cfg: "lowStockThreshold: 6", why: "剩余几张要露出来，用户会据此换档" },
  ],
  props: ["padding={16}"],
  note: "限购和库存是两件事：Quantity 的 max 取「限购 4」和「剩余张数」的较小值，别只写一个。",
};

/** 放票时间：模块顶层算一次，避免每次渲染都变（会不停重挂倒计时） */
const OPENS_AT = Date.now() + 1000 * 60 * 137;

const Card = withPlugins(CardCore, {
  plugins: [
    createImagePlugin({ alt: TICKET.title }),
    createSKUPlugin({ attributes: TICKET.attributes, variants: skuVariantsOf(TICKET) }),
    createPriceCalculatorPlugin({ showOriginalPrice: true }),
    createCountdownPlugin({ endTimestamp: OPENS_AT, prefix: "开票" }),
    createQuantityPlugin({ min: 1, max: 4 }),
    createInventoryPlugin({ lowStockThreshold: 6 }),
  ],
});

export default function TicketSession() {
  return (
    <Card cardId="scn-ticket" data={TICKET} padding={16}>
      <div className="scn-content" style={{ paddingTop: 26 }}>
        <div className="scn-content__title">{TICKET.title}</div>
        <div className="scn-content__sub">上海 · 兰心大戏院 · 105 分钟无中场</div>
      </div>
    </Card>
  );
}
