import React from "react";
import { createCouponCard } from "vane-coupon";
import type { CouponData } from "vane-coupon";
import { createHistoryPlugin } from "vane-coupon/custom-plugins/HistoryPlugin";

/** 装配工厂在模块顶层调用（渲染体内调用会每次渲染造新实例，重挂载丢状态）。 */
const HistoryCoupon = createCouponCard([createHistoryPlugin({ max: 3 })]);
const EmptyCoupon = createCouponCard([createHistoryPlugin()]);

export const meta = {
  slug: "history",
  title: "领取记录",
  group: "plugin" as const,
  intro:
    "coupon.history（{at, action}[]）按时间倒序渲染最近 max（默认 3）条；无记录时插件不渲染。",
};

export default function HistoryDemo() {
  const now = Date.now();
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <HistoryCoupon
        coupon={
          {
            id: "hs1",
            title: "最近 3 条记录",
            amount: 10,
            threshold: 0,
            history: [
              { at: now - 86400_000, action: "领取成功" },
              { at: now - 3600_000, action: "已使用" },
              { at: now - 60_000, action: "再次领取" },
              { at: now - 1000, action: "这条超出 max 不会显示" },
            ],
          } as CouponData
        }
      />
      <EmptyCoupon coupon={{ id: "hs2", title: "无记录 · 不渲染", amount: 5, threshold: 0 } as CouponData} />
    </div>
  );
}
