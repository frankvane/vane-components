import React from "react";
import type { CouponPlugin, CouponPluginContext } from "../../components/CouponPlugin/plugins/types";
import * as T from "../../components/CouponPlugin/plugins/tokens";

/**
 * RemindPlugin — 开抢提醒（footer 槽，priority 30）。
 *
 * 「还没开抢」的判定不再只认 idle 相位（默认相位是 available，插件会永远不渲染，P2-2）：
 *   phase === idle                     —— 宿主显式标记未开始；
 *   state.countdown > 0                —— CountdownPlugin 倒计时进行中；
 *   validity.notStarted                —— ValidityPlugin 判出 validFrom 未到。
 * 满足任一即渲染「开抢提醒」开关；点击写内核 state.reminded 并触发 onRemind。
 * meta 在同目录 index.ts 挂载。
 */
export interface RemindConfig {
  /** 未提醒文案，默认「开抢提醒」 */
  text?: string;
  /** 已提醒文案，默认「已设提醒 ✓」 */
  remindedText?: string;
  /** 提醒开关回调 */
  onRemind?: (on: boolean) => void;
}

export function createRemindPlugin(config: RemindConfig = {}): CouponPlugin {
  const text = config.text ?? "开抢提醒";
  const remindedText = config.remindedText ?? "已设提醒 ✓";
  // 注：renderPluginSlot 的 footer 槽以 position "after" 过滤（plugin-core 现状），
  // 声明 "footer" 会被滤掉，故这里保持 "after"（P2-8 槽位元数据部分待内核支持）。
  const mergedConfig = { slotPosition: "after", order: 10, ...config } as any;

  return {
    name: "remind",
    version: "0.1.0",
    description:
      "开抢提醒：未开抢（idle / 倒计时中 / validFrom 未到）渲染提醒开关，开关态写内核 state.reminded",
    priority: 30,
    config: mergedConfig,
    hooks: {
      renderFooter: (context: CouponPluginContext) => {
        const countdown = context.state?.countdown as number | undefined;
        const pending =
          context.phase === "idle" ||
          (typeof countdown === "number" && countdown > 0) ||
          context.validity?.notStarted === true;
        if (!pending) return null;

        const on = context.state?.reminded === true;
        const toggle = async () => {
          context.setState({ reminded: !on });
          config.onRemind?.(!on);
        };

        return (
          <div style={T.actionsStyle}>
            <button
              type="button"
              style={T.claimMutedStyle}
              data-testid="coupon-remind-btn"
              data-on={on ? "true" : "false"}
              aria-pressed={on}
              onClick={() => void toggle()}
            >
              {on ? remindedText : text}
            </button>
          </div>
        );
      },
    },
  };
}
