/**
 * 插件工坊：勾选即装配
 *
 * 装配结果用 `useMemo` 按「勾选集合」缓存成组件类型 —— 每次渲染都调 withPlugins
 * 会造出新组件类型，React 直接卸载重建，等于每勾一下就整块重挂载。
 *
 * 这里刻意允许勾出「互相打架」的组合（并在上方给出冲突提示）：
 * 光看文档不知道冲突是什么样，勾一次就懂了。
 */
import React, { useMemo, useState } from "react";
import { CardCore, withPlugins } from "vane-card";
import { CodeBlock } from "../components/CodeBlock";
import { TEE } from "../data/seed";
import {
  CONFLICTS,
  DEFAULT_ON,
  GROUP_LABEL,
  GROUP_ORDER,
  PLUGINS,
  byDir,
} from "../data/plugins";

function assemblyCode(selected: typeof PLUGINS): string {
  if (selected.length === 0) {
    return `// 没有勾选任何插件 —— Core 只有容器 / padding / ref / 四个回调
const Card = CardCore;`;
  }
  const factories = selected.map((p) => p.factory).sort();
  const multi = factories.length > 3;
  const imports = multi
    ? `import {\n${factories.map((f) => `  ${f},`).join("\n")}\n} from "vane-card/custom-plugins";`
    : `import { ${factories.join(", ")} } from "vane-card/custom-plugins";`;

  return `import { CardCore, withPlugins } from "vane-card";
${imports}

// 执行顺序由插件自身 priority 决定，这里按名称排序只为读起来整齐
const Card = withPlugins(CardCore, {
  plugins: [
${selected.map((p) => `    ${p.factory}(),  // priority ${p.priority}`).join("\n")}
  ],
});

export function ProductCard({ product }) {
  return (
    <Card cardId={product.id} data={product} padding={0}>
      <h3>{product.title}</h3>
    </Card>
  );
}`;
}

export function PluginsPage() {
  const [on, setOn] = useState<Set<string>>(() => new Set(DEFAULT_ON));
  const [focus, setFocus] = useState<string>(DEFAULT_ON[0]);

  const selected = useMemo(() => PLUGINS.filter((p) => on.has(p.dir)), [on]);
  const conflicts = useMemo(() => CONFLICTS.filter((c) => on.has(c.a) && on.has(c.b)), [on]);

  // 勾选集合变化才重建组件类型
  const key = selected.map((p) => p.dir).join("|");
  const Card = useMemo(
    () => withPlugins(CardCore, { plugins: selected.map((p) => p.make()) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key 就是「勾选集合」的语义
    [key]
  );

  const toggle = (dir: string) => {
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(dir)) next.delete(dir);
      else next.add(dir);
      return next;
    });
    setFocus(dir);
  };

  const focusPlugin = byDir.get(focus);

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">workshop · 装配台</p>
          <h2 className="page-title">插件工坊</h2>
          <p className="page-sub">
            {PLUGINS.length} 个插件按 5 组排列。勾选即装配 —— 左侧按「组 → priority 降序」排，
            同一域内越靠上越先执行。右侧预览是<b>真的</b>在跑这些插件，不是示意图。
          </p>
        </div>
        <div className="page-facts">
          <div>
            <b>{PLUGINS.length}</b>
            <span>plugins</span>
          </div>
          <div>
            <b>{GROUP_ORDER.length}</b>
            <span>groups</span>
          </div>
          <div>
            <b>{on.size}</b>
            <span>enabled</span>
          </div>
        </div>
      </header>

      <div className="ws">
        <aside className="ws-panel">
          <div className="ws-panel-head">
            <span>插件目录</span>
            <code>
              {on.size}/{PLUGINS.length}
            </code>
          </div>

          {conflicts.length > 0 ? (
            <div className="ws-conflict">
              {conflicts.map((c) => (
                <div key={`${c.a}-${c.b}`}>
                  ⚠ {c.a.replace("Plugin", "")} ↔ {c.b.replace("Plugin", "")}：{c.why}
                </div>
              ))}
            </div>
          ) : null}

          {GROUP_ORDER.map((group) => {
            const list = PLUGINS.filter((p) => p.group === group);
            return (
              <div className="ws-group" key={group}>
                <h4>
                  {GROUP_LABEL[group]} · {list.length}
                </h4>
                {list.map((p) => (
                  <label
                    key={p.dir}
                    className={`ws-check${focus === p.dir ? " is-focus" : ""}`}
                    title={p.summary}
                  >
                    <input type="checkbox" checked={on.has(p.dir)} onChange={() => toggle(p.dir)} />
                    <span>
                      <span className="name">
                        {p.dir.replace(/Plugin$/, "")}
                        <em className="prio">{p.priority}</em>
                      </span>
                      <span className="desc">{p.summary}</span>
                    </span>
                  </label>
                ))}
              </div>
            );
          })}
        </aside>

        <div>
          <div className="ws-stage plate" data-demo="workshop">
            <div className="ws-stage-head">
              <span>
                已启用 <b>{selected.length}</b> 个
                {selected.length > 0
                  ? ` · ${selected.map((p) => p.dir.replace(/Plugin$/, "")).join(" / ")}`
                  : "（裸 Core）"}
              </span>
              <span>1 张卡</span>
            </div>

            <div className="ws-canvas">
              <div className="ws-card" data-card-stage>
                <Card cardId="workshop" data={TEE} padding={0}>
                  <div className="stage-content">
                    <div className="stage-title">{TEE.title}</div>
                    <div className="stage-sub">{TEE.subtitle}</div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {focusPlugin ? (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="doc-head">
                <code>{focusPlugin.factory}</code>
                <span className="tag tag-accent">priority {focusPlugin.priority}</span>
                <span className="tag">{GROUP_LABEL[focusPlugin.group]}</span>
                {focusPlugin.doc.since ? <span className="tag">since {focusPlugin.doc.since}</span> : null}
              </div>
              <p className="doc-desc">{focusPlugin.doc.description}</p>

              {focusPlugin.doc.config?.length ? (
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>配置</th>
                      <th>类型</th>
                      <th>默认</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {focusPlugin.doc.config.map((c) => (
                      <tr key={c.name}>
                        <td>
                          <code>{c.name}</code>
                        </td>
                        <td>
                          <code className="dim">{c.type}</code>
                        </td>
                        <td>
                          <code className="dim">{c.default}</code>
                        </td>
                        <td>{c.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}

              <div className="doc-cols">
                {focusPlugin.doc.features?.length ? (
                  <div>
                    <h5>能做</h5>
                    <ul>
                      {focusPlugin.doc.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {focusPlugin.doc.useCases?.length ? (
                  <div>
                    <h5>适合</h5>
                    <ul>
                      {focusPlugin.doc.useCases.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {focusPlugin.doc.notes?.length ? (
                  <div>
                    <h5>注意</h5>
                    <ul>
                      {focusPlugin.doc.notes.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: 14 }}>
            <CodeBlock code={assemblyCode(selected)} title="workshop.tsx" collapseAfter={0} maxHeight={420} />
          </div>
        </div>
      </div>
    </div>
  );
}
