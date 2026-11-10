/**
 * 插件工坊：勾选即装配
 *
 * 装配结果用 `useMemo` 按「勾选集合」缓存成组件类型 —— 每次渲染都调
 * withAssetLibraryPlugins 会造出新组件类型，React 直接卸载重建，等于每勾一下就整墙重挂载。
 */
import React, { useMemo, useState } from "react";
import { AssetLibraryCore, withAssetLibraryPlugins } from "vane-asset-library";
import { CodeBlock } from "../components/CodeBlock";
import { GROUP_LABEL, GROUP_ORDER, PLUGINS, STAGE_PROPS, type PluginInfo } from "../data/plugins";
import { SAMPLE_ASSETS, SAMPLE_FOLDERS } from "../data/samples";

const byDir = new Map(PLUGINS.map((p) => [p.dir, p]));

const dirOf = (factory: string) =>
  `${factory.replace(/^create/, "").replace(/Plugin$/, "")}Plugin`;

function assemblyCode(selected: PluginInfo[]): string {
  if (selected.length === 0) {
    return `// 没有勾选任何插件 —— Core 只渲染受控数据
const Library = AssetLibraryCore;`;
  }
  const factories = selected.map((p) => p.factory).sort();
  const imports = factories
    .map((f) => `import { ${f} } from "vane-asset-library/custom-plugins/${dirOf(f)}";`)
    .join("\n");

  return `import { AssetLibraryCore, withAssetLibraryPlugins } from "vane-asset-library";
import type { AssetItem } from "vane-asset-library";
${imports}

// 同槽内的顺序由插件自身 priority 决定，这里按分组排列只为读起来整齐
const Library = withAssetLibraryPlugins(AssetLibraryCore, [
${selected.map((p) => `  ${p.factory}(),  // priority ${p.priority}`).join("\n")}
]);

export default function Page({ items }: { items: AssetItem[] }) {
  return <Library items={items} pageSize={8} multiple />;
}`;
}

export function PluginsPage() {
  const [on, setOn] = useState<Set<string>>(() => new Set(PLUGINS.map((p) => p.dir)));
  const [focus, setFocus] = useState<string>(PLUGINS[0].dir);

  const selected = useMemo(() => PLUGINS.filter((p) => on.has(p.dir)), [on]);

  // 勾选集合变化才重建组件类型；items 用固定引用
  const key = selected.map((p) => p.dir).join("|");
  const Library = useMemo(() => {
    const plugins = selected.map((p) => p.make());
    return withAssetLibraryPlugins(AssetLibraryCore, plugins);
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
            {PLUGINS.length} 个插件按 {GROUP_ORDER.length} 组排列。勾选即装配 —— 左侧列表按
            「组 → priority 升序」排，同一个槽位里越靠前的越先渲染。右侧预览是**真的**在跑这些插件，
            不是示意图。
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
                {selected.length > 0
                  ? ` · ${selected.map((p) => p.dir.replace(/Plugin$/, "")).join(" / ")}`
                  : "（裸 Core）"}
              </span>
              <span>live</span>
            </div>

            <div className="ws-scroll">
              <Library
                {...STAGE_PROPS}
                items={SAMPLE_ASSETS}
                folders={SAMPLE_FOLDERS}
                columnWidth={140}
              />
            </div>
          </div>

          {focusPlugin ? (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="doc-head">
                <code>{focusPlugin.factory}</code>
                <span className="tag tag-accent">priority {focusPlugin.priority}</span>
                <span className="tag">{GROUP_LABEL[focusPlugin.group]}</span>
                {focusPlugin.doc.since ? (
                  <span className="tag">since {focusPlugin.doc.since}</span>
                ) : null}
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
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: 14 }}>
            <CodeBlock
              code={assemblyCode(selected)}
              title="workshop.tsx"
              collapseAfter={0}
              maxHeight={420}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
