/**
 * 场景卡：一卡两栏
 *
 *  左：真实运行的那份组件（不是截图、不是伪代码）
 *  右：插件清单（每个插件「为什么需要」）+ 两份源码切换
 *      · 完整版 —— `?raw` 读的就是左边正在跑的同名文件
 *      · 最小装配 —— 由 meta 现场生成，去掉业务噪音，只剩装配与 props
 */
import React, { useState } from "react";
import { CodeBlock } from "./CodeBlock";
import { buildMinimal } from "../scenarios/minimal";
import type { ScenarioEntry } from "../scenarios/catalog";

type CodeTab = "minimal" | "full";

export function ScenarioCard({ entry }: { entry: ScenarioEntry }) {
  const { meta, Component, file, source } = entry;
  const [tab, setTab] = useState<CodeTab>("minimal");

  const minimal = buildMinimal(meta);

  return (
    <section className="scn-card" id={`scn-${meta.id}`} data-scenario={meta.id}>
      <header className="scn-head">
        <h3 className="scn-title">{meta.title}</h3>
        <code className="scn-id">{file}</code>
        <a className="scn-ref" href={meta.ref.url} target="_blank" rel="noreferrer">
          {meta.ref.label} ↗
        </a>
        <p className="scn-pain">{meta.pain}</p>
      </header>

      <div className="scn-body">
        <div className={`scn-stage${meta.tone === "light" ? " tone-light" : ""}`}>
          <Component />
        </div>

        <div className="scn-side">
          <div className="scn-plugs">
            {meta.plugs.map((p) => (
              <span
                key={p.fn}
                className={`scn-plug${p.local ? " is-local" : ""}`}
                title={p.why}
              >
                {p.fn.replace(/^create|Plugin$/g, "")}
              </span>
            ))}
          </div>

          <ul className="scn-why">
            {meta.plugs.map((p) => (
              <li key={p.fn}>
                <code>{p.fn}</code>
                <span>{p.why}</span>
              </li>
            ))}
          </ul>

          {meta.note ? <p className="scn-note">⚠ {meta.note}</p> : null}
        </div>
      </div>

      {/* 代码放到两栏下方通栏：1fr 宽的代码列每行只能放 40 来个字符，读起来很痛苦 */}
      <div className="scn-code">
        <div className="scn-switch" role="tablist">
          <button
            type="button"
            className={tab === "minimal" ? "is-active" : ""}
            onClick={() => setTab("minimal")}
          >
            最小装配
          </button>
          <button
            type="button"
            className={tab === "full" ? "is-active" : ""}
            onClick={() => setTab("full")}
          >
            完整源码
          </button>
        </div>

        <CodeBlock
          key={tab}
          code={tab === "minimal" ? minimal : source}
          title={tab === "minimal" ? `${meta.id}.minimal.tsx` : file}
          collapseAfter={tab === "minimal" ? 0 : 24}
          maxHeight={430}
        />
      </div>
    </section>
  );
}
