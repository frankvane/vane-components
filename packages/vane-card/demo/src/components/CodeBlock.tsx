/**
 * 代码块：标题栏 + 复制按钮 + 超长折叠
 *
 * 复制走两条路：`navigator.clipboard`（需要 secure context）不行时退到
 * 隐藏 textarea + execCommand —— 示例站常被挂在 http://内网IP 上访问，
 * 只走 clipboard API 会静默失败，用户点了没反应最难受。
 */
import React, { useCallback, useMemo, useState } from "react";
import { tokenize } from "./highlight";

export interface CodeBlockProps {
  code: string;
  /** 标题栏左侧文案，如 `scenarios/photo-feed.tsx` */
  title?: string;
  /** 超过多少行折叠，默认 24；0 表示不折叠 */
  collapseAfter?: number;
  /** 代码区最大高度 */
  maxHeight?: number;
}

type CopyState = "idle" | "ok" | "fail";

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function CodeBlock({ code, title = "tsx", collapseAfter = 24, maxHeight }: CodeBlockProps) {
  const [state, setState] = useState<CopyState>("idle");
  const [open, setOpen] = useState(false);

  const lines = useMemo(() => code.replace(/\s+$/, "").split("\n"), [code]);
  const needCollapse = collapseAfter > 0 && lines.length > collapseAfter;
  const shown = needCollapse && !open ? lines.slice(0, collapseAfter).join("\n") : code;

  const tokens = useMemo(() => tokenize(shown), [shown]);

  const copy = useCallback(async () => {
    let ok = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(code);
        ok = true;
      } catch {
        ok = fallbackCopy(code);
      }
    } else {
      ok = fallbackCopy(code);
    }
    setState(ok ? "ok" : "fail");
    window.setTimeout(() => setState("idle"), 1600);
  }, [code]);

  return (
    <div className="code">
      <div className="code-head">
        <span>{title}</span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ opacity: 0.7 }}>{lines.length} 行</span>
          <button
            type="button"
            className={`code-copy${state === "ok" ? " is-ok" : state === "fail" ? " is-fail" : ""}`}
            onClick={copy}
          >
            {state === "ok" ? "已复制" : state === "fail" ? "复制失败" : "复制"}
          </button>
        </span>
      </div>
      <pre style={maxHeight ? { maxHeight } : undefined}>
        <code>
          {tokens.map((t, i) =>
            t.cls ? (
              <span key={i} className={t.cls}>
                {t.text}
              </span>
            ) : (
              <React.Fragment key={i}>{t.text}</React.Fragment>
            )
          )}
        </code>
      </pre>
      {needCollapse ? (
        <button type="button" className="code-more" onClick={() => setOpen((v) => !v)}>
          {open ? "收起" : `展开余下 ${lines.length - collapseAfter} 行`}
        </button>
      ) : null}
    </div>
  );
}
