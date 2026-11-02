/**
 * 场景板卡片：刊头（编号 + 中英标题 + 一句话）+ 舞台（真跑的组件）。
 * 样式与外壳 stage 风格一致，深底面板。
 */
import React from "react";

export interface ScenarioCardProps {
  /** 场景名 */
  title: string;
  /** 英文代号 */
  en: string;
  /** 一句话说明 */
  desc: string;
  children: React.ReactNode;
}

export function ScenarioCard({ title, en, desc, children }: ScenarioCardProps) {
  return (
    <section
      style={{
        marginTop: 18,
        borderRadius: 14,
        border: "1px solid rgba(255, 255, 255, 0.08)",
        background: "var(--ink-1)",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          padding: "14px 18px 10px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, color: "#f0ede8" }}>{title}</h2>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: "var(--accent)",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {en}
        </span>
      </header>
      <p style={{ margin: 0, padding: "10px 18px 0", fontSize: 13, color: "var(--dim)" }}>
        {desc}
      </p>
      <div style={{ padding: "16px 18px 20px" }}>{children}</div>
    </section>
  );
}
