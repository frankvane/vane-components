import React from "react";
import type {
  CouponPlugin,
  CouponPluginContext,
  CouponValidity,
} from "../../components/CouponPlugin/plugins/types";
import * as T from "../../components/CouponPlugin/plugins/tokens";

/**
 * ValidityPlugin — 有效期判定（after 槽，priority 23 > RuleExpand 的 21，渲染在规则上方）。
 *
 * 三种判定模式（按声明字段自动选择）：
 *   absolute —— validTo（可配 validFrom）存在时；未开始/已过期/剩余天数
 *   relative —— validDays：未领取显示「领取后 N 天内有效」；已领取从 state.claimedAt
 *               （ClaimStatePlugin 写入）起算
 *   none     —— 都未声明：不渲染、不写 state
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

const DAY_MS = 24 * 60 * 60 * 1000;

const fmtDate = (ts: number): string => {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
};

export function createValidityPlugin(
  config: ValidityConfig = {}
): CouponPlugin {
  const urgentDays = config.urgentDays ?? 3;
  const now = config.now ?? (() => Date.now());
  const mergedConfig = { slotPosition: "after", order: 10, ...config } as any;

  const compute = (context: CouponPluginContext): CouponValidity | null => {
    const coupon = context.coupon;
    const ts = now();

    // absolute：以 validTo 为准
    if (typeof coupon.validTo === "number") {
      const notStarted =
        typeof coupon.validFrom === "number" ? ts < coupon.validFrom : false;
      const expired = ts > coupon.validTo;
      const remainingMs = Math.max(0, coupon.validTo - ts);
      const remainingDays = Math.ceil(remainingMs / DAY_MS);
      const range =
        typeof coupon.validFrom === "number"
          ? `${fmtDate(coupon.validFrom)} - ${fmtDate(coupon.validTo)}`
          : `${fmtDate(coupon.validTo)} 前`;
      return {
        mode: "absolute",
        valid: !expired && !notStarted,
        expired,
        notStarted,
        remainingMs,
        text: range,
        urgent: !expired && !notStarted && remainingDays <= urgentDays,
      };
    }

    // relative：以 validDays 为准
    if (typeof coupon.validDays === "number") {
      const claimedAt = (context.state?.claimedAt ?? undefined) as
        | number
        | undefined;
      if (typeof claimedAt !== "number") {
        return {
          mode: "relative",
          valid: true,
          expired: false,
          notStarted: false,
          remainingMs: null,
          text: `领取后 ${coupon.validDays} 天内有效`,
          urgent: false,
        };
      }
      const end = claimedAt + coupon.validDays * DAY_MS;
      const expired = ts > end;
      const remainingMs = Math.max(0, end - ts);
      const remainingDays = Math.ceil(remainingMs / DAY_MS);
      return {
        mode: "relative",
        valid: !expired,
        expired,
        notStarted: false,
        remainingMs,
        text: `${fmtDate(claimedAt)} 领取，${coupon.validDays} 天内有效`,
        urgent: !expired && remainingDays <= urgentDays,
      };
    }

    return null;
  };

  const sameValidity = (a: any, b: any): boolean =>
    JSON.stringify(a) === JSON.stringify(b);

  /** 事件钩子共用：计算并按需写入 state */
  const evaluate = (context: CouponPluginContext): void => {
    const next = compute(context);
    const current = (context.state?.validity ?? null) as CouponValidity | null;
    if (next === null) return; // none 模式：不写 state、不渲染
    if (!sameValidity(next, current)) context.setState({ validity: next });
  };

  return {
    name: "validity",
    version: "0.1.0",
    description:
      "有效期判定：绝对（validFrom/validTo）/ 相对（领取后 N 天）双模式，紧迫态强调、过期写 state 供领取状态机联动",
    priority: 23,
    config: mergedConfig,
    hooks: {
      onMount: (context: CouponPluginContext) => {
        evaluate(context);
      },
      onPropsChange: (context: CouponPluginContext) => {
        evaluate(context);
      },
      onPhaseChange: (context: CouponPluginContext) => {
        // 领取动作写入 claimedAt → 相对有效期要重算（从「领取后 N 天」切到锚定 claimedAt）
        evaluate(context);
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
              <span style={T.chipExpiredStyle}>
                已过期
              </span>
            ) : validity.urgent && remainingDays !== null ? (
              <span style={T.chipUrgentStyle}>
                仅剩 {remainingDays} 天
              </span>
            ) : validity.notStarted ? (
              <span style={T.chipMutedStyle}>
                未开始
              </span>
            ) : null}
          </div>
        );
      },
    },
  };
}
