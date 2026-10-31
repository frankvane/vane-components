/**
 * 签到家族共享色板（ADR-13 约束：有背景必有字色、不用 opacity 压字；
 * 正文≥4.5 / 禁用≥3 / UI≥3）。所有插件统一从这里取色，避免内联字面量漂移。
 */
export const ACCENT = "#ff7a29";
export const ACCENT_SOFT = "#fff1e6";
export const GOLD = "#b8860b";
export const GOLD_SOFT = "#fff8e1";
export const GREEN = "#0f8a4a";
export const TEXT = "#1f2328";
export const TEXT_2 = "#6b6b6b";
export const TEXT_3 = "#8a8a8a";
export const DISABLED_BG = "#f2f3f5";
export const DISABLED_FG = "#8a8a8a";
export const BORDER = "#e3e5e8";

/** 日历格状态配色（背景 + 字色成对） */
export const DAY_COLORS: Record<
  string,
  { bg: string; fg: string; border: string }
> = {
  signed: { bg: "#fff1e6", fg: "#d35400", border: "#ff7a29" },
  today: { bg: "#ff7a29", fg: "#ffffff", border: "#ff7a29" },
  missed: { bg: "#f2f3f5", fg: "#7d7d7d", border: "#e3e5e8" },
  future: { bg: "#fafafa", fg: "#8a8a8a", border: "#ececec" },
  reward: { bg: "#fff8e1", fg: "#b8860b", border: "#e0a800" },
};

export const DAY_GLYPH: Record<string, string> = {
  signed: "✓",
  today: "今",
  missed: "·",
  future: "",
  reward: "★",
};
