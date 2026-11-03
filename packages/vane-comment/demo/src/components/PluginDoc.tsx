/**
 * 插件能力三件表：属性 Props / 事件 Events / 方法 Methods（模板版，全包通用）
 *
 * 数据唯一来源是插件目录里的 `doc.json`（由各包 `data/plugins.ts` 的 glob 收集）。
 * 插件工坊与每个逐项示例页渲染的都是这一份 —— 演示站上看到的 API 表，与
 * `docs/components/<pkg>/plugins.md` 里那张自动生成的表同源，不会两处漂移。
 *
 * 自适应：老包 doc.json 只有 `config`（历史字段），新包统一用 `props`（与文档生成器
 * `generate-plugin-docs.mjs` 的 `propsOf(doc) = doc.props ?? doc.config` 完全一致的降级），
 * 所以同一份组件在「三件齐全」的包与「仅 config」的包都能编译、都能渲染出属性表。
 * `events` / `methods` 没有时渲染诚实空态，不假装有内容。
 */
import React from "react";

// ============ 本地结构类型（不依赖各包 data/plugins 的具名类型，保证跨包通用） ============

/** 属性（工厂配置项）：同时兼容 props（新）与 config（旧）两种字段形态 */
interface DocProp {
  name: string;
  type: string;
  default?: string;
  description?: string;
}
interface DocEvent {
  name: string;
  when: string;
  description: string;
}
interface DocMethod {
  name: string;
  signature: string;
  description: string;
}

/** 组件只依赖 doc 这个「文档」部分，不碰 args/make 等包私有装配字段 */
export interface PluginDocLike {
  description?: string;
  since?: string;
  /** 新字段：三件结构 */
  props?: DocProp[];
  events?: DocEvent[];
  methods?: DocMethod[];
  methodsNote?: string;
  /** 旧字段：历史名 config（降级源） */
  config?: DocProp[];
  features?: string[];
  useCases?: string[];
  notes?: string[];
}

/** 与文档生成器一致的降级：props 优先，历史 config 兜底 */
function propsOf(doc: PluginDocLike): DocProp[] {
  return doc.props ?? doc.config ?? [];
}

/** 只渲染三件表 + 能做/适合/注意，不含标题栏，方便嵌到卡片或折叠块里 */
export function PluginDocBody({ doc }: { doc: PluginDocLike }) {
  const props = propsOf(doc);
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
                  <td>{p.description ?? "—"}</td>
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

/**
 * 折叠卡：summary 一行说清「哪个工厂、priority、几项 API」，展开即三件表。
 * factory / priority / summary 由调用方从各自的 PluginInfo 取来，本组件不耦合其结构。
 */
export function PluginDocCard({
  factory,
  priority,
  summary,
  doc,
  defaultOpen = true,
}: {
  factory: string;
  priority: number;
  summary: string;
  doc: PluginDocLike;
  defaultOpen?: boolean;
}) {
  const n = {
    props: propsOf(doc).length,
    events: doc.events?.length ?? 0,
    methods: doc.methods?.length ?? 0,
  };

  return (
    <details className="api-plug" open={defaultOpen}>
      <summary>
        <code>{factory}</code>
        <span className="tag tag-accent">priority {priority}</span>
        <span className="api-plug-desc">{summary}</span>
        <span className="api-plug-n">
          {n.props} 属性 · {n.events} 事件 · {n.methods} 方法
        </span>
      </summary>
      <div className="api-plug-body">
        <PluginDocBody doc={doc} />
      </div>
    </details>
  );
}
