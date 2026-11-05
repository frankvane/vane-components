import React from "react";
import type {
  CouponPhase,
  CouponPlugin,
  CouponPluginContext,
} from "../../components/CouponPlugin/plugins/types";
import { evaluateEligibility } from "../../components/CouponPlugin/plugins/eligibility";
import { resolveQuota } from "../../components/CouponPlugin/plugins/quota";
import { resolveStock } from "../../components/CouponPlugin/plugins/stock";
import { computeValidity } from "../../components/CouponPlugin/plugins/validity";
import * as T from "../../components/CouponPlugin/plugins/tokens";

/**
 * ClaimStatePlugin — 领取状态机（footer 槽）。
 *
 * 相位枚举与转移规则见 plugins/types.ts 的 CouponPhase 注释：
 *   idle → available → claiming → claimed（半终态，可核销 used）
 *   终态 used / soldout / expired；领取失败不设独立态，回退 available 并经 onClaimError 上报。
 *
 * 门控口径（展示与点击使用同一个 gatePhase，避免「显示已抢完但还能领」）：
 *   expired      —— state.validity 过期，或按注入时钟现算已过 validTo；
 *   soldout      —— state.stock ≤ 0 与 coupon.total/claimed 取并集；
 *   quota-limited—— state.quotaReached 或按 coupon.quota + 已领数现算超限。
 *
 * 事件钩子里写 state（不在渲染期 setState），写入即触发 context 重建。
 * meta 在同目录 index.ts 挂载。
 */
export interface ClaimStateConfig {
  /** 初始相位，默认 available */
  initialPhase?: CouponPhase;
  /**
   * 领取回调（异步）。返回 { ok: false, reason? } 视为失败：回退 available 并触发 onClaimError。
   * 未配置时点击直接进入 claimed（demo / 纯展示场景）。
   */
  claim?: () => Promise<{ ok?: boolean; reason?: string } | void>;
  /** 剩余库存；≤ 0 时自动降级 soldout（与 total/claimed 取并集） */
  stock?: number;
  /** 发放总量覆盖（默认 coupon.total；与 ProgressPlugin 同口径） */
  total?: number;
  /** 已领取数覆盖（默认 coupon.claimed；与 ProgressPlugin 同口径） */
  claimed?: number;
  /** 每人限领张数（默认 coupon.quota） */
  quota?: number;
  /** 当前用户已领张数，默认 0 */
  purchasedCount?: number;
  /** 判定时钟，默认 Date.now（测试/demo 可注入固定值） */
  now?: () => number;
  /** 相位变化回调（onPhaseChange 钩子之后触发） */
  onPhaseChange?: (phase: CouponPhase, prev: CouponPhase | undefined) => void;
  /** 领取失败回调 */
  onClaimError?: (reason?: string) => void;
  /** 按钮文案按相位覆盖 */
  texts?: Partial<Record<CouponPhase, string>>;
  /** 订单不可用（门槛 / 范围 / 互斥 / 叠加不满足）时的按钮文案，默认「不可用」 */
  ineligibleText?: string;
}

/** 各相位默认按钮文案 */
export const DEFAULT_CLAIM_TEXTS: Record<CouponPhase, string> = {
  idle: "未开始",
  available: "立即领取",
  claiming: "领取中…",
  claimed: "已领取",
  used: "已使用",
  soldout: "已抢光",
  expired: "已过期",
  "quota-limited": "已达限领上限",
};

/** 终态：不再响应任何点击与降级 */
const TERMINAL_PHASES: ReadonlySet<CouponPhase> = new Set([
  "used",
  "soldout",
  "expired",
]);

/** 点击重入锁（context.shared，跨渲染读取最新值） */
const CLAIM_LOCK = "claim:in-flight";
/** 挂载标记，异步返回后据此判断是否已卸载 */
const CLAIM_MOUNTED = "claim:mounted";

