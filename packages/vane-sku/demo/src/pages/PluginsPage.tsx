import React from "react";
import { PLUGIN_GROUPS, PLUGIN_COUNT } from "../data/plugin-catalog";

/**
 * 插件清单：数据全部来自各插件 doc.json 的 meta（见 data/plugin-catalog），
 * 不手写第二份，改描述时这里自动跟着变。
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
        </p>
      </div>

      {PLUGIN_GROUPS.map((g, gi) => (
        <React.Fragment key={g.group}>
          <h2 className="section-title">
            {String(gi + 1).padStart(2, "0")} · {g.group}
          </h2>
          <div className="group-grid">
            {g.items.map((p) => (
              <article className="group-card" key={p.id} id={p.id}>
                <h3>
                  <span className="idx">{p.renders ? "UI" : "EV"}</span>
                  <span>{p.name}</span>
                  <span className="count">{p.renders ? "渲染型" : "事件型"}</span>
                </h3>
                <p style={{ margin: "0 0 10px", fontSize: 13.5, lineHeight: 1.65, color: "var(--text-3)" }}>
                  {p.description}
                </p>
                <div className="group-card-items">
                  <code
                    className="chip"
                    style={{ fontFamily: "var(--ff-mono)", fontSize: 11.5 }}
                  >
                    vane-sku/custom-plugins/{p.id}
                  </code>
                </div>
                {p.tags?.length ? (
                  <div className="tag-row">
                    {p.tags.map((t) => (
                      <span className="tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
