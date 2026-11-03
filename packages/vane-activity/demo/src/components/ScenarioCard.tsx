/**
 * 场景卡：左侧是**真实运行**的组件，右侧是这份装配的清单与进度来由，
 * 下方是该场景文件的**完整源码**（`?raw` 原文，可一键复制），
 * 再下面是这些插件的属性 / 事件 / 方法（来自各插件 doc.json）。
 *
 * 一份代码只在一个地方出现：源码就是 `scenarios/NN-*.tsx` 本身，
 * 展示与复制都走同一个字符串，杜绝「示例代码和实际效果不一致」。
 */
import React from "react";
import type { ScenarioEntry } from "../scenarios/catalog";
import { PLUGIN_BY_DIR, type PluginInfo } from "../data/plugins";
import { PluginDocCard } from "./PluginDoc";
import { CodeBlock } from "./CodeBlock";

export function ScenarioCard({ entry }: { entry: ScenarioEntry }) {
  const { meta, Stage, plugs, source, file } = entry;

  const plugins = plugs
    .map((dir) => PLUGIN_BY_DIR.get(dir))
    .filter((p): p is PluginInfo => Boolean(p));

  return (
    <section className="scn-card" id={`scn-${meta.id}`}>
      <div className="scn-head">
        <p className="eyebrow">{meta.group}</p>
        <h3 className="scn-title">{meta.title}</h3>
        <span className="tag">{meta.group}</span>
      </div>

      <p className="scn-pain">{meta.blurb}</p>

      <div className="scn-body">
        <div className="scn-stage">
          <Stage />
        </div>
        <div className="scn-side">
          <div className="scn-side-head">装配清单 · {plugs.length} 个插件</div>
          <div className="scn-plugs">
            {plugs.map((p) => (
              <span className="scn-plug" key={p}>
                {p}
              </span>
            ))}
          </div>
          <dl className="scn-meta">
            <div>
              <dt>数据</dt>
              <dd>{meta.dataNote}</dd>
            </div>
            <div>
              <dt>回调</dt>
              <dd>
                <code>onTaskAction</code> / <code>onClaim</code>
              </dd>
            </div>
            <div>
              <dt>源码</dt>
              <dd>
                <code>scenarios/{file}</code>
              </dd>
            </div>
          </dl>
          <p className="scn-tip">
            下面就是这份文件的原文，复制到项目里 <code>npm install vane-activity</code> 即可复现。
          </p>
        </div>
      </div>

      <div className="scn-source">
        <CodeBlock code={source} title={`源码 · scenarios/${file}`} collapseAfter={24} />
      </div>

      {plugins.length > 0 ? (
        <div className="scn-api">
          <h4 className="scn-api-title">上面这几个插件的属性 / 事件 / 方法</h4>
          {plugins.map((p) => (
            <PluginDocCard key={p.dir} plugin={p} defaultOpen={false} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
