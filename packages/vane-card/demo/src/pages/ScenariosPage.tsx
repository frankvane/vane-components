/**
 * 场景库
 *
 * 每个场景卡片左侧是**真实运行的组件**，右侧「完整源码」用 `?raw` 读同一个文件，
 * 所以不存在「示例代码和实际效果不一致」这种漂移。
 *
 * 右上角的「体检」把 10 张卡一次性跑一遍几何断言（卡片存在 / 尺寸 / 越界 / 破图 / 内容），
 * 结果直接列在页面上 —— 几何问题只有真实布局引擎能发现，肉眼逐卡看会漏。
 */
import React, { useCallback, useMemo, useState } from "react";
import { GROUPS, INDUSTRIES, SCENARIOS, USED_PLUGINS } from "../scenarios/catalog";
import { ScenarioCard } from "../components/ScenarioCard";
import { auditCards, summarize, type AuditIssue } from "../lib/audit";

export function ScenariosPage() {
  const [group, setGroup] = useState<string>("全部");
  const [industry, setIndustry] = useState<string>("全部");
  const [issues, setIssues] = useState<AuditIssue[] | null>(null);
  const [running, setRunning] = useState(false);

  /** 两个维度叠加：形态（列表/商详/交易/内容）× 行业（生鲜/3C/美妆…） */
  const list = useMemo(
    () =>
      SCENARIOS.filter(
        (s) =>
          (group === "全部" || s.meta.group === group) &&
          (industry === "全部" || s.meta.industry === industry)
      ),
    [group, industry]
  );

  const tabs = ["全部", ...GROUPS];
  const industries = ["全部", ...INDUSTRIES];

  const runAudit = useCallback(() => {
    setRunning(true);
    // 等一轮布局（字体、图片解码、动画首帧）走完再量，否则量到的是中间态
    window.setTimeout(() => {
      setIssues(auditCards(document));
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
            {SCENARIOS.length} 个真实场景，覆盖 {INDUSTRIES.length} 类平台（通用电商 + 生鲜 / 3C / 美妆 /
            家居 / 票务 / 课程）。生鲜按重量卖、3C 版本组合要比价、票务按场次票档 ——
            换个行业，卡的形状就变了。全部可交互，每张右边有「最小装配」和「完整源码」。
          </p>
        </div>
        <div className="page-facts">
          <div>
            <b>{SCENARIOS.length}</b>
            <span>plates</span>
          </div>
          <div>
            <b>{INDUSTRIES.length}</b>
            <span>industries</span>
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

      {/* 行业是第二维：形态回答「链路哪一段」，行业回答「哪种平台」 */}
      <div className="scn-tabs scn-tabs--industry">
        <span className="scn-tabs-label">行业</span>
        {industries.map((ind) => {
          const count =
            ind === "全部"
              ? SCENARIOS.length
              : SCENARIOS.filter((s) => s.meta.industry === ind).length;
          return (
            <button
              key={ind}
              type="button"
              className={`scn-tab scn-tab-sm${industry === ind ? " is-active" : ""}`}
              onClick={() => {
                setIndustry(ind);
                setIssues(null);
              }}
            >
              {ind}
              <span className="n">{count}</span>
            </button>
          );
        })}
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
                  <code>{i.scope}</code>
                  <span className="audit-kind">{i.kind}</span>
                  {i.detail}
                </li>
              ))}
            </ul>
          ) : (
            <p>
              所有场景的卡片都在舞台内、尺寸非零、图能解码、价格区有高度。断言口径见{" "}
              <code>demo/src/lib/audit.ts</code>。
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
