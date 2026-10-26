import React from "react";

// 替代旧版 DemoPage：仅做标题/描述 + 内容容器 + 轻量源码视图（可选 source）。
export const DemoLayout: React.FC<{
  title: string;
  description?: string;
  source?: string;
  children: React.ReactNode;
}> = ({ title, description, source, children }) => {
  const [showSrc, setShowSrc] = React.useState(false);
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      <div className="page-body">{children}</div>
      {source && (
        <div style={{ marginTop: 24 }}>
          <button
            className="btn"
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
    </div>
  );
};
