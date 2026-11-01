import type { CouponData, CouponValidity } from "./types";

/**
 * 有效期判定（纯函数，ValidityPlugin 与 ClaimStatePlugin 共用）。
 *
 * 边界口径（与报告一致）：
 *   notStarted = ts < validFrom（validFrom 当刻即已开始）
 *   expired    = ts > validTo（validTo 当刻仍有效）
 * 因而定时复查点取 validTo + 1ms / validFrom，保证越过边界后下一次判定为真。
 */
export const DAY_MS = 24 * 60 * 60 * 1000;

const finiteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const formatValidityDate = (ts: number): string => {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
};

export interface ValidityOptions {
  /** 当前时钟，默认 Date.now */
  now?: () => number;
  /** 紧迫阈值（天），默认 3 */
  urgentDays?: number;
  /** 相对有效期的起算点（ClaimState 写入 claimedAt） */
  claimedAt?: number | null;
}

export interface ValidityWindow {
  start: number | null;
  end: number | null;
}

/** 解析有效期窗口（absolute 用 validFrom/validTo；relative 用 claimedAt + validDays） */
export function resolveValidityWindow(
  coupon: Pick<CouponData, "validFrom" | "validTo" | "validDays">,
  claimedAt?: number | null
): ValidityWindow | null {
  if (finiteNumber(coupon.validTo)) {
    return {
      start: finiteNumber(coupon.validFrom) ? coupon.validFrom : null,
      end: coupon.validTo,
    };
  }
  if (finiteNumber(coupon.validDays) && coupon.validDays > 0) {
    if (finiteNumber(claimedAt)) {
      return { start: claimedAt, end: claimedAt + coupon.validDays * DAY_MS };
    }
    return { start: null, end: null };
  }
  return null;
}

/** 下一次需要复查的时间点（epoch ms）；没有边界返回 null */
export function nextValidityCheckAt(
  coupon: Pick<CouponData, "validFrom" | "validTo" | "validDays">,
  claimedAt: number | null | undefined,
  ts: number
): number | null {
  const window = resolveValidityWindow(coupon, claimedAt);
  if (!window) return null;
  const candidates: number[] = [];
  // 未到开始时间：到点复查，让 notStarted 能翻转为可领取
  if (window.start !== null && ts < window.start) candidates.push(window.start);
  // 未到结束时间：越过 validTo 后复查（+1ms 保证判定期末当刻仍有效）
  if (window.end !== null && ts <= window.end) candidates.push(window.end + 1);
  return candidates.length > 0 ? Math.min(...candidates) : null;
}

/** 统一有效期判定；未声明任何有效期返回 null（none 模式） */
export function computeValidity(
  coupon: CouponData,
  options: ValidityOptions = {}
): CouponValidity | null {
  const now = options.now ?? (() => Date.now());
  const urgentDays = options.urgentDays ?? 3;
  const ts = now();

  if (finiteNumber(coupon.validTo)) {
    const notStarted = finiteNumber(coupon.validFrom)
      ? ts < coupon.validFrom
      : false;
    const expired = ts > coupon.validTo;
    const remainingMs = Math.max(0, coupon.validTo - ts);
    const remainingDays = Math.ceil(remainingMs / DAY_MS);
    const range = finiteNumber(coupon.validFrom)
      ? `${formatValidityDate(coupon.validFrom)} - ${formatValidityDate(coupon.validTo)}`
      : `${formatValidityDate(coupon.validTo)} 前`;
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

  if (finiteNumber(coupon.validDays)) {
    const claimedAt = finiteNumber(options.claimedAt)
      ? options.claimedAt
      : undefined;
    if (claimedAt === undefined) {
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
      text: `${formatValidityDate(claimedAt)} 领取，${coupon.validDays} 天内有效`,
      urgent: !expired && remainingDays <= urgentDays,
    };
  }

  return null;
}

/** 结构化比较（避免重复写 state） */
export function sameValidity(
  a: CouponValidity | null,
  b: CouponValidity | null
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
