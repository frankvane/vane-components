import React from "react";
import { createCouponCard } from "vane-coupon";
import {
  createAnalyticsPlugin,
  createChannelPlugin,
  createClaimStatePlugin,
  createCopyCodePlugin,
  createCountdownPlugin,
  createDetailLinkPlugin,
  createHistoryPlugin,
  createProgressPlugin,
  createQuotaPlugin,
  createRemindPlugin,
  createRuleExpandPlugin,
  createSharePlugin,
  createStackPlugin,
  createValidityPlugin,
} from "vane-coupon/custom-plugins";
import type { ScenarioMeta } from "./types";

/**
 * 05 · 全功能中台
 *
 * 14 个插件全部装配：四段插槽各司其职（before 角标 / after 信息 / footer 操作 / 行为钩子），
 * 验证「多插件同槽排序（order 升序 → priority 降序）+ 单插件抛错隔离」都成立。
 */
export const meta: ScenarioMeta = {
  id: "full-stack",
  title: "全功能中台",
  group: "全量装配",
  ref: { label: "券系统中台 · 全能力演示", url: "https://vane.dev/examples/coupon/full-stack" },
  pain: "接入方想一次看全 14 个插件的真实排布与交互，逐页翻示例太慢。",
  plugs: [
    { fn: "createCountdownPlugin", cfg: "startAt: Date.now() + 3600_000", why: "before：开抢倒计时" },
    { fn: "createStackPlugin", why: "before：可叠加角标" },
    { fn: "createChannelPlugin", why: "before：渠道限定标签" },
    { fn: "createValidityPlugin", why: "after：有效期行，驱动状态机降级" },
    { fn: "createQuotaPlugin", why: "after：限领提示" },
    { fn: "createProgressPlugin", why: "after：限量进度条" },
    { fn: "createRuleExpandPlugin", why: "after：规则折叠" },
    { fn: "createCopyCodePlugin", why: "after：claimed 后的券码复制" },
    { fn: "createHistoryPlugin", why: "after：领取/使用记录" },
    { fn: "createDetailLinkPlugin", cfg: "href: \"https://vane.dev/examples/coupon/full-stack\"", why: "after：去使用跳转" },
    { fn: "createClaimStatePlugin", why: "footer：领取状态机主按钮" },
    { fn: "createSharePlugin", why: "footer：分享裂变" },
    { fn: "createRemindPlugin", why: "footer：开抢提醒" },
    { fn: "createAnalyticsPlugin", why: "无渲染：onMount 埋点上报，不动 UI" },
  ],
  props: ["coupon={coupon}"],
  note: "全量装配是压舱石场景：任何插件排序 / 隔离回归都会在这里先炸出来。",
};

const now = Date.now();

const Coupon = createCouponCard([
  createCountdownPlugin({ startAt: now + 3600_000 }),
  createStackPlugin(),
  createChannelPlugin(),
  createValidityPlugin(),
  createQuotaPlugin(),
  createProgressPlugin(),
  createRuleExpandPlugin(),
  createCopyCodePlugin(),
  createHistoryPlugin(),
  createDetailLinkPlugin({ href: "https://vane.dev/examples/coupon/full-stack" }),
  createClaimStatePlugin(),
  createSharePlugin(),
  createRemindPlugin(),
  createAnalyticsPlugin(),
]);

export default function Stage() {
  return (
    <Coupon
      coupon={{
        id: "c-full",
        title: "家电焕新专享券",
        amount: 30,
        threshold: 299,
        stackable: true,
        total: 1000,
        claimed: 720,
        quota: 2,
        channels: ["仅 APP"],
        code: "VD-2026-88XK",
        validFrom: now - 3 * 86_400_000,
        validTo: now + 4 * 86_400_000,
        rules: [
          "全平台通用，可与店铺优惠叠加使用",
          "下单满 299 元可用，家电类目除外",
          "领取后 4 天内有效，过期自动作废",
          "每单限用 1 张，不找零、不兑现",
        ],
        history: [
          { at: now - 2 * 86_400_000, action: "领取成功" },
          { at: now - 6 * 3600_000, action: "设置开抢提醒" },
        ],
      }}
      containerStyle={{ maxWidth: 420, margin: "0 auto" }}
    />
  );
}
