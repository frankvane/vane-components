/**
 * 场景示例
 *
 * 每个场景卡左侧是**真实运行的组件**，右侧是装配清单与进度来由，下方是该场景文件的
 * 完整源码（`?raw` 原文，可复制）与插件的属性 / 事件 / 方法。顶部 tab 按分组过滤。
 */
import React, { useMemo, useState } from "react";
import { GROUPS, SCENARIOS, USED_PLUGINS } from "../scenarios/catalog";
import { ScenarioCard } from "../components/ScenarioCard";

export function ScenariosPage() {
  const [group, setGroup] = useState<string>("全部");

  const list = useMemo(
    () => (group === "全部" ? SCENARIOS : SCENARIOS.filter((s) => s.meta.group === group)),
    [group]
  );

  const tabs = ["全部", ...GROUPS];

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">plates · 版式索引</p>
          <h2 className="page-title">场景示例</h2>
          <p className="page-sub">
            {SCENARIOS.length} 个活动版式，全部可交互（点击「领取」真的会更新状态）。
            每张卡都带装配清单、进度是怎么算出来的、**该场景文件的完整源码**（可直接复制），
            以及用到插件的属性 / 事件 / 方法。
          </p>
        </div>
        <div className="page-facts">
          <div>
            <b>{SCENARIOS.length}</b>
            <span>plates</span>
          </div>
          <div>
            <b>{GROUPS.length}</b>
            <span>groups</span>
          </div>
          <div>
            <b>{USED_PLUGINS.length}</b>
            <span>plugins used</span>
          </div>
        </div>
      </header>

      <div className="scn-tabs">
        {tabs.map((t) => {
          const count =
            t === "全部" ? SCENARIOS.length : SCENARIOS.filter((s) => s.meta.group === t).length;
          return (
            <button
              key={t}
              type="button"
              className={`scn-tab${group === t ? " is-active" : ""}`}
              onClick={() => setGroup(t)}
            >
              {t}
              <span className="n">{count}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <div className="scn-empty">这个分类下还没有场景</div>
      ) : (
        list.map((entry) => <ScenarioCard key={entry.meta.id} entry={entry} />)
      )}
    </div>
  );
}
