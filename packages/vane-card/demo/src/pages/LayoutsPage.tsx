/**
 * 布局专区
 *
 * 九种版式排在一页里，可以上下对照 —— 「同一份数据，换个排法差别有多大」这件事
 * 只有并排看才成立。
 *
 * 每块的结构和场景页一致：左真实运行、右结构要点、下完整源码（`?raw` 同源）。
 * 区别是这里不生成「最小装配」：版式的重点在 children 结构，不在插件清单。
 */
import React from "react";
import { CodeBlock } from "../components/CodeBlock";
import { LAYOUTS } from "../layouts/catalog";

export function LayoutsPage() {
  const pluginCount = new Set(LAYOUTS.flatMap((l) => l.meta.plugins)).size;

  const jump = (id: string) => {
    document.getElementById(`lay-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">layouts · 版式样板</p>
          <h2 className="page-title">布局专区</h2>
          <p className="page-sub">
            同一份数据摆成九种形状。这里不教插件，教<strong>结构</strong>：图占多少、文字留多少
            padding、什么时候让图通栏、什么时候该放弃图。每块下面的源码就是左边正在跑的那份，
            可以整段抄走改。
          </p>
        </div>
        <div className="page-facts">
          <div>
            <b>{LAYOUTS.length}</b>
            <span>layouts</span>
          </div>
          <div>
            <b>{pluginCount}</b>
            <span>plugins used</span>
          </div>
          <div>
            <b>0</b>
            <span>extra deps</span>
          </div>
        </div>
      </header>

      <div className="scn-tabs">
        {LAYOUTS.map((l) => (
          <button key={l.meta.id} type="button" className="scn-tab" onClick={() => jump(l.meta.id)}>
            {l.meta.title}
            <span className="n">{l.file.slice(0, 2)}</span>
          </button>
        ))}
      </div>

      {LAYOUTS.map(({ meta, Component, file, source }) => (
        <section className="scn-card" key={meta.id} id={`lay-${meta.id}`} data-plate={meta.id}>
          <header className="scn-head">
            <span className="scn-folio" aria-hidden>
              {file.slice(0, 2)}
            </span>
            <h3 className="scn-title">{meta.title}</h3>
            <div className="scn-head-meta">
              <code className="scn-id">{meta.en}</code>
              <span className="scn-ref">{meta.width}px</span>
            </div>
            <p className="scn-pain">{meta.use}</p>
          </header>

          <div className="scn-body">
            <figure className="plate scn-plate">
              <figcaption className="plate-cap">
                <b>stage</b>
                <span>
                  {meta.width}px · {meta.plugins.length} plugins
                </span>
                <em>live</em>
              </figcaption>
              <div className="plate-ruler" aria-hidden />
              <div
                className={`scn-stage${meta.tone === "dark" ? " tone-dark" : ""}`}
                style={{ "--card-w": `${meta.width}px` } as React.CSSProperties}
              >
                <Component />
              </div>
            </figure>

            <div className="scn-side">
              <div className="scn-plugs">
                {meta.plugins.length === 0 ? (
                  <span className="scn-plug is-local">仅 children</span>
                ) : (
                  meta.plugins.map((p) => (
                    <span key={p} className="scn-plug">
                      {p}
                    </span>
                  ))
                )}
              </div>

              <ul className="scn-why">
                {meta.structure.map((s, i) => (
                  <li key={i}>
                    <code>{String(i + 1).padStart(2, "0")}</code>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="scn-code">
            <CodeBlock code={source} title={file} collapseAfter={22} maxHeight={420} />
          </div>
        </section>
      ))}
    </div>
  );
}
