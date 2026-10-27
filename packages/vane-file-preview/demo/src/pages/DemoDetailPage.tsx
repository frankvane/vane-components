/**
 * 逐项示例页的骨架
 *
 * 每页同一个结构，读第二页就形成肌肉记忆：
 *   刊头（编号 + 标题 + 分组 + 插件码 + 一句话 + 什么时候用 + 元信息）
 *   → 档位条（换一套装配，而不是拖参数）
 *   → 灯箱（切样本文件，底下一行读数）+ 右栏（插件 / 为什么 / 坑 / 事件日志 / 参数表）
 *   → 通栏代码（官方用法示例 / 本页源码）
 *
 * 状态（文件、档位、日志、状态机）全在这一层：路由参数一变就整体重挂，
 * 天然不会串页。
 */
import React, { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { FileInfo, PreviewStateInfo } from "vane-file-preview";
import { CodeBlock } from "../components/CodeBlock";
import { ConfigTable } from "../components/ConfigTable";
import { EventLog, type LogLine } from "../components/EventLog";
import { Stage } from "../components/Stage";
import { VariantBar } from "../components/VariantBar";
import { GROUP_LABELS, folioOf, getPlugin } from "../data/plugin-catalog";
import { pick } from "../data/samples";
import { findDemo } from "../demos/registry";
import { auditPreviews, summarizeIssues } from "../lib/audit";
import { stamp } from "../lib/format";
import { assemblyCode, previewOf, type LogKind } from "../lib/previews";

type CodeTab = "example" | "source";

const PluginPage: React.FC<{ id: string }> = ({ id }) => {
  const plugin = getPlugin(id)!;
  const demo = findDemo(id)!;
  const files = useMemo(() => pick(...plugin.files), [plugin.files]);

  const [fileName, setFileName] = useState(files[0].name);
  const [variant, setVariant] = useState(plugin.variants[0].key);
  const [lines, setLines] = useState<LogLine[]>([]);
  const [state, setState] = useState<PreviewStateInfo>({ state: "idle" });
  const [tab, setTab] = useState<CodeTab>("example");
  const [audit, setAudit] = useState<string | null>(null);

  const log = useCallback((text: string, kind: LogKind = "info") => {
    setLines((prev) => [{ id: prev.length + 1, at: stamp(), text, kind }, ...prev].slice(0, 40));
  }, []);

  // filePatch 是插件对文件的额外要求（目前只有 docx 的 docxMode）。
  // 不合并的话，「版式还原」那一页会静默变成「没有插件能预览这个文件」——
  // 而且几何体检看不出来（块在、尺寸正常），所以这一处必须在数据层合并，不能靠页面自觉。
  const base = files.find((f) => f.name === fileName) ?? files[0];
  const file: FileInfo = plugin.filePatch ? { ...base, ...plugin.filePatch } : base;
  const Demo = demo.Module.default;
  const preview = previewOf(variant);
  const defaultPreview = previewOf(plugin.defaultKey);

  const runAudit = useCallback(() => {
    const issues = auditPreviews(document);
    setAudit(summarizeIssues(issues, document.querySelectorAll("[data-demo]").length));
  }, []);

  return (
    <section className="demo" data-demo={plugin.id}>
      <header className="demo-head">
        <div className="demo-folio">
          <span className="demo-no">{folioOf(plugin.id)}</span>
          <em>plate</em>
        </div>

        <div>
          <div className="demo-title-row">
            <h2>{plugin.title}</h2>
            <span className="demo-group">{GROUP_LABELS[plugin.group].label}</span>
            <code className="demo-plugin">{plugin.dir}</code>
          </div>
          <p className="demo-intro">{plugin.oneLiner}</p>
          <p className="demo-why">
            <b>什么时候用</b>
            {plugin.why}
          </p>
        </div>

        <div className="demo-meta">
          <div className="demo-meta-row">
            <span>file</span>
            <b>{demo.file}</b>
          </div>
          <div className="demo-meta-row">
            <span>factory</span>
            <b>{plugin.factoryName}</b>
          </div>
          <div className="demo-meta-row">
            <span>params</span>
            <b>{plugin.doc.config?.length ?? 0}</b>
          </div>
        </div>
      </header>

      <div className="demo-controls">
        <VariantBar variants={plugin.variants} value={variant} onChange={setVariant} />
      </div>

      <div className="demo-body">
        <Stage
          files={files}
          value={fileName}
          onChange={setFileName}
          pluginName={plugin.dir}
          state={state}
          height={plugin.stageHeight ?? 440}
          label={plugin.id}
        >
          <Demo
            file={file}
            variant={variant}
            onLog={log}
            onState={(info) => setState(info)}
          />
        </Stage>

        <aside className="demo-side">
          <div className="demo-side-block">
            <div className="side-head">
              装配
              <b>{variant}</b>
            </div>
            {/* 这段代码是从真正装配过的插件对象反推的，不是另写的一份文案；
                只显示与默认档的差异，否则会把工厂合并进来的默认值全倒出来 */}
            <pre className="demo-asm">{assemblyCode(preview, defaultPreview)}</pre>
          </div>

          {plugin.note ? <p className="demo-note">⚠ {plugin.note}</p> : null}

          <EventLog lines={lines} />

          <div className="demo-side-block">
            <div className="side-head">
              参数（doc.json）
              <b>{plugin.doc.config?.length ?? 0}</b>
            </div>
            <ConfigTable config={plugin.doc.config} />
          </div>

          <div className="demo-side-block">
            <div className="side-head">
              自检
              <b>{audit ?? "未运行"}</b>
            </div>
            <div style={{ padding: 10, display: "flex", gap: 8, alignItems: "center" }}>
              <button type="button" className="btn btn-mini" onClick={runAudit}>
                量一次几何
              </button>
              <span className="muted" style={{ fontSize: 11 }}>
                与 audit-pages.mjs 同一套判据
              </span>
            </div>
          </div>
        </aside>
      </div>

      <div className="demo-code">
        <div className="demo-switch" role="tablist" aria-label="代码视图">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "example"}
            className={tab === "example" ? "is-active" : ""}
            onClick={() => setTab("example")}
          >
            官方用法
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "source"}
            className={tab === "source" ? "is-active" : ""}
            onClick={() => setTab("source")}
          >
            本页源码
          </button>
        </div>
        <CodeBlock
          key={tab}
          code={tab === "example" ? plugin.doc.example ?? "" : demo.source}
          title={tab === "example" ? `${plugin.dir}.usage.tsx` : demo.file}
          collapseAfter={tab === "example" ? 0 : 30}
          maxHeight={440}
        />
      </div>

      <p className="muted" style={{ marginTop: 14, fontSize: 12 }}>
        <Link to="/demos">← 全部逐项示例</Link>
        {"　"}｜{"　"}
        <Link to="/workshop">插件工坊</Link>
      </p>
    </section>
  );
};

/**
 * 路由层：`key` 让换页整体重挂。
 * 不这么做的话，从 /demos/pdf 切到 /demos/image 时日志会带着上一页的记录
 * （组件实例被 React 复用，state 不会自己清）。
 */
export const DemoDetailPage: React.FC = () => {
  const { id = "" } = useParams<{ id: string }>();
  const plugin = getPlugin(id);
  const demo = plugin ? findDemo(id) : undefined;

  if (!plugin || !demo) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">没有这个示例</h1>
          <p className="page-desc">
            <code>{id}</code> 不在示例目录里。<Link to="/demos">回到逐项示例</Link>
          </p>
        </div>
      </div>
    );
  }

  return <PluginPage key={id} id={id} />;
};
