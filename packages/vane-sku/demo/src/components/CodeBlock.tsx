import React from "react";

/**
 * 代码块：与 vane-lazy-image 演示站同一套「编辑器面板」视觉（暗场 + 语言标签 + 复制按钮 +
 * 交通灯圆点），但零依赖实现——不引入 react-syntax-highlighter，避免给 demo 构建增加
 * 640KB 级体积与一次联网安装。改用一套轻量、转义安全的 TS/JS token 着色器（注释 / 字符串 /
 * 数字 / 关键字），够用且不会把 JSX 染花。
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * 极简着色器：先整体转义，再用单个 tokenizer 正则捕获 注释 / 字符串 / 数字 / 关键字，
 * 把命中的片段包进 span。顺序与分组保证字符串里的 `//` 不会被误当注释。
 */
function highlight(code: string): string {
  const esc = escapeHtml(code);
  const TOKEN =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d[\d_.]*\b)|(\b(?:import|from|export|const|let|var|function|return|if|else|for|while|new|await|async|type|interface|extends|implements|default|true|false|null|undefined|void|typeof|as|of|in)\b)/g;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN.exec(esc))) {
    out += esc.slice(last, m.index);
    const full = m[0];
    if (m[1]) out += `<span class="tok-com">${full}</span>`;
    else if (m[2]) out += `<span class="tok-str">${full}</span>`;
    else if (m[3]) out += `<span class="tok-num">${full}</span>`;
    else if (m[4]) out += `<span class="tok-kw">${full}</span>`;
    else out += full;
    last = m.index + full.length;
  }
  out += esc.slice(last);
  return out;
}

export const CodeBlock: React.FC<{
  code: string;
  language?: string;
  /** 顶栏左侧标签，默认取 language */
  label?: string;
  copyable?: boolean;
}> = ({ code, language = "tsx", label, copyable = true }) => {
  const [state, setState] = React.useState<"idle" | "ok" | "fail">("idle");
  const html = React.useMemo(() => highlight(code), [code]);

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
              className={`code-copy${state === "ok" ? " is-ok" : ""}${state === "fail" ? " is-fail" : ""}`}
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
      <pre className="code-pre">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
};
