import React from "react";
import type { CouponPlugin, CouponPluginContext } from "../../components/CouponPlugin/plugins/types";
import * as T from "../../components/CouponPlugin/plugins/tokens";

/**
 * CountdownPlugin — 开抢倒计时（before 槽）。
 *
 * config.startAt（epoch ms）未到时渲染「距开抢 HH:MM:SS」，用 onMount 挂
 * setTimeout 链（返回 cleanup，内核 manager.clear() 逆序执行）驱动剩余时间。
 * 到点：autoStart 开启时自动 setPhase("available")，并触发 onFire。
 *
 * 注意：倒计时剩余写内核 state.countdown —— 写入即触发 context 重建，
 * 渲染钩子只读。meta 在同目录 index.ts 挂载。
 */
export interface CountdownConfig {
  /** 开抢时间（epoch ms），必填；未到开始时间才有倒计时 */
  startAt: number;
  /** 到点自动进入 available，默认 false（由宿主决定何时开抢） */
  autoStart?: boolean;
  /** 定时精度，默认 1000ms */
  tickMs?: number;
  /** 每跳回调（供埋点/自定义渲染） */
  onCountdown?: (remainingMs: number) => void;
  /** 倒计时归零回调 */
  onFire?: () => void;
}

const fmt = (ms: number): string => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
};

export function createCountdownPlugin(config: CountdownConfig): CouponPlugin {
  const tickMs = config.tickMs ?? 1000;
  const mergedConfig = { slotPosition: "before", order: 10, ...config } as any;

  return {
    name: "countdown",
    version: "0.1.0",
    description:
      "开抢倒计时：startAt 未到时渲染「距开抢 HH:MM:SS」，到点可自动开抢（autoStart）并触发 onFire",
    priority: 15,
    config: mergedConfig,
    hooks: {
      onMount: (context: CouponPluginContext) => {
        const tick = () => {
          const remaining = config.startAt - Date.now();
          context.setState({ countdown: Math.max(0, remaining) });
          if (remaining > 0) {
            config.onCountdown?.(remaining);
            timer = window.setTimeout(tick, tickMs);
          } else {
            config.onFire?.();
            if (config.autoStart) context.setPhase("available");
          }
        };
        let timer = window.setTimeout(tick, 0);
        // 返回清理函数：内核 manager.clear() 时执行（React 式 onMount）
        return () => window.clearTimeout(timer);
      },
      renderHeader: (context: CouponPluginContext) => {
        const remaining = context.state?.countdown as number | undefined;
        if (typeof remaining !== "number" || remaining <= 0) return null;

        return (
          <div style={T.badgesStyle} data-testid="coupon-countdown">
            <span
              style={{
                ...T.badgeStackStyle,
                background: "#fff7e6",
                color: "#a54a00",
                border: "1px solid #ffd591",
                fontFamily: "var(--ff-mono, monospace)",
              }}
              data-testid="coupon-countdown-value"
            >
              距开抢 {fmt(remaining)}
            </span>
          </div>
        );
      },
    },
  };
}
