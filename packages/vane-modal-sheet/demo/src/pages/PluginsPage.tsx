/**
 * 插件工坊：全部插件的目录卡（priority / 挂载 / 职责）
 *
 * 数据源 data/plugins.ts（与总览页数字、docs/plugins.md 三方对齐）。
 */
import React from "react";
import { PLUGINS } from "../data/plugins";

export function PluginsPage() {
  return (
    <article>
      <header className="page-head">
        <div>
          <p className="eyebrow">workshop · 插件工坊</p>
          <h1 className="page-title">插件目录</h1>
        </div>
        <div className="page-facts">
          <div>
            <b>{PLUGINS.length}</b>
            <span>plugins</span>
          </div>
        </div>
      </header>

      <p className="page-sub">
        priority 按主题分带防撞车：10s 遮罩 / 20s 把手 / 30–40s 头尾 /
        50–60s 行为环境 / 80–90s 反馈与内容。同槽多插件按 order 升序渲染、
        priority 降序加载；单插件抛错由边界隔离。完整 config 表见左侧
        「插件」文档页。
      </p>

      <section className="demo-stage" style={{ display: "grid", gap: 10 }}>
        {PLUGINS.map((p) => (
          <div
            key={p.name}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 12,
              background: "var(--ink-2)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <code
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 13,
                color: "var(--accent)",
                minWidth: 170,
              }}
            >
              {p.name}
            </code>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 12,
                color: "var(--dim)",
                minWidth: 28,
                textAlign: "right",
              }}
            >
              {p.priority}
            </span>
            <span style={{ fontSize: 13, color: "var(--dim)" }}>{p.desc}</span>
          </div>
        ))}
      </section>
    </article>
  );
}
