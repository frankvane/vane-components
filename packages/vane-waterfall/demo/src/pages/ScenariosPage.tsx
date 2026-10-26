/**
 * 场景库
 *
 * 每个场景卡片左侧是**真实运行的组件**，右侧的「完整源码」用 `?raw` 读的是同一个文件，
 * 所以不存在「示例代码和实际效果不一致」这种漂移。
 *
 * 右上角的「体检」把 13 张卡一次性跑一遍几何断言（重叠 / 越界 / 总高不足），
 * 结果直接列在页面上 —— 几何问题只有真实布局引擎能发现，靠肉眼逐卡看会漏。
 */
import React, { useCallback, useMemo, useState } from "react";
import { GROUPS, SCENARIOS, USED_PLUGINS } from "../scenarios/catalog";
import { ScenarioCard } from "../components/ScenarioCard";
import { auditWaterfall, summarize, type AuditIssue } from "../lib/audit";

export function ScenariosPage() {
  const [group, setGroup] = useState<string>("全部");
  const [issues, setIssues] = useState<AuditIssue[] | null>(null);
  const [running, setRunning] = useState(false);

  const list = useMemo(
    () => (group === "全部" ? SCENARIOS : SCENARIOS.filter((s) => s.meta.group === group)),
    [group]
  );

  const tabs = ["全部", ...GROUPS];

  const runAudit = useCallback(() => {
    setRunning(true);
    // 等一轮布局 + 过渡走完再量，否则量到的是动画中间态
    window.setTimeout(() => {
      setIssues(auditWaterfall(document));
      setRunning(false);
    }, 420);
  }, []);

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">plates · 版式索引</p>
          <h2 className="page-title">场景示例</h2>
          <p className="page-sub">
            {SCENARIOS.length} 个真实版式，全部可交互（筛选、拖拽、跳转、无限加载都真的能用）。
            每张卡右边有「最小装配」和「完整源码」两份代码，都能直接复制。
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
              onClick={() => {
                setGroup(t);
                setIssues(null);
              }}
            >
              {t}
              <span className="n">{count}</span>
            </button>
          );
        })}
        <button type="button" className="scn-tab scn-tab-audit" onClick={runAudit} disabled={running}>
          {running ? "体检中…" : "体检全部"}
        </button>
      </div>

      {issues ? (
        <div className={`audit${issues.length ? " is-bad" : " is-ok"}`}>
          <div className="audit-head">
            <b>{summarize(issues, document.querySelectorAll(".scn-card").length)}</b>
            <button type="button" onClick={() => setIssues(null)}>
              关闭
            </button>
          </div>
          {issues.length ? (
            <ul>
              {issues.slice(0, 40).map((i, k) => (
                <li key={k}>
                  <code>{i.scenario}</code>
                  <span className="audit-kind">{i.kind}</span>
                  {i.detail}
                </li>
              ))}
            </ul>
          ) : (
            <p>
              所有卡片的项都落在容器内、互不重叠、滚动高度盖得住内容底边。
              断言口径见 <code>demo/src/lib/audit.ts</code>。
            </p>
          )}
        </div>
      ) : null}

      {list.length === 0 ? (
        <div className="scn-empty">这个分类下还没有场景</div>
      ) : (
        list.map((entry) => <ScenarioCard key={entry.meta.id} entry={entry} />)
      )}
    </div>
  );
}
