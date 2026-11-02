/**
 * 总览页
 *
 * 「这是什么 + 从哪看起 + 数字」。插件数从 data/plugins 取真源，
 * 与左侧「逐项示例」的 DEMOS 数保持同源。
 */
import React from "react";
import { DEMOS } from "../demos/registry";
import { PLUGINS } from "../data/plugins";

export function HomePage() {
  return (
    <article>
      <header className="page-head">
        <div>
          <p className="eyebrow">overview · 总览</p>
          <h1 className="page-title">多向弹层</h1>
        </div>
        <div className="page-facts">
          <div>
            <b>{PLUGINS.length}</b>
            <span>plugins</span>
          </div>
          <div>
            <b>{DEMOS.length}</b>
            <span>demos</span>
          </div>
        </div>
      </header>

      <p className="page-sub">
        插件式 React 抽屉弹层：内核只做几何（上下左右四向抽伸 + snap 状态机 + Pointer Events
        拖拽 + 纯函数 <code>resolveSnap</code> 决策），遮罩 / 把手 / 档位点 / 键盘避让 / 焦点圈定全是插件。
        对标 react-modal-sheet 的能力集，但零第三方运行时依赖 —— 动画与手势不靠
        motion，靠原生 Pointer Events + CSS transform 补间。
      </p>

      <section className="demo-stage">
        <p style={{ margin: 0, color: "var(--dim)", fontSize: 14, lineHeight: 1.8 }}>
          从左侧「逐项示例」开始：<b>00</b> 是经典联系人选择（截图场景），<b>01</b> 拖控件看
          codegen 实时生成装配代码，<b>05</b> 演示命令式 <code>snapTo</code> 与
          <code> progress </code>逐帧联动。新增一页 = 在 <code>demo/src/demos/</code>{" "}
          里加一个 <code>NN-slug.tsx</code>，导出 <code>meta</code> 与默认 Stage 即可。
        </p>
      </section>
    </article>
  );
}
