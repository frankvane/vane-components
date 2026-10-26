import React from "react";

// 每个场景一块面板：标题 / 描述 / 内容 / 可折叠源码。
// 不使用 .page（外层页面已经有 .page 了，嵌套会重复分隔线与最大宽度）。
export const DemoLayout: React.FC<{
  title: string;
  description?: string;
  source?: string;
  children: React.ReactNode;
}> = ({ title, description, source, children }) => {
  const [showSrc, setShowSrc] = React.useState(false);
  return (
    <section className="demo-block">
      <header className="demo-head">
        <h2 className="demo-title">{title}</h2>
        {description && <p className="demo-desc">{description}</p>}
      </header>
      <div className="demo-body">{children}</div>
      {source && (
        <div className="demo-foot">
          <button
            type="button"
            className="btn btn-mini"
            aria-expanded={showSrc}
            onClick={() => setShowSrc((v) => !v)}
          >
            {showSrc ? "隐藏源码" : "查看源码"}
          </button>
          {showSrc && (
            <pre className="src-pre">
              <code>{source}</code>
            </pre>
          )}
        </div>
      )}
    </section>
  );
};
