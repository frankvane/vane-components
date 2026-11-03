/**
 * 总览页
 *
 * 四段结构：hero（标识 / 眉标 / 标题 / 导语 / 行动点 / 统计条）
 *   → feature-grid（能力卡片）
 *   → group-grid（按分组浏览，chip 直达逐项示例）
 *   → demos-index（插件清单，idx-card 直达）。
 *
 * 所有数字从注册表实时算，不手抄；分类取自 DEMOS.meta.group / data/plugins。
 */
import React from "react";
import { Link } from "react-router-dom";
import { DEMOS } from "../demos/registry";
import { GROUP_META, type DemoGroup } from "../demos/types";
import { PLUGINS, GROUP_ORDER } from "../data/plugins";
import { SCENARIOS } from "../scenarios/catalog";

const FEATURES = [
  {
    k: "01",
    t: "看板内核",
    d: "CandidateCore 接收 Candidate[] 与 StageConfig[]，渲染六阶段看板骨架；插件只通过槽位影响它，核心永远不知道插件的存在。",
  },
  {
    k: "02",
    t: "插件即能力",
    d: `${PLUGINS.length} 个插件覆盖徽章、动作、工具栏、管道四类，priority 决定执行顺序，transformData 管道保证筛选/排序/脱敏正确组合。`,
  },
  {
    k: "03",
    t: "数据有回路",
    d: "插件经 ctx.updateCandidate / ctx.moveCandidate 改数据，装配层自动落内部态、追加 history 并回调 onDataChange 给宿主持久化。",
  },
  {
    k: "04",
    t: "源码同源",
    d: "示例页与场景卡右侧的代码都是用 ?raw 读的真实文件，不存在「文档写了没实现」的漂移。",
  },
];

const GROUP_KEYS = Object.keys(GROUP_META) as DemoGroup[];

export function HomePage() {
  const pluginCount = PLUGINS.length;
  const demoCount = DEMOS.length;
  const groupCount = GROUP_ORDER.length;
  const scenarioCount = SCENARIOS.length;

  return (
    <div className="home">
      <section className="hp-hero">
        <span className="hp-hero-mark" aria-hidden="true">
          C
        </span>
        <div>
          <span className="hp-hero-eyebrow">
            <i aria-hidden="true" />
            plugin index · 候选人流水线
          </span>
          <h1 className="hp-hero-title">
            <span className="line">招聘漏斗即看板，</span>
            <span className="line">
              插件即<em>能力</em>。
            </span>
          </h1>
          <p className="hp-hero-lede">
            插件式 React 候选人流水线（ATS）演示台：<b>{pluginCount} 个插件</b>覆盖徽章、动作、工具栏与数据管道。
            每个插件都能在这里<b>切装配、拖参数、开浮层、读可复制的完整源码</b>。
          </p>
          <div className="hp-hero-actions">
            <Link className="btn btn-primary" to="/plugins">
              打开插件工坊
            </Link>
            <Link className="btn btn-ghost" to="/scenarios">
              浏览场景示例
            </Link>
            <Link className="btn btn-ghost" to={`/demo/${DEMOS[0]?.meta.slug ?? ""}`}>
              逐项示例 →
            </Link>
          </div>
        </div>

        <div className="hp-hero-stats" role="list" aria-label="内容规模统计">
          <div className="hp-stat" role="listitem">
            <span className="hp-stat-value">{pluginCount}</span>
            <span className="hp-stat-label">插件模块</span>
          </div>
          <div className="hp-stat" role="listitem">
            <span className="hp-stat-value">{groupCount}</span>
            <span className="hp-stat-label">功能分组</span>
          </div>
          <div className="hp-stat" role="listitem">
            <span className="hp-stat-value">{demoCount}</span>
            <span className="hp-stat-label">逐项示例</span>
          </div>
          <div className="hp-stat" role="listitem">
            <span className="hp-stat-value">{scenarioCount}</span>
            <span className="hp-stat-label">业务场景</span>
          </div>
        </div>
      </section>

      <div className="hp-feature-grid">
        {FEATURES.map((f) => (
          <div className="hp-feature-card" key={f.k}>
            <div className="hp-feature-icon" aria-hidden="true">
              {f.k}
            </div>
            <h3>{f.t}</h3>
            <p>{f.d}</p>
          </div>
        ))}
      </div>

      <h2 className="hp-section-title">按分组浏览 · {demoCount}</h2>
      <div className="hp-group-grid">
        {GROUP_KEYS.map((group, gi) => {
          const list = DEMOS.filter((d) => d.meta.group === group);
          if (!list.length) return null;
          return (
            <div className="hp-group-card" key={group}>
              <h3>
                <span className="hp-idx">{String(gi + 1).padStart(2, "0")}</span>
                {GROUP_META[group].label}
                <span className="hp-count">{list.length}</span>
              </h3>
              <div className="hp-group-items">
                {list.map((d) => (
                  <Link
                    key={d.meta.slug}
                    to={`/demo/${d.meta.slug}`}
                    className="hp-chip"
                    title={GROUP_META[group].hint}
                  >
                    {d.meta.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        <div className="hp-group-card">
          <h3>
            三个视角
            <span className="hp-count">3</span>
          </h3>
          <div className="hp-group-items">
            <Link to="/plugins" className="hp-chip">
              工坊 · {pluginCount} 张卡并排
            </Link>
            <Link to={`/demo/${DEMOS[0]?.meta.slug ?? ""}`} className="hp-chip">
              逐项 · 一插件一页
            </Link>
            <Link to="/scenarios" className="hp-chip">
              场景 · 真实流程
            </Link>
          </div>
        </div>
      </div>

      <h2 className="hp-section-title">插件清单</h2>
      <div className="hp-demos-index">
        {DEMOS.map((d, i) => (
          <Link key={d.meta.slug} to={`/demo/${d.meta.slug}`} className="hp-idx-card">
            <div className="hp-idx-top">
              <span className="hp-idx-no">{String(i + 1).padStart(2, "0")}</span>
              <h3>{d.meta.title}</h3>
            </div>
            <p>{d.meta.intro}</p>
            <div className="hp-idx-foot">
              <span className="hp-tag">{GROUP_META[d.meta.group].label}</span>
              {d.meta.plugin ? <span className="hp-tag">{d.meta.plugin}</span> : null}
              <span className="hp-tag">
                {d.meta.controls?.length ?? 0} params
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
