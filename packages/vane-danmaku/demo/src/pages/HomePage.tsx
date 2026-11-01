/**
 * 总览页
 *
 * 「这是什么 + 从哪看起」：三个入口 —— 插件工坊（勾选即装配）、场景示例（组合成真实运营位）、
 * 逐项示例（每个插件的单页用法）。原子插件只解决一件事，工坊与场景把它拼回业务。
 */
import React from "react";
import { DEMOS } from "../demos/registry";
import { PLUGINS } from "../data/plugins";
import { SCENARIOS } from "../scenarios/catalog";

export function HomePage() {
  return (
    <article className="home">
      <header className="page-head">
        <div>
          <p className="eyebrow">overview · 总览</p>
          <h1 className="page-title">弹幕播放器</h1>
        </div>
        <div className="page-facts">
          <div>
            <b>{PLUGINS.length}</b>
            <span>plugins</span>
          </div>
          <div>
            <b>{SCENARIOS.length}</b>
            <span>scenes</span>
          </div>
          <div>
            <b>{DEMOS.length}</b>
            <span>demos</span>
          </div>
        </div>
      </header>

      <p className="page-sub">
        插件式 React 弹幕组件：Canvas/WebGL 内核独占渲染与轨道调度，{PLUGINS.length} 个业务语义插件
        经 <code>transformData</code> 改写弹幕流、写 <code>renderHint</code>，由内核统一消费。
        逐一拆解看用法，去<b>插件工坊</b>勾选即装配，去<b>场景示例</b>看组合后的完整业务界面。
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
          <span className="home-card-kicker">scenes</span>
          <b>场景示例</b>
          <span className="home-card-desc">
            {SCENARIOS.length} 个真实版式（含 MediaPipe 实时防遮挡），左侧运行右侧给最小装配代码。
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

      <section className="home-start">
        <div className="home-start-step">
          <span>01</span>
          <div>
            <b>看单插件</b>
            <span>逐项示例每页只装一个插件，先把独立行为看明白。</span>
          </div>
        </div>
        <div className="home-start-step">
          <span>02</span>
          <div>
            <b>去工坊装配</b>
            <span>勾选想要的插件，右侧即时出可运行的预览与装配代码。</span>
          </div>
        </div>
        <div className="home-start-step">
          <span>03</span>
          <div>
            <b>套场景落地</b>
            <span>场景示例把原子插件拼成真实运营位，抄最小装配代码即可。</span>
          </div>
        </div>
      </section>

      <footer className="home-foot">
        <span>
          {PLUGINS.length} 插件 · {SCENARIOS.length} 场景 · {DEMOS.length} 示例，全部可勾选装配
        </span>
        <a href="#/demo/basic">从最小可用开始 →</a>
      </footer>
    </article>
  );
}
