/**
 * 签到日期工具：一切都是「业务日键」（DayKey，`yyyy-mm-dd`）。
 *
 * 约定（写进 types.ts 的字段注释，供接入方对照）：
 *  - `DayCell.date` / `SignInData.todayKey` 是 DayKey，口径为 `SignInData.businessTimeZone`
 *    所在时区的自然日（缺省为运行环境本地时区），**不是** UTC 日；
 *  - `SignInData.nextResetAt` / `ClaimRecord.at` 是绝对 epoch 毫秒，展示前必须经
 *    `toDayKey(value, timeZone)` 归一成 DayKey。
 *
 * 为什么不用 `toLocaleDateString()`：
 *  - 它的输出依赖运行环境 locale / 时区，SSR（Node 服务器时区）与浏览器（用户时区）会不同，
 *    造成 hydration mismatch；且不同 locale 的分隔符不可比较。
 *  - 直接 `Date` 相减做「天数差」在 DST 切换日会出现 23/25 小时的一天。
 *  - 这里的天数运算统一走 `Date.UTC` 的日键序数，天然免疫 DST。
 */

/** 业务日键：`yyyy-mm-dd`（按某个时区的自然日，不携带时刻） */
export type DayKey = string;

const DAY_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

/** 解析 DayKey 为 UTC 日序数（毫秒）。非法输入抛 RangeError，避免静默产出脏数据。 */
function dayKeyToEpoch(key: DayKey): number {
  const matched = DAY_KEY_RE.exec(key);
  if (!matched) {
    throw new RangeError(`[vane-sign-in] 非法日期键：${String(key)}`);
  }
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  // 用 setUTCFullYear 而不是 Date.UTC：Date.UTC 会把 0–99 年映射到 1900+，这里保留字面年份。
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError(`[vane-sign-in] 非法日期键：${String(key)}`);
  }
  return date.getTime();
}

function toDate(value: Date | number | string): Date {
  if (value instanceof Date) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`[vane-sign-in] 非法时间值：${String(value)}`);
  }
  return date;
}

/** 判断值是否是合法的 DayKey（`yyyy-mm-dd`，且年月日真实存在，如 2/29 需闰年）。 */
export function isDayKey(value: unknown): value is DayKey {
  if (typeof value !== "string" || !DAY_KEY_RE.test(value)) return false;
  try {
    dayKeyToEpoch(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * 把时刻归一成业务日键。
 *
 * @param value Date / epoch 毫秒 / ISO 字符串；已经是 DayKey 的字符串原样返回（校验后）
 * @param timeZone IANA 时区（如 `"Asia/Shanghai"`）；缺省用运行环境本地时区
 *
 * @example
 * toDayKey("2026-10-31T16:30:00Z", "Asia/Shanghai") // "2026-11-01"
 * toDayKey("2026-10-31T16:30:00Z", "UTC")           // "2026-10-31"
 */
export function toDayKey(
  value: Date | number | string = Date.now(),
  timeZone?: string
): DayKey {
  if (typeof value === "string" && isDayKey(value)) return value;
  const date = toDate(value);

  if (timeZone) {
    const parts = formatterFor(timeZone).formatToParts(date);
    let year = "";
    let month = "";
    let day = "";
    for (const part of parts) {
      if (part.type === "year") year = part.value;
      else if (part.type === "month") month = part.value;
      else if (part.type === "day") day = part.value;
    }
    return `${pad(Number(year), 4)}-${pad(Number(month))}-${pad(Number(day))}`;
  }

  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 展示用别名：语义与 {@link toDayKey} 相同，但要表达「展示层必须走它，不要用 toLocaleDateString」。 */
export function formatDayKey(
  value: Date | number | string,
  timeZone?: string
): DayKey {
  return toDayKey(value, timeZone);
}

/** 当前业务日键。 */
export function todayKey(timeZone?: string, now: number = Date.now()): DayKey {
  return toDayKey(now, timeZone);
}

/** DayKey 加减天数（跨月 / 跨年 / 闰年由 UTC 日序数保证）。 */
export function addDays(key: DayKey, days: number): DayKey {
  if (!Number.isFinite(days)) {
    throw new RangeError(`[vane-sign-in] addDays 天数非法：${String(days)}`);
  }
  const next = new Date(dayKeyToEpoch(key) + Math.trunc(days) * MS_PER_DAY);
  return `${pad(next.getUTCFullYear(), 4)}-${pad(next.getUTCMonth() + 1)}-${pad(
    next.getUTCDate()
  )}`;
}

/** 两个 DayKey 相隔天数：`diffDays(a, b) = a - b`（正数表示 a 更晚）。 */
export function diffDays(a: DayKey, b: DayKey): number {
  return Math.round((dayKeyToEpoch(a) - dayKeyToEpoch(b)) / MS_PER_DAY);
}

/** 比较两个 DayKey，可直接用于 `sort`：返回 -1 / 0 / 1。 */
export function compareDayKeys(a: DayKey, b: DayKey): number {
  // 规范化后的 DayKey 是等长零填充串，字典序即时间序；先校验避免脏键混入排序。
  dayKeyToEpoch(a);
  dayKeyToEpoch(b);
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
