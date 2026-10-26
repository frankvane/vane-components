/**
 * 插件工坊：勾选即装配
 *
 * 装配结果用 `useMemo` 按「勾选集合」缓存成组件类型 —— 每次渲染都调
 * withPlugins 会造出新组件类型，React 直接卸载重建，等于每勾一下就整块重挂载。
 */
import React, { useMemo, useState } from "react";
import { WaterfallCore, withPlugins } from "vane-waterfall";
import { makeCards, type SeedCard } from "../data/seed";
import { FeedCard } from "../components/FeedCard";
import { CodeBlock } from "../components/CodeBlock";
import {
  CONFLICTS,
  DEFAULT_ON,
  GROUP_LABEL,
  GROUP_ORDER,
  PLUGINS,
  type PluginInfo,
} from "../data/plugins";

const DATA = makeCards({ count: 24, seed: 3030, heightRange: [130, 240], commerce: true });

const byDir = new Map(PLUGINS.map((p) => [p.dir, p]));

function assemblyCode(selected: PluginInfo[]): string {
  if (selected.length === 0) {
    return `// 没有勾选任何插件 —— Core 只有「测量 + 布局 + 滚动」\nconst Waterfall = WaterfallCore;`;
  }
  const factories = selected.map((p) => p.factory).sort();
  const multi = factories.length > 3;
  const imports = multi
    ? `import {\n${factories.map((f) => `  ${f},`).join("\n")}\n} from "vane-waterfall/custom-plugins";`
    : `import { ${factories.join(", ")} } from "vane-waterfall/custom-plugins";`;

  return `import { WaterfallCore, withPlugins } from "vane-waterfall";
${imports}

// 执行顺序由插件自身 priority 决定，这里按名称排序只为读起来整齐
const Waterfall = withPlugins(WaterfallCore, [
${selected.map((p) => `  ${p.factory}(),  // priority ${p.priority}`).join("\n")}
]);

export function Feed({ items }) {
  return (
    <Waterfall
      items={items}
      containerStyle={{ height: 420 }}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <Card data={item} />}
    />
  );
}`;
}

export function PluginsPage() {
  const [on, setOn] = useState<Set<string>>(() => new Set(DEFAULT_ON));
  const [focus, setFocus] = useState<string>(DEFAULT_ON[0]);

  const selected = useMemo(() => PLUGINS.filter((p) => on.has(p.dir)), [on]);

  const conflicts = useMemo(
    () => CONFLICTS.filter((c) => on.has(c.a) && on.has(c.b)),
    [on]
  );

  // 勾选集合变化才重建组件类型；data 与 renderItem 用固定引用
  const key = selected.map((p) => p.dir).join("|");
  const Waterfall = useMemo(() => {
    const plugins = selected.map((p) => p.make());
    return withPlugins<SeedCard>(WaterfallCore, plugins);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

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
            {PLUGINS.length} 个插件按 5 组排列。勾选即装配 —— 左侧列表按「组 → priority 降序」排，
            同一个域内越靠上的越先执行。右侧预览是**真的**在跑这些插件，不是示意图。
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
                    <input
                      type="checkbox"
                      checked={on.has(p.dir)}
                      onChange={() => toggle(p.dir)}
                    />
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
          <div className="ws-stage plate">
            <div className="ws-stage-head">
              <span>
                已启用 <b>{selected.length}</b> 个
                {selected.length > 0 ? ` · ${selected.map((p) => p.dir.replace(/Plugin$/, "")).join(" / ")}` : "（裸 Core）"}
              </span>
              <span>{DATA.length} 项数据</span>
            </div>

            <div className="ws-scroll">
              <Waterfall
                items={DATA}
                containerStyle={{ height: 460 }}
                keyExtractor={(item) => item.id}
                renderItem={(item) => <FeedCard card={item} variant="product" />}
                pageSize={18}
              />
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
