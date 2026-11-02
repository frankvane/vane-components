import React from "react";
import { createCouponCard } from "vane-coupon";
import type { CouponData } from "vane-coupon";
import { createSharePlugin } from "vane-coupon/custom-plugins/SharePlugin";

/** 装配工厂在模块顶层调用（渲染体内调用会每次渲染造新实例，重挂载丢状态）。 */
const ShareCoupon = createCouponCard([
  createSharePlugin({ onShare: (coupon) => console.log("[share]", coupon.id) }),
]);

export const meta = {
  slug: "share",
  title: "分享按钮",
  group: "plugin" as const,
  intro:
    "footer 槽次按钮：配置 onShare 才渲染，点击触发回调；未配置 onShare 时插件不渲染。",
};

export default function ShareDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <ShareCoupon coupon={{ id: "sh1", title: "点右下角分享这张券", amount: 25, threshold: 99 } as CouponData} />
    </div>
  );
}
