import React from "react";
import type {
  CouponPlugin,
  CouponPluginContext,
  CouponValidity,
} from "../../components/CouponPlugin/plugins/types";
import {
  computeValidity,
  nextValidityCheckAt,
  sameValidity,
  DAY_MS,
} from "../../components/CouponPlugin/plugins/validity";
import * as T from "../../components/CouponPlugin/plugins/tokens";

/**
 * ValidityPlugin — 有效期判定（after 槽，priority 23 > RuleExpand 的 21，渲染在规则上方）。
 *
 * 三种判定模式（按声明字段自动选择，判定实现见 plugins/validity.ts）：
 *   absolute —— validTo（可配 validFrom）存在时；未开始/已过期/剩余天数
 *   relative —— validDays：未领取显示「领取后 N 天内有效」；已领取从 state.claimedAt
 *               （ClaimStatePlugin 写入）起算
 *   none     —— 都未声明：不渲染、不写 state
 *
 * P1-3：页面停留跨过 validTo 后必须自动收敛。每次判定后按「下一次边界」
 * （validFrom 或 validTo + 1ms）挂一个 setTimeout，到点重算并写 state；
 * 定时器存在 context.shared，onMount 返回清理函数、onUnmount 兜底清理。
 *
 * 产出写内核 state.validity（changed 才写），供 ClaimStatePlugin 联动降级 expired。
 * 时钟可注入（now），测试与 demo 可控。
 * meta 在同目录 index.ts 挂载。
 */
export interface ValidityConfig {
  /** 当前时钟，默认 Date.now（测试/demo 可注入固定值） */
  now?: () => number;
  /** 紧迫阈值：剩余 ≤ N 天标记 urgent（强调色「仅剩 X 天」），默认 3 */
  urgentDays?: number;
}

/** 定时器句柄存放键（跨渲染读取最新值） */
const TIMER_KEY = "validity:timer";
/** setTimeout 上限（超过会溢出成 1ms，长周期改为分段复查） */
const MAX_TIMEOUT = 2_147_483_647;

export function createValidityPlugin(
  config: ValidityConfig = {}
): CouponPlugin {
  const urgentDays = config.urgentDays ?? 3;
  const now = config.now ?? (() => Date.now());
  const mergedConfig = { slotPosition: "after", order: 10, ...config };

  function clearTimer(context: CouponPluginContext): void {
    const timer = context.shared.get(TIMER_KEY);
    if (timer !== undefined) {
      window.clearTimeout(timer as number);
      context.shared.delete(TIMER_KEY);
    }
  }

  /** 事件钩子共用：计算并按需写入 state，然后按边界重挂定时器 */
  function evaluate(context: CouponPluginContext): void {
    const claimedAt = (context.state?.claimedAt ?? undefined) as
      | number
      | undefined;
    const next = computeValidity(context.coupon, {
      now,
      urgentDays,
      claimedAt,
    });
    if (next === null) {
      // none 模式：不写 state、不渲染
      clearTimer(context);
      return;
    }
    const current = (context.state?.validity ?? null) as CouponValidity | null;
    if (!sameValidity(next, current)) context.setState({ validity: next });
    schedule(context);
  }

  /** 按「下一次需要复查的时间点」挂定时器；已过边界则不再挂 */
  function schedule(context: CouponPluginContext): void {
    clearTimer(context);
    const claimedAt = (context.state?.claimedAt ?? undefined) as
      | number
      | undefined;
    const at = nextValidityCheckAt(context.coupon, claimedAt, now());
    if (at === null) return;

    const delay = Math.max(0, Math.min(at - now(), MAX_TIMEOUT));
    const timer = window.setTimeout(() => {
      context.shared.delete(TIMER_KEY);
      evaluate(context);
    }, delay);
    context.shared.set(TIMER_KEY, timer);
  }

  return {
    name: "validity",
    version: "0.1.0",
    description:
      "有效期判定：绝对（validFrom/validTo）/ 相对（领取后 N 天）双模式，紧迫态强调、到期自动复查写 state 供领取状态机联动",
    priority: 23,
    config: mergedConfig,
    hooks: {
      onMount: (context: CouponPluginContext) => {
        evaluate(context);
        return () => clearTimer(context);
      },
      onPropsChange: (context: CouponPluginContext) => {
        evaluate(context);
      },
      onPhaseChange: (context: CouponPluginContext) => {
        // 领取动作写入 claimedAt → 相对有效期要重算（从「领取后 N 天」切到锚定 claimedAt）
        evaluate(context);
      },
      onUnmount: (context: CouponPluginContext) => {
        clearTimer(context);
      },
      renderHeader: (context: CouponPluginContext) => {
        const validity = context.validity;
        if (!validity || validity.mode === "none") return null;

        const remainingDays =
          validity.remainingMs !== null
            ? Math.ceil(validity.remainingMs / DAY_MS)
            : null;

        return (
          <div
            style={T.validityStyle}
            data-testid="coupon-validity"
            data-mode={validity.mode}
            data-expired={validity.expired ? "true" : "false"}
            data-urgent={validity.urgent ? "true" : "false"}
          >
            <span style={T.fieldLabelStyle}>有效期</span>
            <span style={T.validityTextStyle}>{validity.text}</span>
            {validity.expired ? (
              <span style={T.chipExpiredStyle}>已过期</span>
            ) : validity.urgent && remainingDays !== null ? (
              <span style={T.chipUrgentStyle}>仅剩 {remainingDays} 天</span>
            ) : validity.notStarted ? (
              <span style={T.chipMutedStyle}>未开始</span>
            ) : null}
          </div>
        );
      },
    },
  };
}
