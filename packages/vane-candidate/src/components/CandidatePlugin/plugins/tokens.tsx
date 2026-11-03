import type { CSSProperties } from "react";

/**
 * 设计令牌（ADR-13 对比度合规）。
 * 容器自带 color + background；内联背景必内联字色；不用 opacity 压字。
 * 正文 ≥4.5:1 / 禁用 ≥3:1 / UI 元件 ≥3:1。
 */
export const tokens = {
  bg: "#ffffff",
  text: "#1f2328", // 约 16:1
  muted: "#5d636a", // 约 5:1（次级正文可用）
  faint: "#767d87", // 约 3.7:1（禁用/装饰，不用于正文）
  line: "#e3e6ea",
  lineStrong: "#d4d8de",
  accent: "#2563eb",
  accentInk: "#ffffff",
  accentWash: "#eef3fe",
  chipBg: "#f2f3f5",
  chipText: "#1f2328",
  good: "#1f7a3f",
  warn: "#b45309",
  bad: "#b42318",
  info: "#1c6ea8",
} as const;

/** 阶段色（tone → 实色字 + 浅底，全部满足 4.5:1） */
export const TONE_COLOR: Record<string, { fg: string; bg: string }> = {
  neutral: { fg: "#5d636a", bg: "#f2f3f5" },
  info: { fg: "#1c6ea8", bg: "#e7f1fa" },
  warn: { fg: "#8a4a06", bg: "#fdf1e2" },
  good: { fg: "#1f7a3f", bg: "#e8f5ec" },
  bad: { fg: "#b42318", bg: "#fdeceb" },
};

/** 工具栏按钮样式（激活态用强调色 + 白字，满足对比度） */
export function toolbarBtn(on: boolean): CSSProperties {
  return {
    background: on ? tokens.accent : tokens.chipBg,
    color: on ? tokens.accentInk : tokens.chipText,
    border: `1px solid ${tokens.lineStrong}`,
    borderRadius: "var(--vcd-radius, 6px)",
    fontSize: 12,
    padding: "3px 9px",
    cursor: "pointer",
  };
}

/** 将候选人列表深拷贝（避免插件改写污染原始数据） */
export function cloneData<T>(data: T): T {
  if (typeof structuredClone === "function") return structuredClone(data);
  return JSON.parse(JSON.stringify(data)) as T;
}
