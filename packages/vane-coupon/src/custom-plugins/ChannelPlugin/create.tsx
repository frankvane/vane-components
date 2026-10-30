import React from "react";
import type { CouponPlugin, CouponPluginContext } from "../../components/CouponPlugin/plugins/types";
import * as T from "../../components/CouponPlugin/plugins/tokens";

/**
 * ChannelPlugin — 渠道限定角标（before 槽）。
 *
 * config.channels（默认读 coupon.channels）渲染一组渠道小标（仅 APP / 仅新客…）。
 * 与 StackPlugin 同占 before 槽：stack priority 12 在左、channel 14 紧随。
 * meta 在同目录 index.ts 挂载。
 */
export interface ChannelConfig {
  /** 渠道标签列表（默认读 coupon.channels） */
  channels?: string[];
}

export function createChannelPlugin(config: ChannelConfig = {}): CouponPlugin {
  const mergedConfig = { slotPosition: "before", order: 20, ...config } as any;

  return {
    name: "channel",
    version: "0.1.0",
    description: "渠道限定角标：按 coupon.channels / config.channels 渲染一组渠道小标",
    priority: 14,
    config: mergedConfig,
    hooks: {
      renderHeader: (context: CouponPluginContext) => {
        const channels = config.channels ?? context.coupon.channels;
        if (!channels || channels.length === 0) return null;

        return (
          <div style={T.badgesStyle} data-testid="coupon-channels">
            {channels.map((label) => (
              <span
                key={label}
                style={T.badgeMutedStyle}
                data-testid="coupon-channel-badge"
              >
                {label}
              </span>
            ))}
          </div>
        );
      },
    },
  };
}
