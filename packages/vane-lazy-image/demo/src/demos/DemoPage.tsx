/**
 * 单页示例骨架（对应 sku 的 demos/DemoPage.tsx，但适配 lazy-image 的 CSS 体系）。
 *
 * 结构：刊头（序号 + 分组 + 标题 + 描述）→ 舞台（真实运行，包一层 Suspense，因为
 * registry 里的 Stage 是 React.lazy 组件）→ 完整源码（?raw 注入，与正在跑的版本一致）。
 * 复用本站既有的 .page / .page-header / .block-title / .loading 与 CodeBlock，
 * 不引入 sku 的样式，避免视觉断裂。
 */
import React, { Suspense } from "react";
import { CodeBlock } from "../components/CodeBlock";
import type { DemoEntry } from "./types";
import { GROUP_META } from "./types";

export function DemoPage({ entry, order }: { entry: DemoEntry; order: number }) {
  const { meta, Stage, file, source } = entry;
  return (
    <section className="page" data-demo={meta.slug}>
      <div className="page-header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontFamily: "var(--ff-mono, monospace)",
              fontSize: "0.8em",
              color: "var(--text-3)",
              border: "1px solid var(--accent-line)",
              borderRadius: 6,
              padding: "1px 8px",
            }}
          >
            {String(order).padStart(2, "0")}
          </span>
          <span
            style={{
              fontSize: "0.78em",
              color: "var(--accent-2)",
              letterSpacing: 0.04 * 1 + "em",
            }}
          >
            {GROUP_META[meta.group].label}
          </span>
        </div>
        <h1 className="page-title">{meta.title}</h1>
        {meta.description ? <p className="page-desc">{meta.description}</p> : null}
      </div>

      <div className="demo-stage-wrap">
        <Suspense fallback={<div className="loading">加载中…</div>}>
          <Stage />
        </Suspense>
      </div>

      {source ? (
        <div className="demo-source">
          <h4 className="block-title">完整源码 · {file}</h4>
          <CodeBlock code={source} label={file} />
        </div>
      ) : null}
    </section>
  );
}
