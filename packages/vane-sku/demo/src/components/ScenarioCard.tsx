import React from "react";

import { CodeBlock } from "./CodeBlock";
import { loadComponent, loadSource, type ScenarioMeta } from "../scenarios/catalog";

/**
 * 一张场景卡：左「实时预览」，右「源码」（默认展开，可折叠）。
 * 源码读场景文件原文（?raw），所以展示的永远是真实跑起来的那份。
 */
export const ScenarioCard: React.FC<{
  meta: ScenarioMeta;
  defaultOpen?: boolean;
}> = ({ meta, defaultOpen = true }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const [source, setSource] = React.useState<string>("");
  const [err, setErr] = React.useState<string>("");

  const Preview = React.useMemo(() => {
    const loader = loadComponent(meta.id);
    return loader ? React.lazy(loader) : null;
  }, [meta.id]);

  React.useEffect(() => {
    let alive = true;
    const loader = loadSource(meta.id);
    if (!loader) {
      setErr("源码文件缺失");
      return;
    }
    setSource("");
    setErr("");
    loader()
      .then((text) => {
        if (alive) setSource(text);
      })
      .catch((e: unknown) => {
        if (alive) setErr(String(e));
      });
    return () => {
      alive = false;
    };
  }, [meta.id]);

  return (
    <article className="scn-card" id={`scn-${meta.id}`}>
      <header className="scn-head">
        <span className="scn-code">{String(meta.no).padStart(2, "0")}</span>
        <h3 className="scn-title">{meta.title}</h3>
      </header>
      <p className="scn-pain">{meta.hint}</p>

      <div className="scn-body">
        <div className="scn-stage">
          {Preview ? (
            <React.Suspense fallback={<div className="scn-stage-fallback">LOADING PREVIEW…</div>}>
              <Preview />
            </React.Suspense>
          ) : (
            <div className="scn-stage-fallback">预览缺失</div>
          )}
        </div>

        <div className="scn-side">
          <button
            type="button"
            className="scn-toggle"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "隐藏源码" : "查看源码"}
          </button>
          {open && (
            <div className="scn-code-wrap">
              {err ? (
                <div className="scn-empty">{err}</div>
              ) : (
                <CodeBlock code={source || "// 正在读取源码…"} label={`tsx · ${meta.id}.tsx`} />
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
