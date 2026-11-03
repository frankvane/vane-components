/**
 * 插件工坊：勾选即装配
 *
 * 装配结果用 `useMemo` 按「勾选集合」缓存成组件类型 —— 每次渲染都调
 * withPlugins 会造出新组件类型，React 直接卸载重建，等于每勾一下就整块重挂载。
 *
 * 源码：工坊的组合是运行时拼的，磁盘上没有对应文件可 `?raw`，所以由
 * `lib/gen-source.ts` 从**同一份 registry**（工厂名 / 参数 / priority / 数据）推导出
 * 一份完整可运行的单文件源码。看到的 import、参数、顺序与下面正在跑的组件严格一致，
 * 复制走 `npm install vane-activity` 即可复现。
 */
import React, { useMemo, useState } from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityPlugin } from "vane-activity";
import {
  DEFAULT_ON,
  GROUP_LABEL,
  GROUP_ORDER,
  PLUGINS,
} from "../data/plugins";
import { sampleActivity } from "../data/activity";
import { PluginDocBody } from "../components/PluginDoc";
import { CodeBlock } from "../components/CodeBlock";
import { genWorkshopSource } from "../lib/gen-source";

const byDir = new Map(PLUGINS.map((p) => [p.dir, p]));

export function PluginsPage() {
  const [on, setOn] = useState<Set<string>>(() => new Set(DEFAULT_ON));
  const [focus, setFocus] = useState<string>(PLUGINS[0].dir);

  const selected = useMemo(() => PLUGINS.filter((p) => on.has(p.dir)), [on]);

  // 勾选集合变化才重建组件类型；数据用固定引用
  const key = selected.map((p) => p.dir).join("|");
  const Activity = useMemo(() => {
    const plugins = selected.map((p) => p.make()) as ActivityPlugin[];
    return withPlugins(ActivityCore, plugins);
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
  const doc = focusPlugin?.doc;

  // 源码跟着勾选走：同一份数据 + 同一批插件，复制即可运行
  const source = useMemo(
    () => genWorkshopSource({ plugins: selected, data: sampleActivity }),
    // selected 由 key 唯一决定
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">workshop · 装配台</p>
          <h2 className="page-title">插件工坊</h2>
          <p className="page-sub">
            {PLUGINS.length} 个插件按 {GROUP_ORDER.length} 组排列，勾选即装配 ——
            右侧预览是**真的**在跑这些插件，不是示意图。舞台下方给出当前组合的
            **完整源码**（复制即可运行），再往下是选中插件的属性 / 事件 / 方法。
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
                        {p.dir}
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
                  ? ` · ${selected.map((p) => p.dir).join(" / ")}`
                  : "（裸内核）"}
              </span>
              <span>live</span>
            </div>

            <div className="ws-scroll">
              <Activity
                data={sampleActivity}
                onTaskAction={(id) => console.log("task action", id)}
                onClaim={(id) => console.log("claim", id)}
              />
            </div>
          </div>

          {/* 生成源码：import / 工厂参数 / 装配顺序 / 数据全部来自正在跑的这一份 */}
          <div className="ws-source">
            <CodeBlock
              code={source}
              title={`源码 · ${selected.length} 个插件 · 复制即可运行`}
              collapseAfter={26}
            />
          </div>

          {focusPlugin && doc ? (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="doc-head">
                <code>{focusPlugin.factory}</code>
                <span className="tag tag-accent">priority {focusPlugin.priority}</span>
                <span className="tag">{GROUP_LABEL[focusPlugin.group]}</span>
                {doc.since ? <span className="tag">since {doc.since}</span> : null}
              </div>
              <p className="doc-desc">{doc.description}</p>

              <PluginDocBody doc={doc} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
