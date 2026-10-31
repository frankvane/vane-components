/**
 * 总览页（模板版）
 *
 * 只放「这是什么 + 从哪看起」。真站点这里通常再放几个数字（插件数 / 示例数 /
 * 场景数）与两三个入口按钮 —— 见 vane-sku 的 pages/HomePage.tsx。
 */
import React from "react";
import { DEMOS } from "../demos/registry";

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
            <b>{DEMOS.length}</b>
            <span>demos</span>
          </div>
        </div>
      </header>

      <p className="page-sub">
        插件式 React 组件的演示台：左侧「逐项示例」逐页看用法，每页展示的源码就是那一页正在跑的那份。
        外壳（顶栏 / 侧栏 / 兜底）与其它组件包完全一致，只有主题色不同。
      </p>

      <section className="demo-stage">
        <p style={{ margin: 0, color: "var(--dim)", fontSize: 14 }}>
          从左侧「逐项示例」开始；新增一页 = 在 <code>demo/src/demos/</code> 里加一个
          <code> NN-slug.tsx</code>，导出 <code>meta</code> 与默认 Stage 即可，导航与编号自动生成。
        </p>
      </section>
    </article>
  );
}
