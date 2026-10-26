/**
 * 示例页骨架
 *
 * 每页同一个结构，读第二页就形成肌肉记忆：
 *   标题 + 一句话 + 什么时候用
 *   → 参数控件（拖了就改行为，下面的代码同步变）
 *   → 舞台（真实运行）+ 右栏（装了哪些插件 / 为什么 / 坑位）
 *   → 通栏代码（最小装配 / 完整源码）
 *
 * 日志与 cfg 都放在这一层：换页时整体重挂载，天然不会串状态。
 */
import React, { useCallback, useMemo, useState } from "react";
import { CodeBlock } from "../components/CodeBlock";
import { buildDemoCode } from "./codegen";
import { ControlBar, EventLog, type LogLine } from "./panels";
import { GROUP_META, initialCfg, type DemoCfg, type DemoLogKind } from "./types";
import type { DemoEntry } from "./registry";

type CodeTab = "minimal" | "full";

export function DemoPage({ entry, order }: { entry: DemoEntry; order: number }) {
  const { meta, Stage, file, source } = entry;
  const [cfg, setCfg] = useState<DemoCfg>(() => initialCfg(meta));
  const [lines, setLines] = useState<LogLine[]>([]);
  const [tab, setTab] = useState<CodeTab>("minimal");

  const log = useCallback((text: string, kind: DemoLogKind = "event") => {
    const at = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    setLines((prev) => [{ id: prev.length + 1, at, text, kind }, ...prev].slice(0, 60));
  }, []);

  const onChange = useCallback((key: string, value: number | boolean | string) => {
    setCfg((prev) => ({ ...prev, [key]: value }));
  }, []);

  const code = useMemo(() => buildDemoCode(meta, cfg), [meta, cfg]);

  return (
    <section className="demo" data-demo={meta.slug}>
      <header className="demo-head">
        <div className="demo-title-row">
          <span className="demo-no">{String(order).padStart(2, "0")}</span>
          <h2>{meta.title}</h2>
          <span className="demo-group">{GROUP_META[meta.group].label}</span>
          {meta.plugin ? <code className="demo-plugin">{meta.plugin}</code> : null}
        </div>
        <p className="demo-intro">{meta.intro}</p>
        <p className="demo-why">
          <b>什么时候用</b>
          {meta.why}
        </p>
      </header>

      {meta.controls?.length ? (
        <div className="demo-controls">
          <ControlBar controls={meta.controls} cfg={cfg} onChange={onChange} />
          <button
            type="button"
            className="demo-reset"
            onClick={() => {
              setCfg(initialCfg(meta));
              setLines([]);
            }}
          >
            重置
          </button>
        </div>
      ) : null}

      <div className="demo-body">
        <div
          className={`demo-stage${meta.tone === "light" ? " tone-light" : ""}`}
          style={{ "--stage-h": `${meta.stageHeight ?? 380}px` } as React.CSSProperties}
        >
          <Stage cfg={cfg} log={log} setCfg={onChange} />
        </div>

        <aside className="demo-side">
          <div className="demo-plugs">
            {meta.plugs.length === 0 ? (
              <span className="demo-plug is-core">仅 Core props</span>
            ) : (
              meta.plugs.map((p) => (
                <span key={p.fn} className={`demo-plug${p.local ? " is-local" : ""}`}>
                  {p.fn.replace(/^create|Plugin$/g, "")}
                </span>
              ))
            )}
          </div>

          <ul className="demo-why-list">
            {meta.plugs.map((p) => (
              <li key={p.fn}>
                <code>{p.fn}</code>
                <span>{p.why}</span>
              </li>
            ))}
          </ul>

          {meta.note ? <p className="demo-note">⚠ {meta.note}</p> : null}

          <EventLog
            lines={lines}
            empty={
              meta.plugs.length > 0
                ? "还没触发 —— 拖上面的控件，或滚动 / 点卡片"
                : "这一页没有事件类行为，日志留白"
            }
          />
        </aside>
      </div>

      <div className="demo-code">
        <div className="demo-switch" role="tablist">
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
          code={tab === "minimal" ? code : source}
          title={tab === "minimal" ? `${meta.slug}.minimal.tsx` : file}
          collapseAfter={tab === "minimal" ? 0 : 26}
          maxHeight={420}
        />
      </div>
    </section>
  );
}