export function createClaimStatePlugin(
  config: ClaimStateConfig = {}
): CouponPlugin {
  const texts = { ...DEFAULT_CLAIM_TEXTS, ...config.texts };
  // 注：renderPluginSlot 的 footer 槽以 position "after" 过滤（plugin-core 现状），
  // 声明 "footer" 会被滤掉，故这里保持 "after"（P2-8 槽位元数据部分待内核支持）。
  const mergedConfig = { slotPosition: "after", order: 10, ...config };
  const now = config.now ?? (() => Date.now());

  /**
   * 联动降级判定：返回应强制进入的相位，无需降级返回 null。
   * 终态优先级：expired / soldout / quota-limited 覆盖可领取态；
   * 已领取 / 领取中不覆盖（避免把成功结果改写成不可领）。
   */
  const gatePhase = (context: CouponPluginContext): CouponPhase | null => {
    const current = context.phase;
    if (TERMINAL_PHASES.has(current)) return null;
    if (current === "claimed" || current === "claiming") return null;

    const claimedAt = (context.state?.claimedAt ?? undefined) as number | undefined;
    // 点击/渲染时按注入时钟现算一次，而不是只信可能陈旧的 state.validity
    const fresh = computeValidity(context.coupon, { now, claimedAt });
    const stored = context.state?.validity as
      | import("../../components/CouponPlugin/plugins/types").CouponValidity
      | null
      | undefined;
    if (fresh?.expired || stored?.expired) return "expired";

    const stock = resolveStock(context.coupon, {
      stock: config.stock,
      total: config.total,
      claimed: config.claimed,
    });
    if (stock.soldout) return "soldout";

    const quota = resolveQuota(context.coupon, {
      quota: config.quota,
      purchasedCount: config.purchasedCount ?? context.order?.purchasedCount,
    });
    if (context.state?.quotaReached === true || quota.reached) {
      return "quota-limited";
    }
    return null;
  };

  /** 写相位（值相同不写，避免无谓的 context 重建） */
  const transition = (
    context: CouponPluginContext,
    next: CouponPhase
  ): void => {
    if (context.state?.phase === next) return;
    context.setState({ phase: next });
  };

  /** 重新评估降级（onMount / onPropsChange 共用） */
  const reevaluate = (context: CouponPluginContext): void => {
    const current = (context.state?.phase ?? undefined) as CouponPhase | undefined;
    if (current === undefined) {
      // 首次：硬门（过期 / 无库存 / 超限）优先，其次应用 initialPhase
      const gated = gatePhase(context);
      if (gated) {
        context.setState({ phase: gated });
      } else if (config.initialPhase) {
        context.setState({ phase: config.initialPhase });
      }
      return;
    }
    const gated = gatePhase(context);
    if (gated) {
      if (gated !== current) transition(context, gated);
      return;
    }
    // 限领是软门：已领数下调后自动恢复可领取
    if (current === "quota-limited") transition(context, "available");
  };

  /** 订单不可用判定（门槛 / 范围 / 互斥 / 叠加）；无订单上下文返回 false */
  const blockedByEligibility = (context: CouponPluginContext): boolean => {
    const eligibility =
      context.eligible ??
      (context.order
        ? evaluateEligibility(context.coupon, context.order)
        : null);
    return eligibility?.eligible === false;
  };

  return {
    name: "claim-state",
    version: "0.1.0",
    description:
      "领取状态机：8 态相位流转（未开始/可领取/领取中/已领取/已使用/已抢空/已过期/已达限领上限），联动有效期、库存与限领自动降级",
    priority: 32,
    config: mergedConfig,
    hooks: {
      onMount: (context: CouponPluginContext) => {
        context.shared.set(CLAIM_MOUNTED, true);
        reevaluate(context);
      },
      onPropsChange: (context: CouponPluginContext) => {
        reevaluate(context);
      },
      onValidityChange: (context: CouponPluginContext, validity) => {
        // expired 只覆盖非终态（used 等终态不被打回）
        if (validity.expired && !TERMINAL_PHASES.has(context.phase)) {
          transition(context, "expired");
        }
      },
      onUnmount: (context: CouponPluginContext) => {
        context.shared.set(CLAIM_MOUNTED, false);
        context.shared.delete(CLAIM_LOCK);
      },
      renderFooter: (context: CouponPluginContext) => {
        const phase = context.phase;
        // 渲染期算一次门控：Quota / Progress 是其它插件写 state 或读 coupon，
        // 不保证先于本插件执行，按实时口径直接渲染才能让「提示条」与按钮一致。
        const gated = gatePhase(context);
        const ineligible = blockedByEligibility(context);
        const blocked = ineligible && !gated;
        const shownPhase = gated ?? phase;
        const label = blocked
          ? config.ineligibleText ?? "不可用"
          : texts[shownPhase] ?? shownPhase;
        const disabled = shownPhase !== "available" || blocked;

        const handleClick = async () => {
          // phase 缺省即 available（与 context.phase 同一口径）
          if (context.phase !== "available") return;
          if (context.shared.get(CLAIM_LOCK) === true) return;

          const blockedNow = blockedByEligibility(context);
          const gatedNow = gatePhase(context);
          if (gatedNow) {
            transition(context, gatedNow);
            return;
          }
          if (blockedNow) return;

          context.shared.set(CLAIM_LOCK, true);
          transition(context, "claiming");
          try {
            const result = await config.claim?.();
            // 卸载后不再写 state / 触发回调
            if (context.shared.get(CLAIM_MOUNTED) !== true) return;
            const ok = !result || result.ok !== false;
            if (ok) {
              // 领取期间跨过 validTo：不再落成功态（context.state 是点击时的快照，
              // 相位是否被改写只能按注入时钟现算）
              const freshAfter = computeValidity(context.coupon, {
                now,
                claimedAt: context.state?.claimedAt as number | undefined,
              });
              if (freshAfter?.expired) {
                transition(context, "expired");
                return;
              }
              // claimedAt 供 ValidityPlugin 的相对有效期锚定
              context.setState({ phase: "claimed", claimedAt: Date.now() });
            } else {
              transition(context, "available");
              config.onClaimError?.(result?.reason);
            }
          } catch (error) {
            if (context.shared.get(CLAIM_MOUNTED) !== true) return;
            transition(context, "available");
            config.onClaimError?.(String(error));
          } finally {
            context.shared.delete(CLAIM_LOCK);
          }
        };

        return (
          <div className="vc-coupon__actions" style={T.actionsStyle} data-testid="coupon-claim-area">
            <button
              type="button"
              style={
                phase === "available" && !disabled
                  ? T.claimStyle
                  : T.claimMutedStyle
              }
              data-testid="coupon-claim-btn"
              data-phase={phase}
              data-gate={gated ?? ""}
              data-eligible={ineligible ? "false" : "true"}
              disabled={disabled}
              aria-disabled={disabled}
              onClick={() => void handleClick()}
            >
              {label}
            </button>
          </div>
        );
      },
    },
  };
}
