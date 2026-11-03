/**
 * 插件能力三件表：属性 Props / 事件 Events / 方法 Methods
 *
 * 数据唯一来源是插件目录里的 `doc.json`（由 `data/plugins.ts` 的 glob 收集）。
 * 插件工坊与每个逐项示例页渲染的都是这一份 —— 演示站上看到的 API 表，与
 * `docs/components/vane-activity/plugins.md` 里那张自动生成的表同源，不会两处漂移。
 */
import React from "react";
import type { PluginDocShape, PluginInfo } from "../data/plugins";

/** 只渲染三件表 + 能做/适合/注意，不含标题栏，方便嵌到卡片或折叠块里 */
export function PluginDocBody({ doc }: { doc: PluginDocShape }) {
  const props = doc.props ?? [];
  const events = doc.events ?? [];
  const methods = doc.methods ?? [];

  return (
    <>
      <div className="doc-sec">
        <h5>属性 Props</h5>
        {props.length ? (
          <table className="doc-table">
            <thead>
              <tr>
                <th>属性</th>
                <th>类型</th>
                <th>默认</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              {props.map((p) => (
                <tr key={p.name}>
                  <td>
                    <code>{p.name}</code>
                  </td>
                  <td>
                    <code className="dim">{p.type}</code>
                  </td>
                  <td>
                    <code className="dim">{p.default ?? "-"}</code>
                  </td>
                  <td>{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="doc-note">无可配置属性，工厂零参调用即可。</p>
        )}
      </div>

      <div className="doc-sec">
        <h5>事件 Events</h5>
        {events.length ? (
          <table className="doc-table">
            <thead>
              <tr>
                <th>事件</th>
                <th>触发时机</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.name}>
                  <td>
                    <code>{e.name}</code>
                  </td>
                  <td>{e.when}</td>
                  <td>{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="doc-note">不参与任何事件。</p>
        )}
      </div>

      <div className="doc-sec">
        <h5>方法 Methods</h5>
        {methods.length ? (
          <table className="doc-table">
            <thead>
              <tr>
                <th>方法</th>
                <th>签名</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m.name}>
                  <td>
                    <code>{m.name}</code>
                  </td>
                  <td>
                    <code className="dim">{m.signature}</code>
                  </td>
                  <td>{m.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="doc-note">{doc.methodsNote ?? "不调用上下文方法。"}</p>
        )}
      </div>

      <div className="doc-cols">
        {doc.features?.length ? (
          <div>
            <h5>能做</h5>
            <ul>
              {doc.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {doc.useCases?.length ? (
          <div>
            <h5>适合</h5>
            <ul>
              {doc.useCases.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {doc.notes?.length ? (
          <div>
            <h5>注意</h5>
            <ul>
              {doc.notes.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </>
  );
}

/** 折叠卡：summary 一行说清「哪个工厂、priority、几项 API」，展开即三件表 */
export function PluginDocCard({
  plugin,
  defaultOpen = true,
}: {
  plugin: PluginInfo;
  defaultOpen?: boolean;
}) {
  const n = {
    props: plugin.doc.props?.length ?? 0,
    events: plugin.doc.events?.length ?? 0,
    methods: plugin.doc.methods?.length ?? 0,
  };

  return (
    <details className="api-plug" open={defaultOpen}>
      <summary>
        <code>{plugin.factory}</code>
        <span className="tag tag-accent">priority {plugin.priority}</span>
        <span className="api-plug-desc">{plugin.summary}</span>
        <span className="api-plug-n">
          {n.props} 属性 · {n.events} 事件 · {n.methods} 方法
        </span>
      </summary>
      <div className="api-plug-body">
        <PluginDocBody doc={plugin.doc} />
      </div>
    </details>
  );
}
