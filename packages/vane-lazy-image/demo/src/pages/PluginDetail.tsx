import React from "react";
import { useParams, Link } from "react-router-dom";
import { getPluginById } from "../data/plugin-catalog";
import { PluginPreview } from "../components/PluginPreview";
import { ExampleCard } from "../components/ExampleCard";
import { CodeBlock } from "../components/CodeBlock";

export const PluginDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const meta = id ? getPluginById(id) : undefined;

  if (!meta) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">未找到插件</h1>
          <p className="page-desc">
            插件 <code>{id}</code> 不存在。<Link to="/">返回首页</Link>
          </p>
        </div>
      </div>
    );
  }

  const usageCode = meta.example
    ? `import { LazyLoadImageCore, withPlugins, ${meta.factoryName} } from "vane-lazy-image";\n\n${meta.example}`
    : `import { LazyLoadImageCore, withPlugins, ${meta.factoryName} } from "vane-lazy-image";\n\nconst LazyImage = withPlugins(LazyLoadImageCore, [${meta.factoryName}()]);`;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{meta.title}</h1>
        <p className="page-desc">{meta.description}</p>
        <div className="tag-row">
          {meta.tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-left">
          <PluginPreview pluginId={meta.id} />
        </div>
        <div className="detail-right">
          <h4 className="block-title">配置项（doc.json）</h4>
          {meta.config.length ? (
            <table className="config-table">
              <thead>
                <tr>
                  <th>参数</th>
                  <th>类型</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {meta.config.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <code>{c.name}</code>
                    </td>
                    <td>
                      <code className="type-cell">{c.type}</code>
                    </td>
                    <td>{c.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">该插件无可配置参数。</p>
          )}

          <h4 className="block-title">用法示例</h4>
          <CodeBlock code={usageCode} />
        </div>
      </div>

      {meta.examples.length > 0 && (
        <section className="examples-section">
          <h3 className="section-title">场景示例</h3>
          <div className="examples-grid">
            {meta.examples.map((ex, i) => (
              <ExampleCard
                key={i}
                pluginId={meta.id}
                factoryName={meta.factoryName}
                example={ex}
              />
            ))}
          </div>
        </section>
      )}

      {(meta.features.length > 0 || meta.useCases.length > 0) && (
        <section className="lists-section">
          {meta.features.length > 0 && (
            <div className="list-block">
              <h3 className="section-title">功能特性</h3>
              <ul className="feature-list">
                {meta.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {meta.useCases.length > 0 && (
            <div className="list-block">
              <h3 className="section-title">使用场景</h3>
              <ul className="usecase-list">
                {meta.useCases.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {meta.notes.length > 0 && (
        <section className="notes-section">
          {meta.notes.map((n, i) => (
            <div className="note-box" key={i}>
              {n}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
