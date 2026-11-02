import React from "react";
import { createCouponCard } from "vane-coupon";
import type { CouponData } from "vane-coupon";
import { createAnalyticsPlugin } from "vane-coupon/custom-plugins/AnalyticsPlugin";

/** 装配工厂在模块顶层调用（渲染体内调用会每次渲染造新实例，重挂载丢状态）。 */
const TrackedCoupon = createCouponCard([
  createAnalyticsPlugin({
    onEvent: (e) => console.log("[analytics 回调]", e),
    // 可选：接入宿主埋点总线
    // transport: (e) => tracker.track(e.event, e.payload),
  }),
]);

export const meta = {
  slug: "analytics",
  title: "行为埋点",
  group: "plugin" as const,
  intro:
    "无 UI 插件：mount / 领取 / 异常三类事件双通道上报（onEvent 回调 + bus.emit，事件名 coupon:mount / coupon:claim / coupon:error，另有 coupon:analytics 包装通道）。打开控制台看输出。",
};

export default function AnalyticsDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <TrackedCoupon coupon={{ id: "an1", title: "挂载即上报 coupon:mount", amount: 10, threshold: 0 } as CouponData} />
    </div>
  );
}
