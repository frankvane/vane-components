/**
 * 场景示例（/scenarios）
 *
 * 六张卡 = 六个真实版式。每张卡都是可交互的（切附件、点素材、拖文件、改映射），
 * 不是截图。卡片下方给两份源码：
 *   - 最小装配：只有 import + withPlugins，贴到自己项目里就能用；
 *   - 本页源码：这份版式的完整实现（`?raw` 同源，看到的就是跑起来的）。
 */
import React, { useState } from "react";
import { CodeBlock } from "../components/CodeBlock";
import { auditPreviews, summarizeIssues } from "../lib/audit";
import { SCENARIOS, minimalCode } from "../scenarios/registry";

type CodeTab = "min" | "full";

const ScenarioCard: React.FC<{ entry: (typeof SCENARIOS)[number]; order: number }> = ({
  entry,
  order,
}) => {
  const { meta } = entry.Module;
  const Scenario = entry.Module.default;
  const [tab, setTab] = useState<CodeTab>("min");
  const [open, setOpen] = useState(false);

  return (
    <article className="scn-card" data-scenario={entry.id}>
      <header className="scn-head">
        <span className="scn-code">{meta.code}</span>
        <h3 className="scn-title">{meta.title}</h3>
        <span className="scn-ref">
          {String(order).padStart(2, "0")} · {entry.file}
        </span>
      </header>

      <p className="scn-pain">{meta.pain}</p>

      <div className="scn-stage">
        <Scenario />
      </div>

      <ul className="scn-plugs">
        {meta.plugs.map((p) => (
          <li className="scn-plug" key={p.fn + p.why}>
            <code>{p.fn}</code>
            <span>{p.why}</span>
          </li>
        ))}
      </ul>

      {meta.note ? <p className="scn-note">{meta.note}</p> : null}

      <div className="demo-switch" role="tablist" aria-label={`${meta.title} 源码`}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "min"}
          className={tab === "min" ? "is-active" : ""}
          onClick={() => {
            setTab("min");
            setOpen(true);
          }}
        >
          最小装配
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "full"}
          className={tab === "full" ? "is-active" : ""}
          onClick={() => {
            setTab("full");
            setOpen(true);
          }}
        >
          本页源码
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={false}
          onClick={() => setOpen((v) => !v)}
          style={{ marginLeft: "auto" }}
        >
          {open ? "收起代码" : "展开代码"}
        </button>
      </div>

      {open ? (
        <div className="scn-code-wrap">
          <CodeBlock
            key={tab}
            code={tab === "min" ? minimalCode(entry) : entry.source}
            title={tab === "min" ? `${entry.id}.minimal.tsx` : entry.file}
            collapseAfter={tab === "min" ? 0 : 32}
            maxHeight={460}
          />
        </div>
      ) : null}
    </article>
  );
};

export const ScenariosPage: React.FC = () => {
  const [audit, setAudit] = useState<string | null>(null);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">场景示例</h1>
        <p className="page-desc">
          {SCENARIOS.length} 个真实版式：上传即预览、邮件附件、文档审批、素材库、数据导入、代码评审。
          每张卡都能点、能拖、能切换，预览器装的是同一套组件 —— 不是截图。
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-mini"
            onClick={() => {
              const issues = auditPreviews(document);
              setAudit(summarizeIssues(issues, document.querySelectorAll("[data-scenario]").length));
            }}
          >
            量一次几何
          </button>
          <span className="muted" style={{ fontSize: 11.5 }}>
            {audit ?? "与 scripts/audit-pages.mjs 同一套判据"}
          </span>
        </div>
      </div>

      <div className="scn-list">
        {SCENARIOS.map((entry, i) => (
          <ScenarioCard key={entry.id} entry={entry} order={i + 1} />
        ))}
      </div>
    </div>
  );
};
