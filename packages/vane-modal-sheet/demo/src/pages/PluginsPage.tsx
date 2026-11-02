/**
 * 插件工坊：勾选即装配的真跑工坊。
 *
 * 四段式：
 *  1. 左栏按组（视觉 / 行为 / 反馈）列全部插件，checkbox 勾选；
 *  2. 勾选集合经 useMemo 缓存成组件类型（key = 插件名集合），
 *     每次渲染都调 HOC 会造出新类型，React 会整块卸载重建；
 *  3. 右栏是**真的**在跑的 ModalSheet —— 不是示意图；
 *  4. 焦点插件的 doc（config 表 / 特性 / 示例）+ 随勾选实时生成的装配代码。
 */
import React, { useMemo, useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createFooterPlugin } from "vane-modal-sheet/custom-plugins/FooterPlugin";
import { CodeBlock } from "../components/CodeBlock";
import {
  DEFAULT_SELECTED,
  GROUP_LABEL,
  GROUP_ORDER,
  PLUGINS,
  type PluginCard,
} from "../data/plugins";

const byName = new Map(PLUGINS.map((p) => [p.name, p]));

function assemblyCode(selected: PluginCard[]): string {
  if (selected.length === 0) {
    return `import React from "react";
import { ModalSheetCore } from "vane-modal-sheet";

// 没有勾选任何插件 —— 裸 Core：只有几何状态机 + 生命周期转发
// 没有遮罩 / 把手 / 标题 / 吸底操作区
const Sheet = ModalSheetCore;`;
  }

  const imports = selected
    .map((p) => {
      const creator = p.factory.slice(0, p.factory.indexOf("("));
      return `import { ${creator} } from "vane-modal-sheet/custom-plugins/${p.name}";`;
    })
    .join("\n");

  return `import React from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
${imports}

// 执行顺序由插件自身 priority 决定（升序）；数组顺序只为读起来整齐
const Sheet = withModalSheetPlugins(ModalSheetCore, [
${selected.map((p) => `  ${p.factory},  // priority ${p.priority}`).join("\n")}
]);

export function Demo() {
  const [open, setOpen] = React.useState(true);
  return (
    <Sheet
      isOpen={open}
      onClose={() => setOpen(false)}
      snapPoints={[0.6]}
      width={520}
      horizontalAlign="center"
    >
      <p style={{ padding: 24 }}>当前启用了 ${selected.length} 个插件。</p>
    </Sheet>
  );
}`;
}

export function PluginsPage() {
  const [on, setOn] = useState<Set<string>>(() => new Set(DEFAULT_SELECTED));
  const [focus, setFocus] = useState<string>(PLUGINS[0].name);
  const [previewOpen, setPreviewOpen] = useState(true);

  const selected = useMemo(() => PLUGINS.filter((p) => on.has(p.name)), [on]);

  // 勾选集合变化才重建组件类型；插件实例在 memo 里创建一次，别每次渲染新建
  const key = selected.map((p) => p.name).join("|");
  const Sheet = useMemo(() => {
    // Footer 的“完成/取消”是真实动作：点任意一个都关掉预览，
    // 不然工坊里会摆着一对点不动的按钮
    const plugins = selected.map((p) =>
      p.name === "FooterPlugin"
        ? createFooterPlugin({
            primaryText: "完成",
            secondaryText: "取消",
            onPrimary: () => setPreviewOpen(false),
            onSecondary: () => setPreviewOpen(false),
          })
        : p.make(),
    );
    return withModalSheetPlugins(ModalSheetCore, plugins);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const toggle = (name: string) => {
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setFocus(name);
  };

  const focusPlugin = byName.get(focus);

  return (
    <article>
      <header className="page-head">
        <div>
          <p className="eyebrow">workshop · 装配台</p>
          <h1 className="page-title">插件工坊</h1>
          <p className="page-sub">
            {PLUGINS.length} 个内置插件按 {GROUP_ORDER.length} 组排列。勾选即装配 ——
            右侧预览是真的在跑这些插件，同一个组内 priority 越小越先执行。
            默认不勾 Backdrop，避免遮罩挡住整页；想体验遮罩就手动勾上。
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
                    key={p.name}
                    className={`ws-check${focus === p.name ? " is-focus" : ""}`}
                    title={p.summary}
                  >
                    <input
                      type="checkbox"
                      checked={on.has(p.name)}
                      onChange={() => toggle(p.name)}
                    />
                    <span>
                      <span className="name">
                        {p.name}
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
          <div className="ws-stage">
            <div className="ws-stage-head">
              <span>
                已启用 <b>{selected.length}</b> 个
                {selected.length > 0
                  ? ` · ${selected.map((p) => p.name).join(" / ")}`
                  : "（裸 Core）"}
              </span>
              <span className="ws-stage-btns">
                <button
                  type="button"
                  className="ws-btn"
                  onClick={() => setPreviewOpen(true)}
                >
                  打开预览
                </button>
                <button
                  type="button"
                  className="ws-btn ws-btn--ghost"
                  onClick={() => setPreviewOpen(false)}
                >
                  关闭预览
                </button>
              </span>
            </div>

            <div className="ws-scroll">
              <p className="ws-hint">
                预览是真实弹层：{previewOpen ? "已在视口底部打开" : "已关闭"}。
                拖拽面板试试把手，按 Esc 试试 EscClose，勾上 Backdrop 再点遮罩试试关闭链路。
              </p>

              <Sheet
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                snapPoints={[0.6]}
                width={520}
                horizontalAlign="center"
              >
                <div className="ws-preview-body">
                  <p className="ws-preview-title">真跑预览</p>
                  <p>
                    这一屏由当前勾选的 <b>{selected.length}</b> 个插件装配而成。
                    插件槽位负责遮罩、把手、标题栏、吸底操作区；行为插件负责键盘避让、
                    滚动锁、焦点圈定、返回关闭等；反馈插件负责动效、振动与读屏播报。
                  </p>
                  <p>
                    勾选变化会重建组件类型并即时生效；取消全部勾选后就是没有遮罩、
                    没有把手、没有头尾的裸 Core。
                  </p>
                </div>
              </Sheet>
            </div>
          </div>

          {focusPlugin ? (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="doc-head">
                <code>{focusPlugin.factory}</code>
                <span className="tag tag-accent">
                  priority {focusPlugin.priority}
                </span>
                <span className="tag">{GROUP_LABEL[focusPlugin.group]}</span>
                {focusPlugin.doc.since ? (
                  <span className="tag">since {focusPlugin.doc.since}</span>
                ) : null}
              </div>
              <p className="doc-desc">{focusPlugin.doc.description}</p>

              {focusPlugin.doc.config?.length ? (
                <div className="doc-table-wrap">
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
                            <code className="dim">{c.default ?? "-"}</code>
                          </td>
                          <td>{c.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

              {focusPlugin.doc.example ? (
                <div style={{ marginTop: 14 }}>
                  <CodeBlock
                    code={focusPlugin.doc.example}
                    title="example.tsx"
                    collapseAfter={0}
                    maxHeight={220}
                  />
                </div>
              ) : null}
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
    </article>
  );
}
