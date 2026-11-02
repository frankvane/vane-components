import React from "react";
import { createCouponCard } from "vane-coupon";
import type { CouponData } from "vane-coupon";
import { createCopyCodePlugin } from "vane-coupon/custom-plugins/CopyCodePlugin";
import { createClaimStatePlugin } from "vane-coupon/custom-plugins/ClaimStatePlugin";

/**
 * 装配工厂在模块顶层调用（渲染体内调用会每次渲染造新实例，重挂载丢状态）。
 * 配 ClaimState 让初始相位是 available，点击领取后券码区出现。
 */
const CopyCodeCoupon = createCouponCard([
  createCopyCodePlugin({ code: "SAVE-2026" }),
  createClaimStatePlugin({
    claim: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return { ok: true };
    },
  }),
]);

export const meta = {
  slug: "copy-code",
  title: "券码复制",
  group: "plugin" as const,
  intro:
    "claimed/used 相位展示券码与复制按钮（clipboard API + execCommand 兜底），复制后 1.6 秒自动还原；available 相位不渲染。",
};

export default function CopyCodeDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <CopyCodeCoupon
        coupon={{ id: "cc1", title: "先领取，再看券码复制", amount: 20, threshold: 99 } as CouponData}
      />
    </div>
  );
}
