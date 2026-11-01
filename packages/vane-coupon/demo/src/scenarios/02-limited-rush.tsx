import React from "react";
import { createCouponCard } from "vane-coupon";
import {
  createClaimStatePlugin,
  createCountdownPlugin,
  createProgressPlugin,
  createQuotaPlugin,
} from "vane-coupon/custom-plugins";
import type { ScenarioMeta } from "./types";

/**
 * 02 · 限量抢券
 *
 * 倒计时制造「还没开始」的蓄水期，进度条制造「快抢完」的紧迫感——
 * 都是 before/after 区的无状态氛围插件，核心状态机照常工作。
 */
export const meta: ScenarioMeta = {
  id: "limited-rush",
  title: "限量抢券",
  group: "限量抢购",
  ref: { label: "大促会场 · 整点抢券", url: "https://vane.dev/examples/coupon/limited-rush" },
  pain: "限量券要的是氛围：距开始有倒计时、剩余额度有进度，否则用户感知不到紧迫。",
  plugs: [
    {
      fn: "createCountdownPlugin",
      cfg: "startAt: Date.now() + 3600_000",
      why: "票面上方倒计时角标，到点 onFire 回调可接自动刷新",
    },
    { fn: "createProgressPlugin", why: "已领 720/1000 的进度条，剩 20% 进入紧迫配色" },
    { fn: "createQuotaPlugin", why: "每人限领 1 张，抢购场景必配防刷提示" },
    { fn: "createClaimStatePlugin", why: "状态机按钮：抢完自动降级「已抢光」，不再响应点击" },
  ],
  props: ["coupon={coupon}"],
  note: "Countdown 在 before 区（票面上方角标），Progress 在 after 区（票面下方信息行）。",
};

const Coupon = createCouponCard([
  createCountdownPlugin({ startAt: Date.now() + 3600_000 }),
  createProgressPlugin(),
  createQuotaPlugin(),
  createClaimStatePlugin(),
]);

export default function Stage() {
  return (
    <Coupon
      coupon={{
        id: "c-rush",
        title: "整点神券 · 限量抢",
        amount: 100,
        threshold: 599,
        total: 1000,
        claimed: 720,
        quota: 1,
      }}
      containerStyle={{ maxWidth: 420, margin: "0 auto" }}
    />
  );
}
