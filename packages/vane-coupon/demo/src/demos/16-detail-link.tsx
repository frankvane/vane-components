import React from "react";
import { createCouponCard } from "vane-coupon";
import type { CouponData } from "vane-coupon";
import { createDetailLinkPlugin } from "vane-coupon/custom-plugins/DetailLinkPlugin";

/** 装配工厂在模块顶层调用（渲染体内调用会每次渲染造新实例，重挂载丢状态）。 */
const HrefCoupon = createCouponCard([createDetailLinkPlugin({ href: "/help/coupon-rules" })]);
const DetailCoupon = createCouponCard([
  createDetailLinkPlugin({ onDetail: () => console.log("[detail] 打开详情弹层") }),
]);

export const meta = {
  slug: "detail-link",
  title: "详情入口",
  group: "plugin" as const,
  intro:
    "after 槽文字链：配 href 渲染 <a target=\"_blank\">，配 onDetail 渲染 <button>，两者都没有则不渲染；色值复用规则展开开关的同款链接色。",
};

export default function DetailLinkDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <HrefCoupon coupon={{ id: "dl1", title: "href 跳转形态", amount: 10, threshold: 0 } as CouponData} />
      <DetailCoupon coupon={{ id: "dl2", title: "onDetail 回调形态", amount: 20, threshold: 99 } as CouponData} />
    </div>
  );
}
