/**
 * SignInData 归一化。
 *
 * 类型上 `SignInData` 的字段都是必填，接口灰度 / 字段改名时编译期不会有任何提示，
 * 插件会直接渲染出 `undefined 天连签`，或让 `makeup.available` 抛 TypeError 后被
 * 槽位 catch 吞掉（整段补签入口静默消失）。这里统一做一次兜底：
 *  - 数字字段：非有限数字回落 0；
 *  - 数组字段：非数组回落 []；
 *  - 文本字段：非字符串回落 ""（不产出 "undefined"）；
 *  - 日期键：只接受合法 `yyyy-mm-dd`，否则丢弃该可选字段。
 *
 * 由 `withSignInPlugins` 在 transformData 之后执行一次，插件拿到的始终是安全数据。
 */

import type {
  ClaimRecord,
  DayCell,
  DayStatus,
  LevelInfo,
  MakeupInfo,
  RewardInfo,
  SignInData,
  SignInError,
} from "../components/SignInPlugin/plugins/types";
import { isDayKey } from "./date";

type UnknownRecord = Record<string, unknown>;

const DAY_STATUSES: DayStatus[] = ["signed", "today", "missed", "future", "reward"];
const REWARD_KINDS: RewardInfo["kind"][] = ["points", "coupon", "gift", "badge"];

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toCount(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : fallback;
}

function toText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function isDayStatus(value: unknown): value is DayStatus {
  return typeof value === "string" && (DAY_STATUSES as string[]).includes(value);
}

function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function normalizeReward(raw: UnknownRecord): RewardInfo {
  const kind = raw.kind;
  return {
    day: toCount(raw.day),
    kind:
      typeof kind === "string" && (REWARD_KINDS as string[]).includes(kind)
        ? (kind as RewardInfo["kind"])
        : "points",
    value:
      typeof raw.value === "number" && Number.isFinite(raw.value)
        ? raw.value
        : undefined,
    label: toText(raw.label),
    claimed: raw.claimed === true,
  };
}

function normalizeCalendarCell(cell: unknown): DayCell {
  const raw = isRecord(cell) ? cell : {};
  return {
    // 非法日期键原样保留（不丢格子），补签目标筛选会再校验一次。
    date: toText(raw.date),
    day: toCount(raw.day),
    status: isDayStatus(raw.status) ? raw.status : "future",
    reward: isRecord(raw.reward) ? normalizeReward(raw.reward) : undefined,
    canMakeup: raw.canMakeup === true,
  };
}

function normalizeLevel(raw: unknown): LevelInfo | undefined {
  if (!isRecord(raw)) return undefined;
  const progress =
    typeof raw.progress === "number" && Number.isFinite(raw.progress)
      ? Math.min(1, Math.max(0, raw.progress))
      : 0;
  return {
    name: toText(raw.name),
    current: toCount(raw.current),
    next: toCount(raw.next),
    progress,
  };
}

function normalizeHistory(raw: unknown): ClaimRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const record = isRecord(item) ? item : {};
    return {
      id: toText(record.id, `record-${index}`),
      day: toCount(record.day),
      label: toText(record.label),
      at:
        typeof record.at === "number" && Number.isFinite(record.at)
          ? record.at
          : 0,
    };
  });
}

function normalizeMakeup(raw: unknown): MakeupInfo {
  const record = isRecord(raw) ? raw : {};
  return {
    available: toCount(record.available),
    used: toCount(record.used),
    max: toCount(record.max),
  };
}

function normalizeError(raw: unknown): SignInError | undefined {
  if (!isRecord(raw)) return undefined;
  const message = toText(raw.message);
  if (!message) return undefined;
  const code = toText(raw.code);
  return code ? { code, message } : { message };
}

/**
 * 归一化签到数据。入参允许 `Partial<SignInData>`（含 undefined），
 * 返回值保证 `calendar / rewards / makeup / history` 等集合字段一定存在。
 */
export function normalizeSignInData(
  input?: Partial<SignInData> | null
): SignInData {
  const source: Partial<SignInData> = input ?? {};

  return {
    todaySigned: source.todaySigned === true,
    streak: toCount(source.streak),
    maxStreak: toCount(source.maxStreak),
    totalDays: toCount(source.totalDays),
    points: toCount(source.points),
    calendar: Array.isArray(source.calendar)
      ? source.calendar.map(normalizeCalendarCell)
      : [],
    rewards: Array.isArray(source.rewards)
      ? source.rewards.map((item) =>
          isRecord(item) ? normalizeReward(item) : normalizeReward({})
        )
      : [],
    makeup: normalizeMakeup(source.makeup),
    nextResetAt:
      typeof source.nextResetAt === "number" &&
      Number.isFinite(source.nextResetAt)
        ? source.nextResetAt
        : undefined,
    businessTimeZone: isValidTimeZone(source.businessTimeZone)
      ? source.businessTimeZone
      : undefined,
    todayKey: isDayKey(source.todayKey) ? source.todayKey : undefined,
    lastError: normalizeError(source.lastError),
    remindEnabled:
      typeof source.remindEnabled === "boolean"
        ? source.remindEnabled
        : undefined,
    level: normalizeLevel(source.level),
    rules: Array.isArray(source.rules)
      ? source.rules.filter(
          (rule): rule is string => typeof rule === "string"
        )
      : undefined,
    history: normalizeHistory(source.history),
  };
}
