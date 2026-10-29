import React from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// 只注册演示站真正用到的两种语言：Prism 全量包会把 200+ 语言打进产物（~640KB），
// 按需注册后同一模块降到 30KB 量级。
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("javascript", javascript);

/**
 * 复制到剪贴板：优先 Clipboard API；http 局域网等非安全上下文下
 * Clipboard API 不可用，回退 execCommand('copy')。
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 落到回退分支 */
  }
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

// 代码块统一成「编辑器面板」：等宽字体、发丝边框、顶部一条语言标签 + 复制按钮，
// 与整站暗场语言保持一致（oneDark 的 token 配色本身可读，只换容器）。
//
// 唯一需要改的是注释色：oneDark 的 #5c6370 压在 #0a0908 上只有 3.29:1，
// 而注释占了源码块里相当大的篇幅 —— 提到 #8b93a1（5.6:1），观感仍是"灰的"。
const CODE_THEME = {
  ...oneDark,
  comment: { ...(oneDark as Record<string, React.CSSProperties>)["comment"], color: "#8b93a1" },
  prolog: { ...(oneDark as Record<string, React.CSSProperties>)["prolog"], color: "#8b93a1" },
};

export const CodeBlock: React.FC<{
  code: string;
  language?: string;
  /** 顶栏左侧标签，默认取 language */
  label?: string;
  copyable?: boolean;
}> = ({ code, language = "tsx", label, copyable = true }) => {
  const [state, setState] = React.useState<"idle" | "ok" | "fail">("idle");

  React.useEffect(() => {
    if (state === "idle") return;
    const t = window.setTimeout(() => setState("idle"), 1500);
    return () => window.clearTimeout(t);
  }, [state]);

  const onCopy = async () => {
    setState((await copyText(code)) ? "ok" : "fail");
  };

  return (
    <div className="code-shell">
      <div className="code-bar">
        <span className="code-lang">{label ?? language}</span>
        <span className="code-actions">
          {copyable && (
            <button
              type="button"
              className={`code-copy${state === "ok" ? " is-ok" : ""}${
                state === "fail" ? " is-fail" : ""
              }`}
              onClick={onCopy}
              aria-live="polite"
            >
              {state === "ok" ? "已复制" : state === "fail" ? "复制失败" : "复制"}
            </button>
          )}
          <span className="code-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </span>
      </div>
      <SyntaxHighlighter
        language={language}
        style={CODE_THEME}
        customStyle={{
          margin: 0,
          padding: "14px 16px",
          background: "transparent",
          borderRadius: 0,
          fontSize: 12.5,
          lineHeight: 1.7,
          fontFamily: "var(--ff-mono)",
        }}
        codeTagProps={{ style: { fontFamily: "var(--ff-mono)" } }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};
