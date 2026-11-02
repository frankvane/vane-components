import React from "react";
import { createCouponCard } from "vane-coupon";
import type { CouponData } from "vane-coupon";
import { createCountdownPlugin } from "vane-coupon/custom-plugins/CountdownPlugin";

/**
 * 装配工厂在模块顶层调用（渲染体内调用会每次渲染造新实例，重挂载丢状态）。
 * startAt 设在 20 秒后：等 20 秒可看到到点 autoStart 自动进入可领取。
 */
const CountdownCoupon = createCouponCard([
  createCountdownPlugin({
    startAt: Date.now() + 20_000,
    tickMs: 1000,
    autoStart: true,
    onFire: () => console.log("[countdown] 开抢！"),
  }),
]);

export const meta = {
  slug: "countdown",
  title: "开抢倒计时",
  group: "plugin" as const,
  intro:
    "startAt 未到时渲染「距开抢 HH:MM:SS」；到点 autoStart 自动进入 available（本页 20 秒后开抢），并触发 onFire。",
};

export default function CountdownDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <CountdownCoupon
        coupon={{ id: "cd1", title: "20 秒后自动开抢", amount: 30, threshold: 199 } as CouponData}
      />
    </div>
  );
}
