import React from "react";
import type {
  CouponPlugin,
  CouponPluginContext,
} from "../../components/CouponPlugin/plugins/types";

/**
 * StackPlugin — 叠加态角标（before 槽）。
 *
 * 数据驱动：coupon.stackable === true 渲染「可叠加」强调角标；
 * showWhenNotStackable 开启时，stackable === false 渲染「不可叠加」灰标。
 * always 可强制渲染（不依赖数据字段）。
 *
 * 注意：renderPluginSlot 对未声明 slotPosition 的插件默认落 after 槽，
 * 这里必须在 config 里显式 slotPosition: "before"，否则角标会掉进 after 段。
 * meta 在同目录 index.ts 挂载。
 */
export interface StackConfig {
  /** 可叠加角标文案，默认「可叠加」 */
  text?: string;
  /** 不可叠加角标文案，默认「不可叠加」 */
  notStackableText?: string;
  /** stackable === false 时是否渲染「不可叠加」灰标，默认 false */
  showWhenNotStackable?: boolean;
  /** 不看数据字段，强制渲染可叠加角标（组合示例/纯展示场景） */
  always?: boolean;
}

export function createStackPlugin(config: StackConfig = {}): CouponPlugin {
  const text = config.text ?? "可叠加";
  const notStackableText = config.notStackableText ?? "不可叠加";
  const mergedConfig = { slotPosition: "before", order: 10, ...config } as any;

  return {
    name: "stack",
    version: "0.1.0",
    description:
      "叠加态角标：按 coupon.stackable 渲染「可叠加/不可叠加」角标，可强制展示",
    priority: 12,
    config: mergedConfig,
    hooks: {
      renderHeader: (context: CouponPluginContext) => {
        const stackable = context.coupon.stackable;

        if (config.always || stackable === true) {
          return (
            <div className="vc-coupon__badges" data-testid="coupon-badges">
              <span
                className="vc-coupon__badge vc-coupon__badge--stack"
                data-testid="coupon-stack-badge"
                data-stackable="true"
              >
                {text}
              </span>
            </div>
          );
        }

        if (config.showWhenNotStackable && stackable === false) {
          return (
            <div className="vc-coupon__badges" data-testid="coupon-badges">
              <span
                className="vc-coupon__badge vc-coupon__badge--muted"
                data-testid="coupon-stack-badge"
                data-stackable="false"
              >
                {notStackableText}
              </span>
            </div>
          );
        }

        return null;
      },
    },
  };
}
