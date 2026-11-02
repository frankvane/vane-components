import React from "react";
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
  faint: "#8a9099", // 约 3.3:1（仅 UI 元素/装饰，不用于正文）
  line: "#e3e6ea",
  lineStrong: "#d4d8de",
  accent: "#2f6feb",
  accentInk: "#ffffff",
  accentWash: "#eef3fe",
  markBg: "#fff3bf",
  markText: "#1f2328",
  chipBg: "#f2f3f5",
  chipText: "#1f2328",
} as const;

/** 工具栏按钮样式（激活态用强调色 + 白字，满足对比度） */
export function toolbarBtn(on: boolean): CSSProperties {
  return {
    background: on ? tokens.accent : tokens.chipBg,
    color: on ? tokens.accentInk : tokens.chipText,
    border: `1px solid ${tokens.lineStrong}`,
    borderRadius: "var(--vr-radius, 6px)",
    fontSize: 12,
    padding: "3px 9px",
    cursor: "pointer",
  };
}

/** 将 ResumeData 深拷贝（避免插件改写污染原始数据） */
export function cloneData<T>(data: T): T {
  if (typeof structuredClone === "function") return structuredClone(data);
  return JSON.parse(JSON.stringify(data)) as T;
}

/** 转义正则特殊字符（关键词高亮用） */
export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 允许渲染为链接的协议（相对路径 / 锚点另行放行） */
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * 链接协议白名单：仅放行 http / https / mailto / tel 与相对路径。
 * 简历数据常来自用户导入或第三方接口，`javascript:` / `data:text/html` 等协议
 * 会被 React 18 原样渲染（仅 dev 告警），必须在此拦截。
 */
export function safeHref(raw?: string | null): string | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  if (!value) return undefined;
  if (
    value.startsWith("#") ||
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("../")
  ) {
    return value;
  }
  try {
    // 以占位 origin 解析，相对文本会落到 https；协议不在白名单则丢弃
    const { protocol } = new URL(value, "https://vr.invalid/");
    return SAFE_PROTOCOLS.has(protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 关键词高亮：把命中词包裹为 <mark>。纯文本拆分，不使用 dangerouslySetInnerHTML。
 * keywords 为空时原样返回文本。
 */
const HIGHLIGHT_CACHE_LIMIT = 50;
const highlightRegExpCache = new Map<string, RegExp>();

/** 按关键词签名缓存正则，避免每次高亮都重新编译；超过上限时整体清空 */
function getHighlightRegExp(keywords: string[]): RegExp {
  const signature = keywords.join("\u0001");
  let re = highlightRegExpCache.get(signature);
  if (!re) {
    if (highlightRegExpCache.size >= HIGHLIGHT_CACHE_LIMIT) highlightRegExpCache.clear();
    re = new RegExp(`(${keywords.map((k) => escapeRegExp(k)).join("|")})`, "gi");
    highlightRegExpCache.set(signature, re);
  }
  // 复用全局正则前必须重置游标，否则会从上一次匹配位置继续
  re.lastIndex = 0;
  return re;
}

export function highlightText(
  text: string,
  keywords?: string[]
): React.ReactNode {
  if (!text) return text;
  const kws = (keywords ?? []).filter(Boolean);
  if (kws.length === 0) return text;
  const re = getHighlightRegExp(kws);
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <mark
        key={`kw-${i++}`}
        style={{ background: tokens.markBg, color: tokens.markText, padding: "0 2px", borderRadius: 2 }}
      >
        {m[0]}
      </mark>
    );
    last = m.index + m[0].length;
    if (m.index === re.lastIndex) re.lastIndex++; // 防零宽死循环
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : text;
}
