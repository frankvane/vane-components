import React from "react";
import { createCouponCard } from "vane-coupon";
import type { CouponData } from "vane-coupon";
import { createChannelPlugin } from "vane-coupon/custom-plugins/ChannelPlugin";

/** 装配工厂在模块顶层调用（渲染体内调用会每次渲染造新实例，重挂载丢状态）。 */
const DataCoupon = createCouponCard([createChannelPlugin()]);
const ConfigCoupon = createCouponCard([createChannelPlugin({ channels: ["会员专享", "限领 1 次"] })]);

export const meta = {
  slug: "channel",
  title: "渠道小标",
  group: "plugin" as const,
  intro:
    "渠道灰标组：coupon.channels 数据驱动与 config.channels 配置驱动双通道，config 优先；渲染在 before 槽、排在叠加标之后。",
};

export default function ChannelDemo() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <DataCoupon
        coupon={{ id: "ch1", title: "数据驱动渠道", amount: 10, threshold: 0, channels: ["仅 APP", "仅新客"] } as CouponData}
      />
      <ConfigCoupon coupon={{ id: "ch2", title: "配置驱动渠道", amount: 20, threshold: 99 } as CouponData} />
    </div>
  );
}
