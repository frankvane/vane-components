/**
 * 总览页
 *
 * 「这是什么 + 从哪看起」：三个入口 —— 插件工坊（勾选即装配）、场景示例（组合成真实运营位）、
 * 逐项示例（每个插件的单页用法）。原子插件只解决一件事，工坊与场景把它拼回业务。
 */
import React from "react";
import { DEMOS } from "../demos/registry";
import { PLUGINS } from "../data/plugins";
import { SCENARIOS, USED_PLUGINS } from "../scenarios/catalog";

export function HomePage() {
  return (
    <article>
      <header className="page-head">
        <div>
          <p className="eyebrow">overview · 总览</p>
          <h1 className="page-title">每日签到</h1>
        </div>
        <div className="page-facts">
          <div>
            <b>{PLUGINS.length}</b>
            <span>plugins</span>
          </div>
          <div>
            <b>{SCENARIOS.length}</b>
            <span>plates</span>
          </div>
          <div>
            <b>{DEMOS.length}</b>
            <span>demos</span>
          </div>
        </div>
      </header>

      <p className="page-sub">
        插件式 React 组件的演示台：{PLUGINS.length} 个原子插件按「头部 / 日历 / 奖励 / 操作 / 底部」
        五个槽位协同，组合出电商签到、游戏连签、会员中心等真实运营位。逐一拆解看用法，去
        <b>插件工坊</b>勾选即装配，去<b>场景示例</b>看组合后的完整业务界面。
      </p>

      <section className="demo-stage home-cards">
        <a className="home-card" href="#/plugins">
          <span className="home-card-kicker">workshop</span>
          <b>插件工坊</b>
          <span className="home-card-desc">
            {PLUGINS.length} 个插件按五区排列，勾选即装配 —— 右侧预览是真的在跑，不是示意图。
          </span>
        </a>
        <a className="home-card" href="#/scenarios">
          <span className="home-card-kicker">plates</span>
          <b>场景示例</b>
          <span className="home-card-desc">
            {SCENARIOS.length} 个真实版式（{USED_PLUGINS.length} 个插件组合），左侧运行右侧给最小装配代码。
          </span>
        </a>
        <a className="home-card" href="#/demo/basic">
          <span className="home-card-kicker">demos</span>
          <b>逐项示例</b>
          <span className="home-card-desc">
            {DEMOS.length} 页，每页只装一个插件看它的独立行为，源码就是正在跑的那份。
          </span>
        </a>
      </section>
    </article>
  );
}
