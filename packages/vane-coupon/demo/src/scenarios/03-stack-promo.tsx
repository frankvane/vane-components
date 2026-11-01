import React from "react";
import { createCouponCard } from "vane-coupon";
import {
  createChannelPlugin,
  createSharePlugin,
  createStackPlugin,
} from "vane-coupon/custom-plugins";
import type { ScenarioMeta } from "./types";

/**
 * 03 · 大促叠券
 *
 * 叠加规则 + 渠道限定 + 分享裂变，是大促券包页的三件套。
 * 全部是无状态氛围插件，装配多也不会互相干扰。
 */
export const meta: ScenarioMeta = {
  id: "stack-promo",
  title: "大促叠券",
  group: "大促叠加",
  ref: { label: "大促主会场 · 券包页", url: "https://vane.dev/examples/coupon/stack-promo" },
  pain: "多券叠加规则复杂：能不能叠、哪些渠道领、怎么分享给好友凑单，都要在票面上说清。",
  plugs: [
    { fn: "createStackPlugin", why: "「可叠加」角标：stackable 数据源驱动，不可叠时默认不展示" },
    { fn: "createChannelPlugin", why: "渠道限定标签（仅 APP / 仅新客），领错渠道的客诉直接归零" },
    { fn: "createSharePlugin", why: "footer 分享按钮，裂变动线直接长在券上" },
  ],
  props: ["coupon={coupon}"],
  note: "三个都是纯展示/回调插件，没有任何状态机依赖，可与其他场景自由组合。",
};

const Coupon = createCouponCard([
  createStackPlugin(),
  createChannelPlugin(),
  createSharePlugin(),
]);

export default function Stage() {
  return (
    <Coupon
      coupon={{
        id: "c-stack",
        title: "跨店每满减叠加券",
        amount: 50,
        threshold: 300,
        stackable: true,
        channels: ["仅 APP", "仅新客"],
      }}
      containerStyle={{ maxWidth: 420, margin: "0 auto" }}
    />
  );
}
