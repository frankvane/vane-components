/**
 * 总览页
 *
 * 「这是什么 + 从哪看起」：顶部三个数字（插件 / 场景 / 示例），下面三个入口卡。
 */
import React from "react";
import { Link } from "react-router-dom";
import { DEMOS } from "../demos/registry";
import { PLUGINS } from "../data/plugins";
import { SCENARIOS } from "../scenarios/catalog";

export function HomePage() {
  return (
    <article>
      <header className="page-head">
        <div>
          <p className="eyebrow">overview · 总览</p>
          <h1 className="page-title">营销活动</h1>
        </div>
        <div className="page-facts">
          <div>
            <b>{PLUGINS.length}</b>
            <span>plugins</span>
          </div>
          <div>
            <b>{SCENARIOS.length}</b>
            <span>scenarios</span>
          </div>
          <div>
            <b>{DEMOS.length}</b>
            <span>demos</span>
          </div>
        </div>
      </header>

      <p className="page-sub">
        插件式 React 营销活动容器：任务 / 进度 / 奖励 / 规则按需装配。左侧「逐项示例」逐页看用法，
        每页展示的源码就是那一页正在跑的那份。外壳（顶栏 / 侧栏 / 兜底）与其它组件包完全一致，只有主题色不同。
      </p>

      <section className="demo-stage">
        <div style={{ display: "grid", gap: 12 }}>
          <Link className="card" to="/plugins" style={{ display: "block" }}>
            <div className="doc-head" style={{ border: 0, margin: 0, padding: 0 }}>
              <code>插件工坊</code>
              <span className="tag tag-accent">{PLUGINS.length} plugins</span>
            </div>
            <p className="doc-desc" style={{ margin: "8px 0 0" }}>
              勾选即装配：核心闭环（任务 / 奖励）+ 进度展示 + 规则说明，右侧预览实时运行。
            </p>
          </Link>

          <Link className="card" to="/scenarios" style={{ display: "block" }}>
            <div className="doc-head" style={{ border: 0, margin: 0, padding: 0 }}>
              <code>场景示例</code>
              <span className="tag tag-accent">{SCENARIOS.length} plates</span>
            </div>
            <p className="doc-desc" style={{ margin: "8px 0 0" }}>
              每日签到 / 限时秒杀等真实版式，左侧是真实运行的组件，右侧贴完整源码。
            </p>
          </Link>

          <Link className="card" to="/demo" style={{ display: "block" }}>
            <div className="doc-head" style={{ border: 0, margin: 0, padding: 0 }}>
              <code>逐项示例</code>
              <span className="tag">{DEMOS.length} demos</span>
            </div>
            <p className="doc-desc" style={{ margin: "8px 0 0" }}>
              从左侧「逐项示例」开始；新增一页 = 在 <code>demo/src/demos/</code> 里加一个
              <code> NN-slug.tsx</code>，导出 <code>meta</code> 与默认 Stage 即可。
            </p>
          </Link>
        </div>
      </section>
    </article>
  );
}
