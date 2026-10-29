import React from "react";
import { CodeBlock } from "../components/CodeBlock";
import { PLUGIN_GROUPS, PLUGIN_COUNT, type PluginEntry } from "../data/plugin-catalog";
import { loadComponent, loadSource, type ScenarioMeta, SCENARIOS } from "../scenarios/catalog";

/** 插件 id → 演示场景 id（同款预览 + 同款源码，见 data/plugin-catalog 的 demo 字段） */
const scenarioOf = (demoId: string): ScenarioMeta | undefined =>
  SCENARIOS.find((s) => s.id === demoId);

/** 一张插件卡：说明 + 实时演示（复用对应场景的真实实现）+ 可折叠源码 */
const PluginCard: React.FC<{ entry: PluginEntry }> = ({ entry }) => {
  const [open, setOpen] = React.useState(false);
  const scenario = scenarioOf(entry.demo);

  const Preview = React.useMemo(() => {
    if (!scenario) return null;
    const loader = loadComponent(scenario.id);
    return loader ? React.lazy(loader) : null;
  }, [scenario]);

  const sourceRef = React.useMemo(() => (scenario ? loadSource(scenario.id) : undefined), [scenario]);

  return (
    <article className="group-card" id={entry.id}>
      <h3>
        <span className="idx">{entry.renders ? "UI" : "EV"}</span>
        <span>{entry.name}</span>
        <span className="count">{entry.renders ? "渲染型" : "事件型"}</span>
      </h3>
      <p style={{ margin: "0 0 10px", fontSize: 13.5, lineHeight: 1.65, color: "var(--text-3)" }}>
        {entry.description}
      </p>
      <div className="group-card-items">
        <code className="chip" style={{ fontFamily: "var(--ff-mono)", fontSize: 11.5 }}>
          vane-sku/custom-plugins/{entry.id}
        </code>
      </div>
      {entry.tags?.length ? (
        <div className="tag-row">
          {entry.tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>
      ) : null}

      {/* 实时演示：与场景集共用同一份 spec（看到的和跑起来的必然一致） */}
      {scenario && (
        <div className="scn-stage plugin-demo-stage">
          {Preview ? (
            <React.Suspense fallback={<div className="scn-stage-fallback">LOADING PREVIEW…</div>}>
              <Preview />
            </React.Suspense>
          ) : (
            <div className="scn-stage-fallback">预览缺失</div>
          )}
        </div>
      )}

      {scenario && (
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
              <CodeBlockLoader loader={sourceRef} label={`tsx · ${scenario.id}.tsx`} />
            </div>
          )}
        </div>
      )}
    </article>
  );
};

/** 源码异步读取（?raw），单独小组件管理加载态 */
const CodeBlockLoader: React.FC<{
  loader?: () => Promise<string>;
  label: string;
}> = ({ loader, label }) => {
  const [source, setSource] = React.useState("");
  React.useEffect(() => {
    let alive = true;
    loader?.()
      .then((text) => alive && setSource(text))
      .catch(() => alive && setSource("// 源码读取失败"));
    return () => {
      alive = false;
    };
  }, [loader]);
  return <CodeBlock code={source || "// 正在读取源码…"} label={label} />;
};

/**
 * 插件清单：数据全部来自各插件 doc.json 的 meta（见 data/plugin-catalog），
 * 不手写第二份，改描述时这里自动跟着变。
 * 每张卡内嵌对应场景的实时演示与源码——「没一个能显示出来」的静态清单已成历史。
 */
export function PluginsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">插件清单</h1>
        <p className="page-desc">
          vane-sku 共 {PLUGIN_COUNT} 个官方插件，全部走子路径按需引入（
          <code>vane-sku/custom-plugins/&lt;Name&gt;</code>），不进根入口。
          标注「事件型」的插件不渲染任何 UI，只提供行为或数据出口。
          每张卡里的演示都在真实运行——与场景集共用同一份实现。
        </p>
      </div>

      {PLUGIN_GROUPS.map((g, gi) => (
        <React.Fragment key={g.group}>
          <h2 className="section-title">
            {String(gi + 1).padStart(2, "0")} · {g.group}
          </h2>
          <div className="group-grid">
            {g.items.map((p) => (
              <PluginCard key={p.id} entry={p} />
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
