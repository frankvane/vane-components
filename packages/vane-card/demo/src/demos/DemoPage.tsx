/**
 * 示例页骨架
 *
 * 每页同一个结构，读第二页就形成肌肉记忆：
 *   刊头（序号 + 标题 + 元信息）
 *   → 参数控件（拖了就改行为，下面的代码同步变）
 *   → 舞台（真实运行的一张卡）+ 右栏（装了哪些插件 / 为什么 / 坑位 / 事件日志）
 *   → 通栏代码（最小装配 / 数据对象）
 *
 * 卡片是窄的（默认 360px），所以舞台是「居中摆在样板上」，而不是铺满 ——
 * 铺满会把卡片拉成商品列表卡，看不出商详卡的真实比例。
 */
import React, { useCallback, useMemo, useState } from "react";
import { CodeBlock } from "../components/CodeBlock";
import { buildDataCode, buildDemoCode } from "./codegen";
import { ControlBar, EventLog, type LogLine } from "./panels";
import { CfgGenProvider } from "./stage";
import {
  GROUP_META,
  initialCfg,
  type DemoCfg,
  type DemoEntry,
  type DemoLogKind,
} from "./types";

type CodeTab = "minimal" | "data";

/** 会自己占住头部媒体位的插件 —— 装了它们就不再画「空媒体位」 */
const MEDIA_PLUGIN = /^(createImagePlugin|createGalleryPlugin|createVideoPlugin)$/;

export function DemoPage({ entry, order }: { entry: DemoEntry; order: number }) {
  const { meta, Stage } = entry;
  const [cfg, setCfg] = useState<DemoCfg>(() => initialCfg(meta));
  const [lines, setLines] = useState<LogLine[]>([]);
  const [tab, setTab] = useState<CodeTab>("minimal");

  /**
   * 空媒体位只在「本该是完整卡、但本页只演示某几个插件」的页面上出现。
   * compound 例外：pc-price / pc-stock 这些页并排展示的是子组件，本来就不是
   * 一张完整卡，给它留媒体位反而像「卡缺了张图」。
   */
  const showMediaSeat = meta.group !== "compound" && !meta.plugs.some((p) => MEDIA_PLUGIN.test(p.fn));

  const log = useCallback((text: string, kind: DemoLogKind = "event") => {
    const at = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    setLines((prev) => [{ id: prev.length + 1, at, text, kind }, ...prev].slice(0, 60));
  }, []);

  const onChange = useCallback((key: string, value: number | boolean | string) => {
    setCfg((prev) => ({ ...prev, [key]: value }));
  }, []);

  const code = useMemo(() => buildDemoCode(meta, cfg), [meta, cfg]);
  const dataCode = useMemo(() => buildDataCode(meta), [meta]);

  return (
    <section className="demo" data-demo={meta.slug}>
      <header className="demo-head">
        <div className="demo-folio">
          <span className="demo-no">{String(order).padStart(2, "0")}</span>
          <em>plate</em>
        </div>

        <div>
          <div className="demo-title-row">
            <h2>{meta.title}</h2>
            <span className="demo-group">{GROUP_META[meta.group].label}</span>
            {meta.plugin ? <code className="demo-plugin">{meta.plugin}</code> : null}
          </div>
          <p className="demo-intro">{meta.intro}</p>
          <p className="demo-why">
            <b>什么时候用</b>
            {meta.why}
          </p>
        </div>

        <div className="demo-meta">
          <div className="demo-meta-row">
            <span>route</span>
            <b>#/demos/{meta.slug}</b>
          </div>
          <div className="demo-meta-row">
            <span>group</span>
            <b>{GROUP_META[meta.group].label}</b>
          </div>
          <div className="demo-meta-row">
            <span>plugs</span>
            <b>{meta.plugs.length ? `${meta.plugs.length} installed` : "core only"}</b>
          </div>
        </div>
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
        <figure className="plate">
          <figcaption className="plate-cap">
            <b>stage</b>
            <span>
              {meta.tone === "light" ? "light surface" : "live render"} · {meta.stageWidth ?? 360}px
            </span>
            <em>live</em>
          </figcaption>
          <div className="plate-ruler" aria-hidden />
          <div
            className={`plate-body demo-stage${meta.tone === "light" ? " tone-light" : ""}`}
            style={{ "--card-w": `${meta.stageWidth ?? 360}px` } as React.CSSProperties}
          >
            <div className={`demo-card${showMediaSeat ? " is-no-media" : ""}`} data-card-stage>
              {/* 控件世代号：Stage 内的 useCard 靠它判断「该重建组件类型了」。
                  不提供的话，插件配置改了但类型还是第一次那个，舞台不会跟着变。 */}
              <CfgGenProvider cfg={cfg}>
                <Stage cfg={cfg} log={log} setCfg={onChange} />
              </CfgGenProvider>
            </div>
          </div>
        </figure>

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
                ? "还没触发 —— 拖上面的控件，或悬停 / 点卡片 / 选规格"
                : "这一页没有事件类行为，日志留白"
            }
          />
        </aside>
      </div>

      <div className="demo-code">
        <div className="demo-switch" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "minimal"}
            className={tab === "minimal" ? "is-active" : ""}
            onClick={() => setTab("minimal")}
          >
            最小装配
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "data"}
            className={tab === "data" ? "is-active" : ""}
            onClick={() => setTab("data")}
          >
            数据对象
          </button>
        </div>
        <CodeBlock
          key={tab}
          code={tab === "minimal" ? code : dataCode}
          title={tab === "minimal" ? `${meta.slug}.minimal.tsx` : `${meta.slug}.data.ts`}
          collapseAfter={0}
          maxHeight={430}
        />
      </div>
    </section>
  );
}
