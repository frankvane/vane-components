import React from "react";

import { CodeBlock } from "./CodeBlock";
import { loadComponent, loadSource, minimalCode } from "../scenarios/catalog";
import type { ScenarioMeta } from "../scenarios/types";

/**
 * 一张场景卡：左「实时复刻舞台」，右「装配清单 + 两份可复制源码」。
 * 完整版源码直接读组件文件原文（?raw），所以看到的和跑起来的一定是同一份。
 */
export const ScenarioCard: React.FC<{ meta: ScenarioMeta }> = ({ meta }) => {
  const [mode, setMode] = React.useState<"full" | "min">("full");
  const [full, setFull] = React.useState<string>("");
  const [sourceError, setSourceError] = React.useState<string>("");

  const Preview = React.useMemo(() => {
    const loader = loadComponent(meta.id);
    return loader ? React.lazy(loader) : null;
  }, [meta.id]);

  const minimal = React.useMemo(() => minimalCode(meta), [meta]);

  React.useEffect(() => {
    let alive = true;
    const loader = loadSource(meta.id);
    if (!loader) {
      setSourceError("源码文件缺失");
      return;
    }
    setFull("");
    setSourceError("");
    loader()
      .then((text) => {
        if (alive) setFull(text);
      })
      .catch((err: unknown) => {
        if (alive) setSourceError(String(err));
      });
    return () => {
      alive = false;
    };
  }, [meta.id]);

  const code = mode === "min" ? minimal : full || "// 正在读取源码…";

  return (
    <article className="scn-card" id={`scn-${meta.id}`}>
      <header className="scn-head">
        <span className="scn-code">{meta.code}</span>
        <h3 className="scn-title">{meta.title}</h3>
        <a
          className="scn-ref"
          href={meta.ref.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          版式参照 {meta.ref.site} · {meta.ref.page} ↗
        </a>
      </header>

      <p className="scn-pain">{meta.pain}</p>

      <div className="scn-body">
        <div className={`scn-stage tone-${meta.tone}`}>
          {Preview ? (
            <React.Suspense fallback={<div className="scn-stage-fallback">LOADING PREVIEW…</div>}>
              <Preview />
            </React.Suspense>
          ) : (
            <div className="scn-stage-fallback">预览缺失</div>
          )}
        </div>

        <div className="scn-side">
          <ul className="scn-plugs">
            {meta.plugs.map((p) => (
              <li className="scn-plug" key={p.fn + (p.arg ?? "")}>
                <code>
                  {p.fn}
                  {p.arg ? `(${p.arg})` : "()"}
                </code>
                <span>{p.why}</span>
              </li>
            ))}
          </ul>

          <div className="scn-switch" role="group" aria-label="源码版本">
            <button type="button" aria-pressed={mode === "full"} onClick={() => setMode("full")}>
              完整版（含版式）
            </button>
            <button type="button" aria-pressed={mode === "min"} onClick={() => setMode("min")}>
              最小装配
            </button>
          </div>

          <div className="scn-code-wrap">
            {sourceError ? (
              <div className="scn-empty">{sourceError}</div>
            ) : (
              <CodeBlock
                code={code}
                label={mode === "min" ? "tsx · 最小可用" : `tsx · ${meta.id}.tsx`}
              />
            )}
          </div>

          {meta.note && <p className="scn-note">{meta.note}</p>}
        </div>
      </div>
    </article>
  );
};
