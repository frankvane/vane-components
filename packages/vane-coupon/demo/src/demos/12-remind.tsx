import React from "react";
import { createCouponCard } from "vane-coupon";
import type { CouponData } from "vane-coupon";
import { createRemindPlugin } from "vane-coupon/custom-plugins/RemindPlugin";
import { createCountdownPlugin } from "vane-coupon/custom-plugins/CountdownPlugin";

/**
 * 装配工厂在模块顶层调用（渲染体内调用会每次渲染造新实例，重挂载丢状态）。
 * 配倒计时让相位停在「未开始」，提醒开关只在 idle 相位出现。
 */
const RemindCoupon = createCouponCard([
  createRemindPlugin({ onRemind: (on) => console.log("[remind]", on ? "已设提醒" : "已取消提醒") }),
  createCountdownPlugin({ startAt: Date.now() + 3600_000 }),
]);

export const meta = {
  slug: "remind",
  title: "开抢提醒",
  group: "plugin" as const,
  intro:
    "仅 idle（未开抢）相位渲染「开抢提醒」开关（aria-pressed），切换写 state.reminded 并触发 onRemind；开抢后自动消失。",
};

export default function RemindDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <RemindCoupon
        coupon={{ id: "rm1", title: "1 小时后开抢 · 可设提醒", amount: 40, threshold: 299 } as CouponData}
      />
    </div>
  );
}
