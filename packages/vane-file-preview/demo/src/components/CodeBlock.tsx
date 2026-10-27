/**
 * 代码块：标题栏（语言 + 行数 + 复制）+ 超长折叠
 *
 * 高亮用 react-syntax-highlighter 的 PrismLight，只注册演示站真正用到的几种语言。
 * 全量 prism 会把 200+ 语言打进产物（~640KB），而这里出现的只有 tsx/ts/js/json/
 * css/xml/markdown —— 按需注册后同一模块降到几十 KB 量级。
 * （包内的 CodePreviewPlugin 用的是同一套思路，只是它做得更彻底：连主题都只留两套。）
 *
 * 复制保留两条路：`navigator.clipboard` 在 http://内网IP 这类非安全上下文下不可用，
 * 只走它会出现「点了没反应」；退路是隐藏 textarea + execCommand。
 */
import React, { useCallback, useMemo, useState } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("markup", markup);
SyntaxHighlighter.registerLanguage("markdown", markdown);

type CopyState = "idle" | "ok" | "fail";

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export interface CodeBlockProps {
  code: string;
  /** 标题栏左侧：文件名或说明 */
  title?: string;
  language?: string;
  /** 超过多少行折叠，默认 26；0 = 不折叠 */
  collapseAfter?: number;
  maxHeight?: number;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  title,
  language = "tsx",
  collapseAfter = 26,
  maxHeight,
}) => {
  const [state, setState] = useState<CopyState>("idle");
  const [open, setOpen] = useState(false);

  const lines = useMemo(() => code.replace(/\s+$/, "").split("\n"), [code]);
  const needCollapse = collapseAfter > 0 && lines.length > collapseAfter;
  const shown = needCollapse && !open ? lines.slice(0, collapseAfter).join("\n") : code;

  const copy = useCallback(async () => {
    let ok = false;
    if (navigator.clipboard?.writeText && window.isSecureContext) {
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
        <span title={title}>{title ?? language}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ opacity: 0.65 }}>{lines.length} 行</span>
          <button
            type="button"
            className={`code-copy${state === "ok" ? " is-ok" : state === "fail" ? " is-fail" : ""}`}
            onClick={copy}
            aria-live="polite"
          >
            {state === "ok" ? "已复制" : state === "fail" ? "复制失败" : "复制"}
          </button>
        </span>
      </div>
      <pre style={maxHeight ? { maxHeight } : undefined}>
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: 0,
            background: "transparent",
            fontSize: 12.5,
            lineHeight: 1.72,
            fontFamily: "var(--ff-mono)",
          }}
          codeTagProps={{ style: { fontFamily: "var(--ff-mono)" } }}
          wrapLongLines
        >
          {shown}
        </SyntaxHighlighter>
      </pre>
      {needCollapse && (
        <button type="button" className="code-more" onClick={() => setOpen((v) => !v)}>
          {open ? "收起" : `展开余下 ${lines.length - collapseAfter} 行`}
        </button>
      )}
    </div>
  );
};
